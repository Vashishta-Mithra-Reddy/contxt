import crypto from "node:crypto";
import { auth } from "./index";
import type { AuthContext } from "@contxt/db";
import {
  ProjectQueries,
  DocumentQueries,
  ChunkQueries,
  SyncQueueQueries,
  ApiKeyQueries,
  QueryLogQueries,
  WebhookQueries,
} from "@contxt/db";

/**
 * Derive AuthContext from request headers.
 * - Authorization: Bearer <apiKey> => apiKey context (SHA-256 hash)
 * - Better-Auth session => session context with userId
 * Throws if neither is present.
 */
export async function deriveAuthContextFromHeaders(headers: Headers): Promise<AuthContext> {
  // Try Bearer token first (API key)
  const authz = headers.get("authorization") || headers.get("Authorization");
  if (authz && authz.startsWith("Bearer ")) {
    const apiKey = authz.slice("Bearer ".length).trim();
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    return { kind: "apiKey", keyHash };
  }

  // Fall back to session (Better Auth)
  const session = await auth.api.getSession({ headers });
  if (session?.user?.id) {
    return { kind: "session", userId: session.user.id };
  }

  throw new Error("Unauthorized");
}

/**
 * Projects
 */
export async function listProjects(headers: Headers) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  // Session-only
  // if (ctx.kind !== "session") throw new Error("Session required");
  return ProjectQueries.listProjects(ctx);
}

export async function createProject(headers: Headers, input: unknown) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  if (ctx.kind !== "session") throw new Error("Session required");
  return ProjectQueries.createProject(ctx, input);
}

export async function getProject(headers: Headers, projectId: string) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  return ProjectQueries.getProject(ctx, projectId);
}

export async function updateProject(headers: Headers, projectId: string, input: unknown) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  if (ctx.kind !== "session") throw new Error("Session required");
  return ProjectQueries.updateProject(ctx, projectId, input);
}

export async function deleteProject(headers: Headers, projectId: string) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  if (ctx.kind !== "session") throw new Error("Session required");
  return ProjectQueries.deleteProject(ctx, projectId);
}

/**
 * Documents
 */
export async function listDocuments(headers: Headers, projectId: string) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  return DocumentQueries.listDocuments(ctx, projectId);
}

export async function createDocument(headers: Headers, projectId: string, input: unknown) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  return DocumentQueries.createDocument(ctx, projectId, input);
}

export async function updateDocument(
  headers: Headers,
  projectId: string,
  documentId: string,
  input: unknown,
) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  return DocumentQueries.updateDocument(ctx, projectId, documentId, input);
}

/**
 * Chunks
 */
export async function listChunksByProject(headers: Headers, projectId: string) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  return ChunkQueries.listChunksByProject(ctx, projectId);
}

export async function listChunksByDocument(
  headers: Headers,
  projectId: string,
  documentId: string,
) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  return ChunkQueries.listChunksByDocument(ctx, projectId, documentId);
}

/**
 * Sync Queue
 */
export async function enqueueSyncItem(headers: Headers, projectId: string, input: unknown) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  return SyncQueueQueries.enqueueSyncItem(ctx, projectId, input);
}

export async function listSyncQueue(headers: Headers, projectId: string) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  return SyncQueueQueries.listSyncQueue(ctx, projectId);
}

export async function updateSyncStatus(headers: Headers, projectId: string, id: string, input: unknown) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  return SyncQueueQueries.updateSyncStatus(ctx, projectId, id, input);
}

/**
 * API Keys (session-only)
 */
export async function createApiKey(headers: Headers, input: unknown) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  if (ctx.kind !== "session") throw new Error("Session required");
  return ApiKeyQueries.createApiKey(ctx, input);
}

export async function listApiKeysForProject(headers: Headers, projectId: string) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  if (ctx.kind !== "session") throw new Error("Session required");
  return ApiKeyQueries.listApiKeysForProject(ctx, projectId);
}

export async function revokeApiKey(headers: Headers, id: string) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  if (ctx.kind !== "session") throw new Error("Session required");
  return ApiKeyQueries.revokeApiKey(ctx, id);
}

/**
 * Query Logs
 */
export async function logQuery(headers: Headers, input: unknown) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  return QueryLogQueries.logQuery(ctx, input);
}

export async function listQueryLogs(headers: Headers, projectId: string) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  return QueryLogQueries.listQueryLogs(ctx, projectId);
}

/**
 * Webhooks (session-only)
 */
export async function registerWebhook(headers: Headers, projectId: string, url: string, event: string, secret?: string) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  if (ctx.kind !== "session") throw new Error("Session required");
  return WebhookQueries.registerWebhook(ctx, projectId, url, event, secret);
}

export async function listWebhooks(headers: Headers, projectId: string) {
  const ctx = await deriveAuthContextFromHeaders(headers);
  if (ctx.kind !== "session") throw new Error("Session required");
  return WebhookQueries.listWebhooks(ctx, projectId);
}