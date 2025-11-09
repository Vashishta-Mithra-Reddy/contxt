"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProjectFiles from "./ProjectFiles";
import ApiKeys from "./ApiKeys";
import ProjectSettings from "./ProjectSettings";
import { UploadIcon, KeyIcon, SettingsIcon, PlayIcon } from "lucide-react";
import { toast } from "sonner";

type Project = {
  id: string;
  name: string;
  description: string | null;
  settings?: {
    similarity_threshold?: number;
    top_k?: number;
    included_sections?: string[];
    embedding_model?: string;
  };
};

export default function ProjectActions({
  projectId,
  project,
}: {
  projectId: string;
  project: Project;
}) {
  const [running, setRunning] = React.useState(false);

  const runWorker = async () => {
    setRunning(true);
    try {
      const res = await fetch(`/api/worker?projectId=${projectId}`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Worker failed");

      const embedded = j?.embedded ?? 0;
      const skipped = j?.skipped ?? 0;
      const processed = j?.processed ?? 0;
      toast.success(`Worker ran: processed ${processed}, embedded ${embedded}, skipped ${skipped}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to run worker");
    } finally {
      setRunning(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Options bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Upload Files */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline"><UploadIcon className="w-4 h-4 mr-1" /> Upload Files</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>
                Add documents to your project. Supported types shown in the uploader.
              </DialogDescription>
            </DialogHeader>
            <ProjectFiles projectId={projectId} />
          </DialogContent>
        </Dialog>

        {/* API Keys */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline"><KeyIcon className="w-4 h-4 mr-1" /> API Keys</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage API Keys</DialogTitle>
              <DialogDescription>
                Create, revoke, and view project-scoped API keys.
              </DialogDescription>
            </DialogHeader>
            <ApiKeys projectId={projectId} />
          </DialogContent>
        </Dialog>

        {/* Project Settings */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default"><SettingsIcon className="w-4 h-4 mr-1" /> Project Settings</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Project Settings</DialogTitle>
              <DialogDescription>
                Edit Description, and retrieval settings.
              </DialogDescription>
            </DialogHeader>
            <ProjectSettings project={project} />
          </DialogContent>
        </Dialog>

        {/* Run Worker */}
        <Button variant="default" onClick={runWorker} disabled={running}>
          <PlayIcon className="w-4 h-4 mr-1" />
          {running ? "Vectorizing..." : "Vectorize Content"}
        </Button>
      </div>
    </div>
  );
}