import { eq } from "drizzle-orm";
import { db } from "../index";
import { documents } from "../schema/contxt";
import type { AuthContext } from "./types";
import { DocumentCreateSchema, DocumentUpdateSchema } from "./types";
import { ensureProjectAccess, requirePermission } from "./guards";

export async function listDocuments(ctx: AuthContext, projectId: string) {
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "read");
  return db.select().from(documents).where(eq(documents.projectId, projectId));
}

export async function createDocument(ctx: AuthContext, projectId: string, input: unknown) {
  const parsed = DocumentCreateSchema.parse(input);
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "write");
  const [row] = await db
    .insert(documents)
    .values({
      projectId,
      title: parsed.title,
      sourceType: parsed.sourceType,
      sourcePath: parsed.sourcePath,
      content: parsed.content,
      retrievalMode: parsed.retrievalMode,
      metadata: parsed.metadata ?? {},
      status: "active",
    })
    .returning();
  return row;
}

export async function updateDocument(ctx: AuthContext, projectId: string, documentId: string, input: unknown) {
  const parsed = DocumentUpdateSchema.parse(input);
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "write");
  const [row] = await db
    .update(documents)
    .set({
      ...(parsed.title ? { title: parsed.title } : {}),
      ...(parsed.sourceType ? { sourceType: parsed.sourceType } : {}),
      ...(parsed.sourcePath ? { sourcePath: parsed.sourcePath } : {}),
      ...(parsed.content ? { content: parsed.content } : {}),
      ...(parsed.retrievalMode ? { retrievalMode: parsed.retrievalMode } : {}),
      ...(parsed.metadata ? { metadata: parsed.metadata } : {}),
      ...(parsed.status ? { status: parsed.status } : {}),
    })
    .where(eq(documents.id, documentId))
    .returning();
  return row;
}