import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { updateDocument } from "@contxt/auth/queries";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["active", "archived"]),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string; docId: string }> }
) {
  const hdrs = await headers();
  const { id, docId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status payload" }, { status: 400 });
  }

  try {
    // Soft toggle only; do not delete chunks/rows or re-enqueue
    const row = await updateDocument(hdrs, id, docId, { status: parsed.data.status });
    return NextResponse.json(
      {
        id: row?.id,
        projectId: row?.projectId,
        status: row?.status,
        updatedAt: row?.updatedAt,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update document" },
      { status: 400 }
    );
  }
}