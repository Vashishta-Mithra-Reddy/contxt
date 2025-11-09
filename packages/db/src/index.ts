import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
// neonConfig.poolQueryViaFetch = true

const sql = neon(process.env.DATABASE_URL || "");
export const db = drizzle(sql);



export * as ProjectQueries from "./queries/projects";
export * as DocumentQueries from "./queries/documents";
export * as ChunkQueries from "./queries/chunks";
export * as SyncQueueQueries from "./queries/syncQueue";
export * as ApiKeyQueries from "./queries/apiKeys";
export * as QueryLogQueries from "./queries/queryLogs";
export * as WebhookQueries from "./queries/webhooks";

export * from "./queries/types";
export { ensureProjectAccess, ensureSessionOwner, resolveApiKey, requirePermission } from "./queries/guards";
