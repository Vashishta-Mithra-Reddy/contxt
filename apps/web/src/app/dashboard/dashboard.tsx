"use client";

// session: typeof authClient.$Infer.Session; 

import Link from "next/link";
import * as React from "react";
import Spinner from "@/components/blocks/Spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Project = {
	id: string;
	name: string;
	description: string | null;
	createdAt?: string;
	updatedAt?: string;
};

export default function Dashboard({ session }: { session: any }) {
	const [projects, setProjects] = React.useState<Project[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [creating, setCreating] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const router = useRouter();
	const [listError, setListError] = React.useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = React.useState(false);

	React.useEffect(() => {
		let canceled = false;
		(async () => {
			try {
				const res = await fetch("/api/projects", { cache: "no-store" });
				if (!res.ok) throw new Error("Failed to load projects");
				const data = await res.json();
				if (!canceled) setProjects(data);
			} catch (err: any) {
				if (!canceled) setListError(err?.message || "Failed to load projects");
			} finally {
				if (!canceled) setLoading(false);
			}
		})();
		return () => {
			canceled = true;
		};
	}, []);

	// Auto-launch dialog only once after projects load if none exist
	if (!loading && projects.length === 0) {
		setDialogOpen(true);
	}

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setError("Project name is required");
			return;
		}
		setError(null);
		setCreating(true);
		try {
			const res = await fetch("/api/projects", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, description }),
			});
			if (!res.ok) {
				const j = await res.json().catch(() => ({}));
				throw new Error(j?.error || "Failed to create project");
			}
			const project = (await res.json()) as Project;
			setProjects((prev) => [project, ...prev]);
			router.push(`/dashboard/project/${project.id}`);
		} catch (err: any) {
			setError(err?.message || "Failed to create project");
		} finally {
			setCreating(false);
		}
	};

	return (
		<div className="max-w-7xl mx-auto w-full px-4 py-6 space-y-10">
			{/* Removed the inline "Create a project" section and moved it to a dialog */}
			<section className="space-y-3">
				<div className="flex items-end justify-between mb-8">
					<h3 className="text-2xl font-semibold text-foreground">Your projects</h3>
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger asChild>
							<Button
								type="button"
								className="rounded-xl bg-[#2b2b2b] text-[#fff] font-bold px-6 py-3 hover:bg-[#2b2b2b]/90"
							>
								Create Project
							</Button>
						</DialogTrigger>

						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create a project</DialogTitle>
								<DialogDescription>
										Create a project to begin uploading documents and running queries.
								</DialogDescription>
							</DialogHeader>

							<form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<Input
									type="text"
									placeholder="Project name"
									className="md:col-span-3"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
								<Input
									type="text"
									placeholder="Description (optional)"
									className="md:col-span-3"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
								<Button
									type="submit"
									className="rounded-xl bg-[#2b2b2b] text-[#fff] font-bold px-6 py-3 hover:bg-[#2b2b2b]/90 disabled:opacity-50 md:col-span-3"
									disabled={creating}
								>
									{creating ? "Creating..." : "Create Project"}
								</Button>
							</form>

							{error ? <p className="text-destructive text-sm mt-2">{error}</p> : null}
						</DialogContent>
					</Dialog>
				</div>

				{listError ? <p className="text-destructive text-sm">{listError}</p> : null}

				{loading ? (
					<div className="flex justify-center py-8">
						<Spinner />
					</div>
				) : projects.length === 0 ? (
					<p className="text-muted-foreground">No projects yet. Create one to get started.</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{projects.map((p) => (
							<Link
								key={p.id}
								href={{ pathname: `/dashboard/project/${p.id}`}}
								className="group rounded-xl border-2 border-foreground/10 bg-card p-6 transition-all duration-300 hover:bg-muted-foreground/5 hover:border-foreground/20"
							>
								<div className="flex items-center justify-between">
									<h4 className="text-base font-semibold text-foreground group-hover:text-foreground/90">
										{p.name}
									</h4>
									<span className="text-xs text-muted-foreground">View</span>
								</div>
								{p.description ? (
									<p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
								) : null}
							</Link>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
