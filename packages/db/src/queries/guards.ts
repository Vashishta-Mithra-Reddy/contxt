import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { apiKeys, projects } from "../schema/contxt";
import type { AuthContext, Permission } from "./types";
import { createHash } from "crypto";

export async function resolveApiKey(keyHash: string) {
  // Recognize WORKER_BEARER_TOKEN as a global API key with admin/embed permissions
  const workerToken = process.env.WORKER_BEARER_TOKEN;
  if (workerToken) {
    const workerHash = createHash("sha256").update(workerToken).digest("hex");
    if (keyHash === workerHash) {
      return {
        id: "global-worker",
        userId: "system",
        projectId: null,
        name: "Global Worker",
        keyPrefix: "ctx_worker_",
        keyHash: workerHash,
        permissions: ["read", "write", "embed", "admin"],
        neverExpires: true,
        expiresAt: null,
        lastUsed: null,
        revoked: false,
        createdAt: new Date(),
      } as any;
    }
  }

  const [key] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
  if (!key || key.revoked) {
    throw new Error("Invalid or revoked API key");
  }
  return key;
}

export async function ensureProjectAccess(ctx: AuthContext, projectId: string) {
  if (ctx.kind === "session") {
    const [proj] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.userId)));
    if (!proj) throw new Error("Project not found or access denied");
    return { project: proj, permissions: ["admin"] as Permission[] };
  }

  const key = await resolveApiKey(ctx.keyHash);
  if (key.projectId && key.projectId !== projectId) {
    throw new Error("API key not scoped to this project");
  }
  const [proj] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!proj) throw new Error("Project not found");

  const perms = key.permissions?.length ? (key.permissions as Permission[]) : (["read"] as Permission[]);
  return { project: proj, permissions: perms };
}

export function requirePermission(perms: Permission[], required: Permission | Permission[]) {
  const need = Array.isArray(required) ? required : [required];
  if (perms.includes("admin")) return;
  const ok = need.every((r) => perms.includes(r));
  if (!ok) throw new Error("Insufficient permissions");
}

export async function ensureSessionOwner(ctx: AuthContext, projectId: string) {
  if (ctx.kind !== "session") throw new Error("Session required");
  const [proj] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.userId)));
  if (!proj) throw new Error("Project not found or access denied");
  return proj;
}