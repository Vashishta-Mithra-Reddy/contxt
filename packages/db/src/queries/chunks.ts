import { db } from "../index";
import { chunks } from "../schema/contxt";
import { and, eq } from "drizzle-orm";
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