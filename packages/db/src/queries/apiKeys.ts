import { db } from "../index";
import { apiKeys, projects } from "../schema/contxt";
import { and, eq } from "drizzle-orm";
import type { AuthContext } from "./types";
import { ApiKeyCreateSchema } from "./types";

export async function createApiKey(ctx: AuthContext, input: unknown) {
  if (ctx.kind !== "session") throw new Error("Session required");
  const parsed = ApiKeyCreateSchema.parse(input);
  const [proj] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, parsed.projectId), eq(projects.userId, ctx.userId)));
  if (!proj) throw new Error("Project not found or access denied");

  const [row] = await db
    .insert(apiKeys)
    .values({
      userId: ctx.userId,
      projectId: parsed.projectId,
      name: parsed.name,
      keyPrefix: parsed.keyPrefix,
      keyHash: parsed.keyHash,
      permissions: parsed.permissions,
      neverExpires: parsed.neverExpires,
      expiresAt: parsed.expiresAt,
      revoked: false,
    })
    .returning();
  return row;
}

export async function listApiKeysForProject(ctx: AuthContext, projectId: string) {
  if (ctx.kind !== "session") throw new Error("Session required");
  const [proj] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.userId)));
  if (!proj) throw new Error("Project not found or access denied");
  return db.select().from(apiKeys).where(eq(apiKeys.projectId, projectId));
}

export async function revokeApiKey(ctx: AuthContext, id: string) {
  if (ctx.kind !== "session") throw new Error("Session required");
  const [row] = await db.update(apiKeys).set({ revoked: true }).where(eq(apiKeys.id, id)).returning();
  return row;
}