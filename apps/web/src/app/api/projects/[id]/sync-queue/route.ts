import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { listSyncQueue } from "@contxt/auth/queries";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const { id } = await context.params;
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status"); // pending | embedded | skipped
  const typeFilter = url.searchParams.get("type");

  try {
    const items = await listSyncQueue(hdrs, id);

    const filtered = items.filter((it: any) => {
      const okStatus = statusFilter ? it.status === statusFilter : true;
      const okType = typeFilter ? it.type === typeFilter : true;
      return okStatus && okType;
    });

    const out = filtered.map((row: any) => {
      let contentOut: unknown = row?.content;
      try {
        contentOut = typeof row?.content === "string" ? JSON.parse(row.content) : row?.content;
      } catch {
        // keep as string if parsing fails
      }
      return {
        id: row.id,
        projectId: row.projectId,
        externalId: row.externalId,
        type: row.type,
        content: contentOut,
        metadata: row.metadata,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });

    return NextResponse.json(out, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to list sync queue" },
      { status: 400 }
    );
  }
}