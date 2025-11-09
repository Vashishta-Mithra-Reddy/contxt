import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { listChunksByDocument } from "@contxt/auth/queries";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string; docId: string }> }
) {
  const hdrs = await headers();
  const { id, docId } = await context.params;

  try {
    const chunks = await listChunksByDocument(hdrs, id, docId);
    const out = chunks.map((c: any) => ({
      id: c.id,
      projectId: c.projectId,
      documentId: c.documentId,
      chunkIndex: c.chunkIndex,
      chunkText: c.chunkText,
      metadata: c.metadata,
      contentHash: c.contentHash,
      createdAt: c.createdAt,
    }));
    return NextResponse.json(out, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to list document chunks" },
      { status: 400 }
    );
  }
}