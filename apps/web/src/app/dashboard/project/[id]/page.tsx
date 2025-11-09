import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@contxt/auth";
import { getProject } from "@contxt/auth/queries";
import ProjectActions from "./ProjectActions";
import ApiKeys from "./ApiKeys";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
	const { id } = await params;
	const hdrs = await headers();
	const session = await auth.api.getSession({ headers: hdrs });
	if (!session?.user) {
		redirect("/login");
	}

	let project: any;
	try {
		project = await getProject(hdrs, id);
	} catch {
		redirect("/dashboard");
	}

	return (
		<div className="wrapperx max-w-7xl mx-auto w-full">
			<h1 className="text-2xl font-semibold pb-2">{project.name}</h1>
			<p className="text-muted-foreground pb-8">
				{project.description || "No description provided."}
			</p>

			<div className="space-y-8">
			<ProjectActions projectId={id} project={project} />

			<ApiKeys projectId={id} />
			</div>
		</div>
	);
}