import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { revokeApiKey } from "@contxt/auth/queries";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string; keyId: string }> }
) {
  const hdrs = await headers();
  const { keyId } = await context.params;

  try {
    const row = await revokeApiKey(hdrs, keyId);
    const { ...rest } = row;
    return NextResponse.json(rest, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to revoke API key" },
      { status: 400 }
    );
  }
}