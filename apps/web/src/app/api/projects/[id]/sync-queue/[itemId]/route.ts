import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { updateSyncStatus } from "@contxt/auth/queries";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["pending", "embedded", "skipped"]),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const hdrs = await headers();
  const { id, itemId } = await context.params;

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
    const row = await updateSyncStatus(hdrs, id, itemId, { status: parsed.data.status });
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
      { error: err?.message || "Failed to update sync status" },
      { status: 400 }
    );
  }
}