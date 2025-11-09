import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { listChunksByProject } from "@contxt/auth/queries";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const { id } = await context.params;

  const url = new URL(req.url);
  const documentId = url.searchParams.get("documentId");
  const typeFilter = url.searchParams.get("type");
  const externalIdFilter = url.searchParams.get("externalId");
  const pathFilter = url.searchParams.get("path");

  try {
    const chunks = await listChunksByProject(hdrs, id);

    const filtered = chunks.filter((c: any) => {
      const okDoc = documentId ? c.documentId === documentId : true;
      const md = c.metadata || {};
      const okType = typeFilter ? md.type === typeFilter : true;
      const okExternal = externalIdFilter ? md.externalId === externalIdFilter : true;
      const okPath = pathFilter ? md.path === pathFilter : true;
      return okDoc && okType && okExternal && okPath;
    });

    const out = filtered.map((c: any) => ({
      id: c.id,
      projectId: c.projectId,
      documentId: c.documentId,
      chunkIndex: c.chunkIndex,
      chunkText: c.chunkText,
      metadata: c.metadata,
      contentHash: c.contentHash,
      createdAt: c.createdAt,
      // Avoid returning `embedding` to keep payload light
    }));

    return NextResponse.json(out, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to list chunks" },
      { status: 400 }
    );
  }
}