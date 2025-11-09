import { db } from "../index";
import { queries } from "../schema/contxt";
import { eq } from "drizzle-orm";
import type { AuthContext } from "./types";
import { QueryLogSchema } from "./types";
import { ensureProjectAccess, requirePermission } from "./guards";

export async function logQuery(ctx: AuthContext, input: unknown) {
  const parsed = QueryLogSchema.parse(input);
  const { permissions } = await ensureProjectAccess(ctx, parsed.projectId);
  requirePermission(permissions, "read");
  const [row] = await db
    .insert(queries)
    .values({
      projectId: parsed.projectId,
      userId: parsed.userId ?? (ctx.kind === "session" ? ctx.userId : null) ?? null,
      queryText: parsed.queryText,
      responseText: parsed.responseText,
      relevantChunks: parsed.relevantChunks,
      similarityUsed: parsed.similarityUsed,
      errorMessage: parsed.errorMessage,
      retries: parsed.retries ?? 0,
      modelUsed: parsed.modelUsed,
    })
    .returning();
  return row;
}

export async function listQueryLogs(ctx: AuthContext, projectId: string) {
  const { permissions } = await ensureProjectAccess(ctx, projectId);
  requirePermission(permissions, "read");
  return db.select().from(queries).where(eq(queries.projectId, projectId));
}