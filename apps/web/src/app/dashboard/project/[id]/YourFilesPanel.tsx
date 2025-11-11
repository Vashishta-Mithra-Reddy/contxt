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
  status?: "active" | "archived";
};

export default function YourFilesPanel({ projectId }: { projectId: string }) {
  const [docs, setDocs] = React.useState<DocumentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [toggling, setToggling] = React.useState<Record<string, boolean>>({});

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

  const handleToggleStatus = React.useCallback(
    async (docId: string, nextStatus: "active" | "archived") => {
      setToggling((prev) => ({ ...prev, [docId]: true }));
      try {
        const res = await fetch(`/api/projects/${projectId}/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || "Failed to update document status");
        setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status: nextStatus } : d)));
      } catch (err: any) {
        setError(err?.message || "Failed to update document status");
      } finally {
        setToggling((prev) => ({ ...prev, [docId]: false }));
      }
    },
    [projectId],
  );

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
    <section className="space-y-3 font-jakarta">
      {error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <YourFiles
          docs={docs}
          loading={loading}
          onToggleStatus={handleToggleStatus}
          toggling={toggling}
        />
      )}
    </section>
  );
}