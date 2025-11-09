import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createProject, listProjects } from "@contxt/auth/queries";
// import { auth } from "@contxt/auth";
// import type { AuthContext } from "@contxt/auth";
// import { createHash } from "crypto";

export async function GET() {
	// Derive ctx from session (or API key in future if needed)
	const hdrs = await headers();
	// const authHeader = hdrs.get("authorization");

	// let ctx: AuthContext | null = null;

	// if (authHeader?.toLowerCase().startsWith("bearer ")) {
	// 	// Optional: allow API keys in future (listProjects requires session; this will error for now)
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
		const projects = await listProjects(hdrs);
		return NextResponse.json(projects);
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || "Failed to list projects" }, { status: 400 });
	}
}

export async function POST(req: Request) {
	const hdrs = await headers();
	// const session = await auth.api.getSession({ headers: hdrs });
	// if (!session?.user) {
	// 	return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	// }
	// const ctx: AuthContext = { kind: "session", userId: session.user.id };

	let body: any;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	try {
		const project = await createProject(hdrs, {
			name: body?.name,
			description: body?.description,
		});
		return NextResponse.json(project, { status: 201 });
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || "Failed to create project" }, { status: 400 });
	}
}