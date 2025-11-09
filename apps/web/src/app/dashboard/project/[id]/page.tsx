import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@contxt/auth";
import { getProject } from "@contxt/auth/queries";
import ProjectActions from "./ProjectActions";
import ApiKeys from "./ApiKeys";
import ProjectData from "./ProjectData";
import QueryPlayground from "./QueryPlayground";

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
		<div className="wrapperx flex-col-center w-full">
			<div className="max-w-7xl w-full px-8">
			
			<div className="flex items-center justify-between pb-8">
			<div>
			<h1 className="text-2xl font-semibold">{project.name}</h1>
			<p className="text-muted-foreground">
				{project.description || "No description provided."}
			</p>
			</div>
			
			<ProjectActions projectId={id} project={project} />

			</div>

			<div className="space-y-8">
			<ProjectData projectId={id} />
			<QueryPlayground projectId={id} />
			<ApiKeys projectId={id} />
			</div>
			</div>
		</div>
	);
}