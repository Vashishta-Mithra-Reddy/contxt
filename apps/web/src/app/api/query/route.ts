import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI, type GenerationConfig } from "@google/genai";
import {
  assertProjectAccess,
  searchChunksByEmbedding,
  logQuery,
} from "@contxt/auth/queries";

// Request schema
const querySchema = z.object({
  projectId: z.string().uuid(),
  query: z.string().min(1),
  topK: z.number().int().min(1).max(50).optional(),
  threshold: z.number().min(0).max(1).optional(),
  model: z.enum(["openai", "gemini"]).optional(), // reserved for future
});

// Embedding helper (OpenAI embeddings, 1536 dims)
async function embedOpenAI(text: string, model = process.env.EMBEDDINGS_MODEL || "text-embedding-3-small") {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input: text }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error?.message || "OpenAI embeddings failed");
  }
  const json = await res.json();
  const embedding = (json?.data?.[0]?.embedding as number[]) || [];
  return embedding;
}

// Answer generation (Gemini)
export async function generateAnswerWithGemini(
  query: string,
  contexts: Array<{ text: string; similarity: number }>
): Promise<string> {
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set");
    throw new Error("GEMINI_API_KEY not set");
  }

  try {
    // 1. Initialize with the new SDK
    const genAI = new GoogleGenAI({ apiKey });

    // If no usable contexts, return grounded fallback
    const safeContexts = contexts.filter((c) => c.text && c.text.trim().length > 0);
    if (safeContexts.length === 0) {
      return "I don't know based on the provided context.";
    }

    const contextText = safeContexts
      .map((c, i) => `Context #${i + 1} [sim=${c.similarity.toFixed(3)}]:\n${c.text}`)
      .join("\n\n---\n");

    const prompt =
      `You are a helpful assistant. You must answer the question strictly based on the provided context.\n` +
      `If the answer is not in the context, say "I don't know based on the provided context."\n\n` +
      `---BEGIN CONTEXT---\n` +
      `${contextText}\n` +
      `---END CONTEXT---\n\n` +
      `Question:\n${query}\n\n` +
      `Answer:`;

    const generationConfig: GenerationConfig = {
      maxOutputTokens: 1024,
    };

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: generationConfig,
    });

    // Removed noisy console.log(prompt)
    return response.text ?? "";
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      (error as any).response?.promptFeedback?.blockReason
    ) {
      return `Generation blocked due to: ${(error as any).response.promptFeedback.blockReason}`;
    }
    return "I am sorry, an error occurred while generating the answer.";
  }
}

export async function POST(req: Request) {
  const hdrs = await headers();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = querySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query payload" }, { status: 400 });
  }

  const { projectId, query, topK: topKIn, threshold: thresholdIn } = parsed.data;

  // Detect mode for reporting (auth guards will enforce access)
  const authHeader = hdrs.get("authorization") || hdrs.get("Authorization");
  const mode = authHeader?.toLowerCase().startsWith("bearer ") ? "apiKey" : "session";

  try {
    // Explicitly assert project access up front (ensures token scope matches body)
    await assertProjectAccess(hdrs, projectId, "read");

    // Use project defaults if not provided
    const defaultTopK = 6;
    const defaultThreshold = 0.65;
    const topK = typeof topKIn === "number" ? topKIn : defaultTopK;
    const threshold = typeof thresholdIn === "number" ? thresholdIn : defaultThreshold;

    // Embed query
    const embedding = await embedOpenAI(query);

    // Retrieve top-K results by cosine similarity
    const rows = await searchChunksByEmbedding(hdrs, projectId, embedding, topK, threshold);

    // FIX: Use camelCase keys from Drizzle and filter out empty texts
    const contexts = rows
      .map((r: any) => ({
        id: r.id,
        documentId: r.documentId ?? null,
        chunkIndex: r.chunkIndex ?? 0,
        similarity: typeof r.similarity === "number" ? r.similarity : Number(r.similarity) || 0,
        text: r.chunkText ?? "",
        metadata: r.metadata || {},
      }))
      .filter((c) => c.text && c.text.trim().length > 0);

    // Generate answer
    const answer = await generateAnswerWithGemini(
      query,
      contexts.map((c) => ({ text: c.text, similarity: c.similarity }))
    );

    // Log query
    try {
      await logQuery(hdrs, {
        projectId,
        queryText: query,
        responseText: answer,
        relevantChunks: contexts,
        similarityUsed: threshold,
        modelUsed: "gemini",
      });
    } catch {
      // Non-fatal; proceed even if logging fails
    }

    return NextResponse.json({
      ok: true,
      mode,
      projectId,
      query,
      topK,
      threshold,
      answer,
      chunks: contexts,
    });
  } catch (err: any) {
    const msg = err?.message || "Query failed";
    const code =
      msg.includes("Unauthorized") || msg.includes("access denied") ? 403 :
      msg.includes("Invalid") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}