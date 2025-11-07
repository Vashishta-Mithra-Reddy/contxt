import { auth } from "@contxt/auth";
import { headers } from "next/headers";
import Login from "./login";
import { redirect } from "next/navigation";

export default async function LoginPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (session) {
		return redirect("/dashboard");
	}

	return (
		<div className="flex-center">
			<Login />
		</div>
	);
}
