import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@contxt/auth";
import crypto from "node:crypto";
// import OpenAI from 'openai';
// import { GoogleGenAI } from '@google/genai';
import {
  listProjects,
  getProject,
  listDocuments,
  listSyncQueue,
  updateSyncStatus,
  insertChunks as insertChunksViaAuth,
  deleteChunksForDocument as deleteChunksForDocumentViaAuth,
  listPendingSyncGlobal,
  insertRows as insertRowsViaAuth,
  deleteRowsForDocument as deleteRowsForDocumentViaAuth,
} from "@contxt/auth/queries";

// Config
const DEFAULT_LIMIT = 50;

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// const genai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY!,
// });

// Basic chunker: ~1000 chars with ~200 overlap
function chunkText(input: string, size = 1000, overlap = 200) {
  const chunks: string[] = [];
  let i = 0;
  const n = input.length;
  while (i < n) {
    const end = Math.min(i + size, n);
    chunks.push(input.slice(i, end));
    if (end >= n) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

function sha256(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// Embedding helpers
async function embedOpenAI(texts: string[], model = process.env.EMBEDDINGS_MODEL || "text-embedding-3-small") {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input: texts }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error?.message || "OpenAI embeddings failed");
  }
  const json = await res.json();
  return (json.data || []).map((d: any) => d.embedding as number[]);
}

async function embedGemini(texts: string[], model = process.env.EMBEDDINGS_MODEL || "text-embedding-004") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  // Batch endpoint
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: texts.map((t) => ({ model: `models/${model}`, content: { parts: [{ text: t }] } })),
    }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error?.message || "Gemini embeddings failed");
  }
  const json = await res.json();
  // Map from responses[].embeddings.values
  return (json?.responses || []).map((r: any) => (r?.embedding?.values as number[]) || []);
}

function normalizeTo1536(vec: number[]) {
  const DIM = 1536;
  if (vec.length === DIM) return vec;
  if (vec.length > DIM) return vec.slice(0, DIM);
  // pad with zeros
  return [...vec, ...Array(DIM - vec.length).fill(0)];
}

async function embedTexts(texts: string[]) {
  const provider = (process.env.EMBEDDINGS_PROVIDER || "openai").toLowerCase();
  let vectors: number[][];
  if (provider === "gemini") {
    vectors = await embedGemini(texts);
  } else {
    vectors = await embedOpenAI(texts);
  }
  // Ensure 1536 to satisfy vector column
  return vectors.map(normalizeTo1536);
}

async function getUserProjectIds(hdrs: Headers) {
  const projs = await listProjects(hdrs);
  return (projs || []).map((p: any) => p.id);
}

async function getPendingItemsForProject(hdrs: Headers, projectId: string, limit: number) {
  const items = await listSyncQueue(hdrs, projectId);
  return (items || []).filter((it: any) => it.status === "pending").slice(0, limit);
}

async function getDocumentContent(
  hdrs: Headers,
  projectId: string,
  metadata: any,
  fallbackContent: string
) {
  const docId = metadata?.documentId ?? null;
  // Do not read documents table; use content from sync queue
  return { documentId: docId, documentMode: null, content: fallbackContent };
  // if (docId) {
  //   const docs = await listDocuments(hdrs, projectId);
  //   const doc = (docs || []).find((d: any) => d.id === docId);
  //   return { documentId: docId, documentMode: (doc?.retrievalMode as "chunk" | "row") ?? null, content: doc?.content ?? fallbackContent };
  // }
  // return { documentId: null, documentMode: null, content: fallbackContent };
}

async function processOneItem(hdrs: Headers, item: any) {
  const projectId = item.projectId as string;
  const metadata = (item?.metadata || {}) as Record<string, any>;

  const { documentId, documentMode, content } = await getDocumentContent(hdrs, projectId, metadata, item.content || "");
  if (!content || content.trim().length === 0) {
    await updateSyncStatus(hdrs, projectId, item.id, { status: "skipped" });
    return { status: "skipped", id: item.id };
  }

  const selectedPaths: string[] = Array.isArray(metadata?.selectedPaths) ? metadata.selectedPaths : [];
  let rowsEmbedded = 0;

  // 1) Row-based indexing (attempt if content appears structured JSON)
  try {
    let parsed: unknown = null;
    parsed = JSON.parse(content);

    let records: Record<string, any>[] = [];
    if (Array.isArray(parsed) && parsed.every((x) => x && typeof x === "object" && !Array.isArray(x))) {
      records = parsed as Record<string, any>[];
    } else if (parsed && typeof parsed === "object") {
      records = [parsed as Record<string, any>];
    }

    // Respect selectedPaths if provided
    if (selectedPaths.length > 0 && records.length > 0) {
      const pickPaths = (obj: Record<string, any>) => {
        const out: Record<string, any> = {};
        for (const p of selectedPaths) {
          const segs = p.split(".");
          let cur: any = obj;
          for (const s of segs) {
            if (cur == null) break;
            cur = cur[s];
          }
          if (cur !== undefined) {
            out[p] = cur;
          }
        }
        return out;
      };

      records = records
        .map(pickPaths)
        .map((r) => {
          const cleaned: Record<string, any> = {};
          for (const [k, v] of Object.entries(r)) {
            if (v !== undefined) cleaned[k] = v;
          }
          return cleaned;
        })
        .filter((r) => Object.keys(r).length > 0);
    }

    if (records.length > 0) {
      // Compose per-record text for embeddings
      const texts = records.map((r) =>
        Object.entries(r)
          .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
          .join("\n")
      );
      const vectors = await embedTexts(texts);

      // Dedup: remove previous rows for this document
      if (documentId) {
        await deleteRowsForDocumentViaAuth(hdrs, projectId, documentId);
      }

      const itemsToInsert = records.map((r, idx) => ({
        data: r,
        recordKey:
          typeof r.id === "string"
            ? r.id
            : metadata?.recordKey ?? item.externalId ?? `row_${idx}`,
        documentId: documentId || null,
        embedding: vectors[idx],
        metadata: { syncId: item.id, ...(metadata || {}) },
        contentHash: sha256(texts[idx]),
      }));

      if (itemsToInsert.length > 0) {
        await insertRowsViaAuth(hdrs, projectId, itemsToInsert);
        rowsEmbedded = itemsToInsert.length;
      }
    }
  } catch {
    // Non-JSON or parsing failure: skip rows embedding
    rowsEmbedded = 0;
  }

  // 2) Chunk-based indexing (always)
  const parts = chunkText(content);
  const chunkVectors = parts.length ? await embedTexts(parts) : [];

  // Dedup: remove previous chunks for this document
  if (documentId) {
    await deleteChunksForDocumentViaAuth(hdrs, projectId, documentId);
  }

  const chunkRows = parts.map((txt, idx) => ({
    documentId: documentId || null,
    chunkIndex: idx,
    chunkText: txt,
    embedding: chunkVectors[idx],
    metadata: { syncId: item.id, ...(metadata || {}) },
    contentHash: sha256(txt),
  }));

  if (chunkRows.length > 0) {
    await insertChunksViaAuth(hdrs, projectId, chunkRows);
  }

  // Mark sync complete once with totals
  await updateSyncStatus(hdrs, projectId, item.id, { status: "embedded" });
  return { status: "embedded", id: item.id, rows: rowsEmbedded, chunks: chunkRows.length };
}

