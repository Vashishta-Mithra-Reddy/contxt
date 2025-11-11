import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
// NOTE: Keep Node runtime for Gemini SDK. If you deploy a retrieval-only variant,
// you can switch to Edge for a big latency win:
// export const runtime = "edge";

import {
  assertProjectAccess,
  searchChunksByEmbedding,
  logQuery,
  searchRowsByEmbedding,
  getProject,
} from "@contxt/auth/queries";

const querySchema = z.object({
  projectId: z.string().uuid(),
  query: z.string().min(1),
  topK: z.number().int().min(1).max(50).optional(),
  threshold: z.number().min(0).max(1).optional(),
  retrievalMode: z.enum(["chunk", "row"]).optional(),
  useLLM: z.boolean().optional(),
  model: z.enum(["openai", "gemini"]).optional(),
});

/* --------------------------- Tiny LRU + TTL ---------------------------- */
// Module-level cache persists per serverless instance (warm invocations).
class LRU<K, V> {
  private map = new Map<K, { v: V; t: number }>();
  constructor(private max = 500, private ttlMs = 60 * 60 * 1000) {} // 1h TTL
  get(k: K): V | undefined {
    const e = this.map.get(k);
    if (!e) return;
    if (Date.now() - e.t > this.ttlMs) {
      this.map.delete(k);
      return;
    }
    // bump
    this.map.delete(k);
    this.map.set(k, { v: e.v, t: e.t });
    return e.v;
    }
  set(k: K, v: V) {
    if (this.map.has(k)) this.map.delete(k);
    this.map.set(k, { v, t: Date.now() });
    if (this.map.size > this.max) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
  }
}
const embeddingCache = new LRU<string, number[]>(1000, 60 * 60 * 1000); // 1h

/* ------------------------- Embedding (OpenAI) -------------------------- */
async function embedOpenAI(
  text: string,
  model = process.env.EMBEDDINGS_MODEL || "text-embedding-3-small"
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const cached = embeddingCache.get(`${model}:${text}`);
  if (cached) return cached;

  // IMPORTANT: keep payload minimal for speed
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input: text }),
    // Low-ish timeout via AbortController pattern could be added if desired.
  });

  if (!res.ok) {
    let details = "";
    try {
      const j = await res.json();
      details = j?.error?.message || "";
    } catch {}
    throw new Error(details || "OpenAI embeddings failed");
  }

  const json = await res.json();
  const embedding = (json?.data?.[0]?.embedding as number[]) || [];
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Empty embedding");
  }
  embeddingCache.set(`${model}:${text}`, embedding);
  return embedding;
}

/* --------------------------- Gemini (on-demand) ------------------------ */
// Lazy-import the SDK to avoid cold-start overhead on retrieval-only calls.
async function generateAnswerWithGemini(
  query: string,
  contexts: Array<{ text: string; similarity: number }>
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  // Defer import until actually needed.
  const { GoogleGenAI } = await import("@google/genai");
  const genAI = new GoogleGenAI({ apiKey });

  const safeContexts = contexts.filter((c) => c.text && c.text.trim().length > 0);
  if (safeContexts.length === 0) {
    return "I don't know based on the provided context.";
  }

  const contextText = safeContexts
    .map((c, i) => `Context #${i + 1} [sim=${c.similarity.toFixed(3)}]:\n${c.text}`)
    .join("\n\n---\n");

  const prompt =
    `You are a helpful assistant. Answer strictly from the provided context.\n` +
    `If absent, say: "I don't know based on the provided context."\n\n` +
    `---BEGIN CONTEXT---\n${contextText}\n---END CONTEXT---\n\n` +
    `Question:\n${query}\n\nAnswer:`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 1024 },
    });
    return response.text ?? "";
  } catch (error: any) {
    if (error?.response?.promptFeedback?.blockReason) {
      return `Generation blocked due to: ${error.response.promptFeedback.blockReason}`;
    }
    return "I am sorry, an error occurred while generating the answer.";
  }
}

/* --------------------------- Fast Obj -> Text -------------------------- */
// Avoid costly JSON.stringify with custom replacer. Bound size to keep prompt lean.
function objectToSnippet(obj: unknown, maxLen = 4000): string {
  if (obj == null) return "";
  if (typeof obj === "string") return obj.slice(0, maxLen);
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  try {
    const s = JSON.stringify(obj);
    return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
  } catch {
    return "";
  }
}

