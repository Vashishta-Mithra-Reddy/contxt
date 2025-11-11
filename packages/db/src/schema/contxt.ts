import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  vector,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { user } from "./auth";


export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  settings: jsonb("settings").$default(() => ({
    similarity_threshold: 0.65,
    top_k: 6,
    included_sections: [],
    embedding_model: "gemini-embedding-001",
  })),
  retrievalMode: text("retrieval_mode").default("chunk"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title"),
  sourceType: text("source_type"), // e.g. 'file', 'api', 'manual'
  sourcePath: text("source_path"), // file name or URL
  content: text("content"),
  parsedContent: jsonb("parsed_content"),
  metadata: jsonb("metadata").default({}),
  status: text("status").default("active"), // 'active' | 'archived'
  retrievalMode: text("retrieval_mode"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chunks = pgTable("chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, {
    onDelete: "cascade",
  }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index"),
  chunkText: text("chunk_text").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }), // Gemini embedding dimensions
  metadata: jsonb("metadata").default({}),
  contentHash: text("content_hash"), // dedup tracking
  createdAt: timestamp("created_at").defaultNow(),
});

export const rows = pgTable("rows", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, {
    onDelete: "cascade",
  }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  recordKey: text("record_key"), // e.g. "product_123", "row_5", or custom key from the document data
  data: jsonb("data").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  metadata: jsonb("metadata").default({}),
  contentHash: text("content_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const syncQueue = pgTable("sync_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  externalId: text("external_id"),
  type: text("type"), // e.g. 'faq_entry', 'article'
  content: text("content"),
  metadata: jsonb("metadata").default({}),
  status: text("status").default("pending"), // 'pending' | 'embedded' | 'skipped'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const queries = pgTable("queries", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  queryText: text("query_text").notNull(),
  responseText: text("response_text"),
  relevantChunks: jsonb("relevant_chunks"), // array of retrieved chunks + sim
  similarityUsed: real("similarity_used"),
  errorMessage: text("error_message"),
  retries: integer("retries").default(0),
  modelUsed: text("model_used").default("gemini"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }), // nullable for global scope
  name: text("name").notNull(), // e.g. 'Production Key'
  keyPrefix: text("key_prefix").notNull(), // e.g. 'ctx_live_'
  keyHash: text("key_hash").notNull(), // hashed API key
  permissions: text("permissions").array().default(["read"]),
  neverExpires: boolean("never_expires").default(false),
  expiresAt: timestamp("expires_at"),
  lastUsed: timestamp("last_used"),
  revoked: boolean("revoked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  event: text("event").notNull(), // e.g. 'on_embedding_complete'
  secret: text("secret"),
  createdAt: timestamp("created_at").defaultNow(),
});