export async function POST(req: Request) {
  const hdrs = await headers();
  const url = new URL(req.url);
  const projectIdParam = url.searchParams.get("projectId");
  const limitParam = parseInt(url.searchParams.get("limit") || `${DEFAULT_LIMIT}`, 10);
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(1000, limitParam)) : DEFAULT_LIMIT;

  // Mode detection: global vs user vs project API key
  const authHeader = hdrs.get("authorization");
  let isGlobal = false;
  const workerToken = process.env.WORKER_BEARER_TOKEN || "";
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    isGlobal = !!workerToken && token === workerToken;
  }

  const results: any[] = [];
  let processed = 0;
  let embedded = 0;
  let skipped = 0;

  try {
    if (isGlobal) {
      // Global worker: process entire pending queue, optionally restricting to projectId
      let items = await listPendingSyncGlobal(hdrs);
      if (projectIdParam) {
        items = (items || []).filter((it: any) => it.projectId === projectIdParam);
      }
      for (const item of (items || []).slice(0, limit)) {
        try {
          const res = await processOneItem(hdrs, item);
          results.push(res);
          processed += 1;
          if (res.status === "embedded") embedded += 1;
          if (res.status === "skipped") skipped += 1;
          if (processed >= limit) break;
        } catch (e: any) {
          results.push({ status: "error", id: item.id, error: e?.message || String(e) });
        }
      }

      return NextResponse.json({
        ok: true,
        mode: "global",
        projectIds: projectIdParam ? [projectIdParam] : undefined,
        processed,
        embedded,
        skipped,
        results,
      });
    }

    // Session-based: only process user's projects
    const session = await auth.api.getSession({ headers: hdrs });
    if (session?.user?.id) {
      const userProjectIds = await getUserProjectIds(hdrs);
      const targetProjectIds = projectIdParam ? userProjectIds.filter((id) => id === projectIdParam) : userProjectIds;

      for (const pid of targetProjectIds) {
        const pending = await getPendingItemsForProject(hdrs, pid, limit - processed);
        for (const item of pending) {
          try {
            const res = await processOneItem(hdrs, item);
            results.push(res);
            processed += 1;
            if (res.status === "embedded") embedded += 1;
            if (res.status === "skipped") skipped += 1;
            if (processed >= limit) break;
          } catch (e: any) {
            results.push({ status: "error", id: item.id, error: e?.message || String(e) });
          }
        }
        if (processed >= limit) break;
      }

      return NextResponse.json({
        ok: true,
        mode: "user",
        projectIds: targetProjectIds,
        processed,
        embedded,
        skipped,
        results,
      });
    }

    // Project API key mode: requires explicit projectId
    if (!projectIdParam) {
      return NextResponse.json({ error: "Missing projectId for API key mode" }, { status: 400 });
    }

    // Optional: verify project exists and is accessible
    try {
      await getProject(hdrs, projectIdParam);
    } catch {
      return NextResponse.json({ error: "Access denied for projectId" }, { status: 403 });
    }

    const pending = await getPendingItemsForProject(hdrs, projectIdParam, limit);
    for (const item of pending) {
      try {
        const res = await processOneItem(hdrs, item);
        results.push(res);
        processed += 1;
        if (res.status === "embedded") embedded += 1;
        if (res.status === "skipped") skipped += 1;
        if (processed >= limit) break;
      } catch (e: any) {
        results.push({ status: "error", id: item.id, error: e?.message || String(e) });
      }
    }

    return NextResponse.json({
      ok: true,
      mode: "apiKey",
      projectIds: [projectIdParam],
      processed,
      embedded,
      skipped,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Worker failed" }, { status: 500 });
  }
}