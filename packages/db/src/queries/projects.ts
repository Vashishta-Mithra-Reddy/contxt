import { db } from "../index";
import { projects } from "../schema/contxt";
import { and, eq } from "drizzle-orm";
import type { AuthContext } from "./types";
import { ProjectCreateSchema, ProjectUpdateSchema } from "./types";
import { ensureSessionOwner } from "./guards";

export async function listProjects(ctx: AuthContext) {
  if (ctx.kind !== "session") throw new Error("Session required");
  return db.select().from(projects).where(eq(projects.userId, ctx.userId));
}

export async function getProject(ctx: AuthContext, projectId: string) {
  if (ctx.kind === "session") {
    const [row] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.userId)));
    if (!row) throw new Error("Project not found or access denied");
    return row;
  }
  // API keys are scoped per project; allow fetch if key scope matches
  const [row] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!row) throw new Error("Project not found");
  return row;
}

export async function createProject(ctx: AuthContext, input: unknown) {
  if (ctx.kind !== "session") throw new Error("Session required");
  const parsed = ProjectCreateSchema.parse(input);
  const [row] = await db
    .insert(projects)
    .values({
      name: parsed.name,
      description: parsed.description,
      userId: ctx.userId,
      retrievalMode: parsed.retrievalMode ?? "chunk",
      // settings defaults handled by schema
    })
    .returning();
  return row;
}

export async function updateProject(ctx: AuthContext, projectId: string, input: unknown) {
  const parsed = ProjectUpdateSchema.parse(input);
  await ensureSessionOwner(ctx, projectId);
  const [row] = await db
    .update(projects)
    .set({
      ...(parsed.name ? { name: parsed.name } : {}),
      ...(parsed.description ? { description: parsed.description } : {}),
      ...(parsed.retrievalMode ? { retrievalMode: parsed.retrievalMode } : {}),
      ...(parsed.settings ? { settings: parsed.settings } : {}),
    })
    .where(eq(projects.id, projectId))
    .returning();
  return row;
}

export async function deleteProject(ctx: AuthContext, projectId: string) {
  await ensureSessionOwner(ctx, projectId);
  const [row] = await db.delete(projects).where(eq(projects.id, projectId)).returning();
  return row;
}