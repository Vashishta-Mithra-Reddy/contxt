import { db } from "../index";
import { projects, webhooks } from "../schema/contxt";
import { and, eq } from "drizzle-orm";
import type { AuthContext } from "./types";

export async function registerWebhook(ctx: AuthContext, projectId: string, url: string, event: string, secret?: string) {
  if (ctx.kind !== "session") throw new Error("Session required");
  const [proj] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.userId)));
  if (!proj) throw new Error("Project not found or access denied");

  const [row] = await db
    .insert(webhooks)
    .values({ projectId, url, event, secret })
    .returning();
  return row;
}

export async function listWebhooks(ctx: AuthContext, projectId: string) {
  if (ctx.kind !== "session") throw new Error("Session required");
  const [proj] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.userId)));
  if (!proj) throw new Error("Project not found or access denied");
  return db.select().from(webhooks).where(eq(webhooks.projectId, projectId));
}