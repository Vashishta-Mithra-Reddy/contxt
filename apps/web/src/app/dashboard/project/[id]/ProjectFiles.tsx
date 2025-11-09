"use client";

import * as React from "react";
import { Dropzone, type FileWithMetadata } from "@/components/ui/dropzone";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type DocumentItem = {
  id: string;
  title: string | null;
  sourceType: string | null;
  sourcePath: string | null;
  metadata: Record<string, any> | null;
  createdAt?: string;
  content?: string | null;
};

export default function ProjectFiles({ projectId }: { projectId: string }) {
  const [docs, setDocs] = React.useState<DocumentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [files, setFiles] = React.useState<FileWithMetadata[]>([]);
  const persisted = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/documents`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load documents");
        const data = await res.json();
        if (!canceled) setDocs(data);
      } catch (err) {
        // Silent fail for now; could surface toast/UI
        console.error(err);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [projectId]);

  // Persist newly uploaded files as project documents
  React.useEffect(() => {
    const toPersist = files.filter(
      (f) => !f.uploading && !f.error && f.publicUrl && !persisted.current.has(f.id)
    );

    toPersist.forEach(async (file) => {
      try {
        const title = file.file.name;
        const sourcePath = file.publicUrl!;
        const key = file.key!;
        const contentType = file.file.type;
        const size = file.file.size;

        // Read JSON file content client-side
        const contentText = await file.file.text();
        let jsonContent: unknown;
        try {
          jsonContent = JSON.parse(contentText);
        } catch {
          // If parsing fails, treat as raw text
          jsonContent = contentText;
        }

        // Save document with JSON text content
        const res = await fetch(`/api/projects/${projectId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, sourcePath, key, contentType, size, content: contentText }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "Failed to save document");
        }
        const doc = (await res.json()) as DocumentItem;
        setDocs((prev) => [doc, ...prev]);
        persisted.current.add(file.id);

        // Enqueue sync for embedding, keep payload JSON-first
        // Include documentId and file metadata in sync metadata for traceability
        await fetch(`/api/projects/${projectId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            externalId: key,
            type: "json_document",
            content: jsonContent,
            metadata: {
              documentId: doc.id,
              path: sourcePath,
              contentType,
              size,
              originalTitle: title,
            },
          }),
        });
      } catch (err) {
        console.error(err);
        // Optional: toast error
      }
    });
  }, [files, projectId]);

  return (
    <Card className="border-none hover:border-none hover:shadow-none hover:drop-shadow-none py-3">
      <CardContent className="px-0">
        <div className="space-y-4 flex-col-center">
          <Dropzone
            provider="cloudflare-r2"
            onFilesChange={setFiles}
            maxFiles={1}
            maxSize={1024 * 1024 * 10}
            helperText="Only JSON files are supported as of now. Max 10MB each."
          />

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading documents…</p>
          ) : docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents yet. Upload files to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {docs.map((d) => {
                const isImage =
                  typeof d.sourcePath === "string" &&
                  /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(d.sourcePath);
                const sourcePath = d.sourcePath?.includes("storage.vashishtamithra.com") ? "https://" + d.sourcePath : "#";
                return (
                  <div
                    key={d.id}
                    className="rounded-lg border overflow-hidden bg-background"
                  >
                    <div className="aspect-square">
                      {isImage && d.sourcePath ? (
                        <img
                          src={d.sourcePath}
                          alt={d.title ?? "Uploaded file"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <span className="text-xs text-muted-foreground">
                            {d.title ?? "File"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[70%]">
                        {d.title ?? "Untitled"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link
                          href={{pathname: sourcePath}}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs"
                        >
                          Open
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}