/* ------------------------------- Handler ------------------------------- */
export async function POST(req: Request) {
  const hdrs = await headers();

  // Parse input fast-path
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

  const {
    projectId,
    query,
    topK: topKIn,
    threshold: thresholdIn,
    retrievalMode: modeOverride,
    useLLM: useLLMIn,
  } = parsed.data;

  // Detect mode for reporting
  const authHeader = hdrs.get("authorization") || hdrs.get("Authorization");
  const mode = authHeader?.toLowerCase().startsWith("bearer ") ? "apiKey" : "session";

  // Begin I/O in parallel where safe
  const accessPromise = assertProjectAccess(hdrs, projectId, "read");
  const projectPromise = getProject(hdrs, projectId);

  try {
    // Ensure access before using any project data
    await accessPromise;
    const project = await projectPromise;

    const retrievalMode =
      modeOverride ?? (project?.retrievalMode as "chunk" | "row") ?? "chunk";

    // Pull defaults from project settings with safe fallbacks
    const topKDefault =
      typeof (project as any)?.settings?.top_k === "number"
        ? (project as any).settings.top_k
        : 6;
    const thresholdDefault =
      typeof (project as any)?.settings?.similarity_threshold === "number"
        ? (project as any).settings.similarity_threshold
        : 0.65;

    // Clamp/config
    const topK = Math.max(1, Math.min(50, Math.round(typeof topKIn === "number" ? topKIn : topKDefault)));
    const threshold = Math.max(0, Math.min(1, Number(typeof thresholdIn === "number" ? thresholdIn : thresholdDefault)));
    const useLLM = !!useLLMIn;

    // Parallelize embedding with nothing else that needs it
    const embedding = await embedOpenAI(query);

    // Retrieval
    const results =
      retrievalMode === "row"
        ? await searchRowsByEmbedding(hdrs, projectId, embedding, topK, threshold)
        : await searchChunksByEmbedding(hdrs, projectId, embedding, topK, threshold);

    // Normalize contexts compactly
    const contexts =
      retrievalMode === "row"
        ? (results as any[]).map((r) => {
            const sim = typeof r.similarity === "number" ? r.similarity : Number(r.similarity) || 0;
            const text = objectToSnippet(r.data);
            return text?.trim()
              ? {
                  id: r.id,
                  documentId: r.documentId ?? null,
                  recordKey: r.recordKey ?? null,
                  similarity: sim,
                  text,
                  metadata: r.metadata || {},
                }
              : null;
          }).filter(Boolean) as any[]
        : (results as any[]).map((r) => {
            const sim = typeof r.similarity === "number" ? r.similarity : Number(r.similarity) || 0;
            const text = (r.chunkText ?? "").trim();
            return text
              ? {
                  id: r.id,
                  documentId: r.documentId ?? null,
                  chunkIndex: r.chunkIndex ?? 0,
                  similarity: sim,
                  text,
                  metadata: r.metadata || {},
                }
              : null;
          }).filter(Boolean) as any[];

    // If LLM is off, return immediately (non-blocking log)
    if (!useLLM) {
      // Fire-and-forget logging
      logQuery(hdrs, {
        projectId,
        queryText: query,
        responseText: undefined,
        relevantChunks: contexts,
        similarityUsed: threshold,
        modelUsed: "retrieval-only",
      }).catch(() => {});
      return NextResponse.json({
        ok: true,
        mode,
        projectId,
        query,
        topK,
        threshold,
        retrievalMode,
        chunks: contexts,
      });
    }

    // LLM generation (lazy Gemini import inside function)
    const answer = await generateAnswerWithGemini(
      query,
      contexts.map((c) => ({ text: c.text, similarity: c.similarity }))
    );

    // Non-blocking log
    logQuery(hdrs, {
      projectId,
      queryText: query,
      responseText: answer,
      relevantChunks: contexts,
      similarityUsed: threshold,
      modelUsed: "gemini",
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      mode,
      projectId,
      query,
      topK,
      threshold,
      retrievalMode,
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
