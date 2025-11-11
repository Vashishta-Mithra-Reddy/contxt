import { db } from "../index";
import { sql } from "drizzle-orm";

export async function ensureVectorIndexes() {
  const created: string[] = [];
  const errors: string[] = [];

  async function tryExec(name: string, stmt: any) {
    try {
      await db.execute(stmt);
      created.push(name);
    } catch (e: any) {
      errors.push(`${name}: ${e?.message || String(e)}`);
    }
  }

  // Vector indexes (prefer HNSW; fall back to IVF)
  await tryExec(
    "chunks_embedding_hnsw_cosine",
    sql`CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_cosine ON chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)`
  );
  await tryExec(
    "rows_embedding_hnsw_cosine",
    sql`CREATE INDEX IF NOT EXISTS rows_embedding_hnsw_cosine ON rows USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)`
  );

  if (errors.some((e) => e.toLowerCase().includes("hnsw"))) {
    await tryExec(
      "chunks_embedding_ivfflat_cosine",
      sql`CREATE INDEX IF NOT EXISTS chunks_embedding_ivfflat_cosine ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
    );
    await tryExec(
      "rows_embedding_ivfflat_cosine",
      sql`CREATE INDEX IF NOT EXISTS rows_embedding_ivfflat_cosine ON rows USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
    );
  }

  // Btree indexes on common filters/joins
  await tryExec("idx_chunks_project_id", sql`CREATE INDEX IF NOT EXISTS idx_chunks_project_id ON chunks (project_id)`);
  await tryExec("idx_chunks_document_id", sql`CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks (document_id)`);
  await tryExec("idx_rows_project_id", sql`CREATE INDEX IF NOT EXISTS idx_rows_project_id ON rows (project_id)`);
  await tryExec("idx_rows_document_id", sql`CREATE INDEX IF NOT EXISTS idx_rows_document_id ON rows (document_id)`);
  await tryExec("idx_documents_status", sql`CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status)`);
  await tryExec("idx_sync_queue_project_status", sql`CREATE INDEX IF NOT EXISTS idx_sync_queue_project_status ON sync_queue (project_id, status)`);
  await tryExec("idx_queries_project_id", sql`CREATE INDEX IF NOT EXISTS idx_queries_project_id ON queries (project_id)`);

  return { created, errors };
}