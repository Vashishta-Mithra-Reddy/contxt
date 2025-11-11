import { z } from "zod";

export type Permission = "read" | "write" | "embed" | "admin";

export type AuthContext =
  | { kind: "session"; userId: string }
  | { kind: "apiKey"; keyHash: string };

export const ProjectCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  retrievalMode: z.enum(["chunk", "row"]).optional(),
});

export const ProjectUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  retrievalMode: z.enum(["chunk", "row"]).optional(),
  settings: z
    .object({
      similarity_threshold: z.number().min(0).max(1).optional(),
      top_k: z.number().int().min(1).max(50).optional(),
      included_sections: z.array(z.string()).optional(),
      embedding_model: z.string().optional(),
    })
    .partial()
    .optional(),
});

export const DocumentCreateSchema = z
  .object({
    title: z.string().optional(),
    sourceType: z.string().optional(),
    sourcePath: z.string().optional(),
    content: z.string(),
    parsedContent: z.any().optional(),
    retrievalMode: z.enum(["chunk", "row"]).optional(),
    // Allow arbitrary metadata but prefer standard file metadata when present
    metadata: z
      .object({
        key: z.string().min(1).optional(),
        contentType: z.string().min(1).optional(),
        size: z.number().positive().optional(),
      })
      .passthrough()
      .optional(),
  })
  .refine(
    (data) => {
      if (data.sourceType === "file") {
        const m = data.metadata ?? {};
        return (
          typeof m.key === "string" &&
          m.key.length > 0 &&
          typeof m.contentType === "string" &&
          m.contentType.length > 0 &&
          typeof m.size === "number" &&
          m.size > 0
        );
      }
      return true;
    },
    {
      path: ["metadata"],
      message: "Missing file metadata for sourceType='file'",
    }
  );

export const DocumentUpdateSchema = z.object({
  title: z.string().optional(),
  sourceType: z.string().optional(),
  sourcePath: z.string().optional(),
  content: z.string().optional(),
  parsedContent: z.any().optional(),
  retrievalMode: z.enum(["chunk", "row"]).optional(),
  selectedPaths: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export const SyncQueueItemSchema = z.object({
  externalId: z.string().optional(),
  type: z.string().optional(),
  content: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const UpdateSyncStatusSchema = z.object({
  status: z.enum(["pending", "embedded", "skipped"]),
});

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(2),
  keyPrefix: z.string().min(3),
  keyHash: z.string().min(10),
  permissions: z.array(z.enum(["read", "write", "embed", "admin"])).default(["read"]),
  neverExpires: z.boolean().default(false),
  expiresAt: z.date().optional(),
  projectId: z.uuid(),
});

export const QueryLogSchema = z.object({
  projectId: z.uuid(),
  userId: z.string().optional(),
  queryText: z.string().min(1),
  responseText: z.string().optional(),
  relevantChunks: z.any().optional(),
  similarityUsed: z.number().optional(),
  errorMessage: z.string().optional(),
  retries: z.number().int().optional(),
  modelUsed: z.string().default("gemini"),
});