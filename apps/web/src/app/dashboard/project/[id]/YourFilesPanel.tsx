"use client";

import * as React from "react";
import YourFiles from "@/components/data/YourFiles";

type DocumentItem = {
  id: string;
  title: string | null;
  sourceType: string | null;
  sourcePath: string | null;
  metadata: Record<string, any> | null;
  createdAt?: string;
  content?: string | null;
};

export default function YourFilesPanel({ projectId }: { projectId: string }) {
  const [docs, setDocs] = React.useState<DocumentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadDocs = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/documents`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setDocs(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    setLoading(true);
    loadDocs();
    const onUpdate = () => loadDocs();
    window.addEventListener("documents:updated", onUpdate);
    return () => {
      window.removeEventListener("documents:updated", onUpdate);
    };
  }, [loadDocs]);

  return (
    <section className="space-y-3">
      {error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <YourFiles docs={docs} loading={loading} />
      )}
    </section>
  );
}