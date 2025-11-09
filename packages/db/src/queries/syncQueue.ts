import { db } from "../index";
import { syncQueue } from "../schema/contxt";
import { and, eq } from "drizzle-orm";
import type { AuthContext } from "./types";
import { SyncQueueItemSchema, UpdateSyncStatusSchema } from "./types";
import { ensureProjectAccess, requirePermission } from "./guards";
import { resolveApiKey } from "./guards";

export async function enqueueSyncItem(ctx: AuthContext, projectId: string, input: unknown) {
  const parsed = SyncQueueItemSchema.parse(input);
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, ["write", "embed"]);
  const [row] = await db
    .insert(syncQueue)
    .values({
      projectId,
      externalId: parsed.externalId,
      type: parsed.type,
      content: parsed.content,
      metadata: parsed.metadata ?? {},
      status: "pending",
    })
    .returning();
  return row;
}

export async function listSyncQueue(ctx: AuthContext, projectId: string) {
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "read");
  return db.select().from(syncQueue).where(eq(syncQueue.projectId, projectId));
}

export async function updateSyncStatus(ctx: AuthContext, projectId: string, id: string, input: unknown) {
  const parsed = UpdateSyncStatusSchema.parse(input);
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "embed");
  const [row] = await db
    .update(syncQueue)
    .set({ status: parsed.status })
    .where(and(eq(syncQueue.projectId, projectId), eq(syncQueue.id, id)))
    .returning();
  return row;
}

export async function listPendingSyncGlobal(ctx: AuthContext) {
  // Only allow global API key (WORKER_BEARER_TOKEN)
  if (ctx.kind !== "apiKey") throw new Error("API key required");
  const key = await resolveApiKey(ctx.keyHash);
  const perms = key.permissions?.length ? (key.permissions as any[]) : ["read"];
  requirePermission(perms, "embed");
  if (key.projectId) {
    throw new Error("Global API key required for full queue processing");
  }
  return db.select().from(syncQueue).where(eq(syncQueue.status, "pending"));
}