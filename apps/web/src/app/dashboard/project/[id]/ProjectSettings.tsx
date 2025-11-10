"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  retrievalMode?: "chunk" | "row";
};

export default function ProjectSettings({ project }: { project: Project }) {
  const [name, setName] = React.useState(project.name || "");
  const [description, setDescription] = React.useState(project.description || "");
  const [similarityThreshold, setSimilarityThreshold] = React.useState<number>(project.settings?.similarity_threshold ?? 0.65);
  const [topK, setTopK] = React.useState<number>(project.settings?.top_k ?? 6);
  const [includedSections, setIncludedSections] = React.useState<string>((project.settings?.included_sections ?? []).join(", "));
  const [embeddingModel, setEmbeddingModel] = React.useState<string>(project.settings?.embedding_model ?? "gemini-embedding-001");
  const [retrievalMode, setRetrievalMode] = React.useState<"chunk" | "row">(project.retrievalMode ?? "chunk");

  const [saving, setSaving] = React.useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        // name,
        description,
        retrievalMode,
        settings: {
          similarity_threshold: similarityThreshold,
          top_k: topK,
          included_sections: includedSections.split(",").map((s) => s.trim()).filter(Boolean),
          embedding_model: embeddingModel,
        },
      };
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to update project");
      }
      toast.success("Project updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-none hover:border-none hover:shadow-none hover:drop-shadow-none py-3">
      {/* <CardHeader>
        <CardTitle>Project Settings</CardTitle>
      </CardHeader> */}
      <CardContent className="px-0">
        <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input disabled={true} value={name} onChange={(e) => setName(e.target.value)} />
          </div> */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="md:col-span-1 space-y-2">
            <label className="text-sm font-medium">Similarity Threshold (0–1)</label>
            <Input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-1 space-y-2">
            <label className="text-sm font-medium">Top K (1–50)</label>
            <Input
              type="number"
              min={1}
              max={50}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
            />
          </div>

          {/* <div className="md:col-span-1 space-y-2">
            <label className="text-sm font-medium">Included Sections (comma-separated)</label>
            <Input
              value={includedSections}
              onChange={(e) => setIncludedSections(e.target.value)}
            />
          </div> */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium pb-20">Embedding Model</label>
            <Input
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Default Retrieval Mode</label>
            <select
              className="rounded-md border bg-transparent p-2 text-sm"
              value={retrievalMode}
              onChange={(e) => setRetrievalMode(e.target.value as "chunk" | "row")}
            >
              <option value="chunk">Chunk (text)</option>
              <option value="row">Row (structured)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <Button className="w-full mt-2" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}