import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createApiKey, listApiKeysForProject } from "@contxt/auth/queries";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";

const createKeySchema = z.object({
  name: z.string().min(2),
  permissions: z
    .array(z.enum(["read", "write", "embed", "admin"]))
    .default(["read"])
    .optional(),
  expiresAt: z.string().optional(),
  neverExpires: z.boolean().default(false).optional(),
});

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const { id } = await context.params;

  try {
    const keys = await listApiKeysForProject(hdrs, id);
    // Sanitize output; do not leak keyHash unnecessarily
    const out = keys.map((k: any) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      permissions: k.permissions,
      expiresAt: k.expiresAt,
      revoked: k.revoked,
      createdAt: k.createdAt,
      neverExpires: k.neverExpires,
      lastUsed: k.lastUsed,
    }));
    return NextResponse.json(out, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to list API keys" },
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

  const parsed = createKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid key payload" }, { status: 400 });
  }

  const KEY_PREFIX = process.env.API_KEY_PREFIX || "ctx_live_";
  const random = randomBytes(32).toString("hex");
  const fullKey = `${KEY_PREFIX}${random}`;
  const keyHash = createHash("sha256").update(fullKey).digest("hex");

  const expiresAt =
    parsed.data.neverExpires
      ? undefined
      : parsed.data.expiresAt
      ? new Date(parsed.data.expiresAt)
      : undefined;

  try {
    const row = await createApiKey(hdrs, {
      name: parsed.data.name,
      keyPrefix: KEY_PREFIX,
      keyHash,
      permissions: parsed.data.permissions ?? ["read"],
      neverExpires: parsed.data.neverExpires ?? false,
      expiresAt,
      projectId: id,
    });

    // Return the plaintext key ONLY once to the client
    return NextResponse.json(
      {
        id: row?.id ?? undefined,
        name: row?.name ?? undefined,
        keyPrefix: row?.keyPrefix ?? undefined,
        permissions: row?.permissions ?? undefined,
        neverExpires: row?.neverExpires ?? undefined,
        expiresAt: row?.expiresAt ?? undefined,
        revoked: row?.revoked ?? undefined,
        createdAt: row?.createdAt ?? undefined,
        plaintextKey: fullKey,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create API key" },
      { status: 400 }
    );
  }
}