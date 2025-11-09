import { db } from "../index";
import { chunks } from "../schema/contxt";
import { and, eq, gt, desc, sql, cosineDistance } from "drizzle-orm";
import type { AuthContext } from "./types";
import { ensureProjectAccess, requirePermission } from "./guards";

export async function listChunksByProject(ctx: AuthContext, projectId: string) {
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "read");
  return db.select().from(chunks).where(eq(chunks.projectId, projectId));
}

export async function listChunksByDocument(ctx: AuthContext, projectId: string, documentId: string) {
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "read");
  return db
    .select()
    .from(chunks)
    .where(and(eq(chunks.projectId, projectId), eq(chunks.documentId, documentId)));
}

export async function insertChunks(
  ctx: AuthContext,
  projectId: string,
  rows: Array<{
    documentId: string | null;
    chunkIndex: number;
    chunkText: string;
    embedding: number[];
    metadata?: Record<string, any>;
    contentHash?: string;
  }>
) {
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "embed");
  if (!rows.length) return [];
  const values = rows.map((r) => ({
    projectId,
    documentId: r.documentId,
    chunkIndex: r.chunkIndex,
    chunkText: r.chunkText,
    embedding: r.embedding as any,
    metadata: r.metadata ?? {},
    contentHash: r.contentHash ?? null,
  }));
  return db.insert(chunks).values(values).returning();
}

export async function deleteChunksForDocument(ctx: AuthContext, projectId: string, documentId: string) {
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "embed");
  // returning() optional; primarily used for side-effects
  return db
    .delete(chunks)
    .where(and(eq(chunks.projectId, projectId), eq(chunks.documentId, documentId)))
    .returning();
}

export async function searchChunksByEmbedding(
  ctx: AuthContext,
  projectId: string,
  embedding: number[],
  topK: number,
  threshold?: number,
) {
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "read");

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Invalid embedding");
  }

  // Similarity = 1 - cosine distance
  const similarity = sql<number>`1 - (${cosineDistance(chunks.embedding, embedding)})`;

  const whereExpr =
    threshold != null
      ? and(eq(chunks.projectId, projectId), gt(similarity, threshold))
      : eq(chunks.projectId, projectId);

  const rows = await db
    .select({
      id: chunks.id,
      projectId: chunks.projectId,
      documentId: chunks.documentId,
      chunkIndex: chunks.chunkIndex,
      chunkText: chunks.chunkText,
      metadata: chunks.metadata,
      contentHash: chunks.contentHash,
      similarity,
    })
    .from(chunks)
    .where(whereExpr)
    .orderBy((fields) => desc(fields.similarity))
    .limit(topK);

  return rows;
}