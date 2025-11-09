import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createDocument, listDocuments } from "@contxt/auth/queries";
import { z } from "zod";

// Payload sent after successful upload to persist the document
const persistSchema = z.object({
  title: z.string().optional(),
  sourcePath: z.union([z.string().url(), z.string().min(1)]),
  key: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().positive(),
  content: z.string(), // JSON text content
});

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const { id } = await context.params;

  try {
    const docs = await listDocuments(hdrs, id);
    return NextResponse.json(docs, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to list documents" },
      { status: 400 }
    );
  }
}

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

  const parsed = persistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid document payload" },
      { status: 400 }
    );
  }

  const { title, sourcePath, key, contentType, size, content } = parsed.data;

  try {
    const doc = await createDocument(hdrs, id, {
      title: title ?? undefined,
      sourceType: "file",
      sourcePath,
      content, // store the JSON text as document content
      metadata: { key, contentType, size },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create document" },
      { status: 400 }
    );
  }
}