import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { enqueueSyncItem } from "@contxt/auth/queries";
import { z } from "zod";

const enqueueSchema = z.object({
  externalId: z.string().optional(),
  type: z.string().optional(),
  content: z.union([z.record(z.string(), z.any()), z.array(z.any()), z.string()]),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = enqueueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sync payload" }, { status: 400 });
  }

  const contentStr =
    typeof parsed.data.content === "string"
      ? parsed.data.content
      : JSON.stringify(parsed.data.content);

  try {
    const row = await enqueueSyncItem(hdrs, id, {
      externalId: parsed.data.externalId,
      type: parsed.data.type,
      content: contentStr,
      metadata: parsed.data.metadata ?? {},
    });

    // Prefer JSON output for content if it was JSON originally
    let contentOut: unknown = row?.content;
    try {
      contentOut = typeof row?.content === "string" ? JSON.parse(row.content) : row?.content;
    } catch {
      // leave as string if parsing fails
    }

    return NextResponse.json(
      {
        id: row?.id,
        projectId: row?.projectId,
        externalId: row?.externalId,
        type: row?.type,
        content: contentOut,
        metadata: row?.metadata,
        status: row?.status,
        createdAt: row?.createdAt,
        updatedAt: row?.updatedAt,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to enqueue sync item" },
      { status: 400 }
    );
  }
}