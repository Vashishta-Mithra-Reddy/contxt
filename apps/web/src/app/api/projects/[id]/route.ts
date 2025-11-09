import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getProject, updateProject } from "@contxt/auth/queries";

// import { auth} from "@contxt/auth";
// import type { AuthContext } from "@contxt/auth";
// import { createHash } from "crypto";

export async function GET(
	_req: Request,
	context: { params: Promise<{ id: string }> },
) {
	const hdrs = await headers();
	const { id } = await context.params;
	// const authHeader = hdrs.get("authorization");

	// let ctx: AuthContext | null = null;

	// if (authHeader?.toLowerCase().startsWith("bearer ")) {
	// 	// Supports external API consumers via API key
	// 	const token = authHeader.slice(7).trim();
	// 	ctx = { kind: "apiKey", keyHash: createHash("sha256").update(token).digest("hex") };
	// } else {
	// 	const session = await auth.api.getSession({ headers: hdrs });
	// 	if (!session?.user) {
	// 		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	// 	}
	// 	ctx = { kind: "session", userId: session.user.id };
	// }

	try {
		const project = await getProject(hdrs, id);
		return NextResponse.json(project);
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || "Not found" }, { status: 404 });
	}
}

export async function PATCH(
	req: Request,
	context: { params: Promise<{ id: string }> },
) {
	const hdrs = await headers();
	const { id } = await context.params;

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	try {
		const updated = await updateProject(hdrs, id, body);
		return NextResponse.json(updated, { status: 200 });
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || "Failed to update project" }, { status: 400 });
	}
}