import { db } from "../index";
import { rows, documents } from "../schema/contxt";
import { and, eq, gt, desc, sql, cosineDistance } from "drizzle-orm";
import type { AuthContext } from "./types";
import { ensureProjectAccess, requirePermission } from "./guards";

export async function listRowsByProject(ctx: AuthContext, projectId: string) {
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "read");
  return db.select().from(rows).where(eq(rows.projectId, projectId));
}

export async function insertRows(
  ctx: AuthContext,
  projectId: string,
  items: Array<{
    data: Record<string, any>;
    recordKey: string | null;
    documentId: string | null;
    embedding: number[];
    metadata?: Record<string, any>;
    contentHash?: string | null;
  }>
) {
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "embed");
  if (!items.length) return [];
  const values = items.map((it) => ({
    projectId,
    data: it.data,
    recordKey: it.recordKey,
    documentId: it.documentId,
    embedding: it.embedding as any,
    metadata: it.metadata ?? {},
    contentHash: it.contentHash ?? null,
  }));
  return db.insert(rows).values(values).returning();
}

export async function deleteRowsForDocument(ctx: AuthContext, projectId: string, documentId: string) {
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "embed");
  return db
    .delete(rows)
    .where(and(eq(rows.projectId, projectId), eq(rows.documentId, documentId)))
    .returning();
}

export async function searchRowsByEmbedding(
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

  const similarity = sql<number>`1 - (${cosineDistance(rows.embedding, embedding)})`;

  // Only search against active documents; keep archived embeddings intact
  const baseWhere = and(eq(rows.projectId, projectId), eq(documents.status, "active"));
  const whereExpr =
    threshold != null ? and(baseWhere, gt(similarity, threshold)) : baseWhere;

  const result = await db
    .select({
      id: rows.id,
      projectId: rows.projectId,
      documentId: rows.documentId,
      recordKey: rows.recordKey,
      data: rows.data,
      metadata: rows.metadata,
      contentHash: rows.contentHash,
      createdAt: rows.createdAt,
      similarity,
    })
    .from(rows)
    .innerJoin(documents, eq(rows.documentId, documents.id))
    .where(whereExpr)
    .orderBy((fields) => desc(fields.similarity))
    .limit(topK);

  return result;
}