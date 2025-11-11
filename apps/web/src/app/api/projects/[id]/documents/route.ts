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
  parsedContent: z.any().optional(), // normalized JSON form
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
  const body = await req.json();
  const parsed = persistSchema.parse(body);

  const doc = await createDocument(hdrs, id, {
    title: parsed.title,
    sourceType: "file",
    sourcePath: parsed.sourcePath,
    content: parsed.content,
    parsedContent: parsed.parsedContent,
    metadata: {
      key: parsed.key,
      contentType: parsed.contentType,
      size: parsed.size,
    },
  });

  return NextResponse.json(doc, { status: 200 });
}