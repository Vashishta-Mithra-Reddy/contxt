import { redirect } from "next/navigation";
import Dashboard from "./dashboard";
import { headers } from "next/headers";
import { auth } from "@contxt/auth";
import { authClient } from "@/lib/auth-client";

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<section className="wrapperx">
			<Dashboard session={session} />
		</section>
	);
}
