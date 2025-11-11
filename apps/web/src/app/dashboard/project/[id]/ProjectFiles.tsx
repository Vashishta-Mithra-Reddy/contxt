"use client";

import * as React from "react";
import { Dropzone, type FileWithMetadata } from "@/components/ui/dropzone";
import { Card, CardContent } from "@/components/ui/card";
import Papa from "papaparse";
import * as XLSX from "xlsx";
// import YourFiles from "@/components/data/YourFiles";

// type DocumentItem = {
//   id: string;
//   title: string | null;
//   sourceType: string | null;
//   sourcePath: string | null;
//   metadata: Record<string, any> | null;
//   createdAt?: string;
//   content?: string | null;
// };

export default function ProjectFiles({ projectId }: { projectId: string }) {
  // Remove docs and listing, keep only upload
  const [files, setFiles] = React.useState<FileWithMetadata[]>([]);
  const persisted = React.useRef<Set<string>>(new Set());

  // React.useEffect(() => {
  //   let canceled = false;
  //   (async () => {
  //     try {
  //       const res = await fetch(`/api/projects/${projectId}/documents`, {
  //         cache: "no-store",
  //       });
  //       if (!res.ok) throw new Error("Failed to load documents");
  //       const data = await res.json();
  //       if (!canceled) setDocs(data);
  //     } catch (err) {
  //       // Silent fail for now; could surface toast/UI
  //       console.error(err);
  //     } finally {
  //       if (!canceled) setLoading(false);
  //     }
  //   })();
  //   return () => {
  //     canceled = true;
  //   };
  // }, [projectId]);

  // Persist newly uploaded files as project documents and enqueue sync
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

        const contentText = await file.file.text();
        
        // Convert to JSON before enqueuing sync
        const normalizedJson = await convertFileToJson(file.file);

        // Save document with original content text (unchanged)
        const res = await fetch(`/api/projects/${projectId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, sourcePath, key, contentType, size, content: contentText, parsedContent: normalizedJson }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "Failed to save document");
        }
        const doc = await res.json();
        persisted.current.add(file.id);

        // Notify other components to refresh document list
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("documents:updated"));
        }

        await fetch(`/api/projects/${projectId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            externalId: key,
            type: "json_document",
            content: normalizedJson,
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
            helperText="Supports JSON, CSV, XLSX, and plain text. Max 10MB each."
          />
        </div>
      </CardContent>
    </Card>
  );
}


export async function convertFileToJson(file: File): Promise<unknown> {
  const ct = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();

  try {
    // --- JSON ---
    if (ct === "application/json" || name.endsWith(".json")) {
      const text = await file.text();
      return safeJsonParse(text);
    }

    // --- CSV ---
    if (ct === "text/csv" || name.endsWith(".csv")) {
      const text = await file.text();
      const parsed = Papa.parse(text.trim(), {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      if (parsed.errors.length > 0) {
        console.warn("CSV parse warnings:", parsed.errors);
      }
      return parsed.data;
    }

    // --- Excel (XLS / XLSX) ---
    if (
      ct === "application/vnd.ms-excel" ||
      ct === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx")
    ) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const firstSheet = wb.SheetNames[0];
      const sheet = wb.Sheets[firstSheet];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
      return json;
    }

    // --- Plain Text ---
    if (ct === "text/plain" || name.endsWith(".txt")) {
      const text = await file.text();
      return [{ text }];
    }

    // --- Fallback: try JSON parse, else raw text ---
    const text = await file.text();
    return safeJsonParse(text);
  } catch (err) {
    console.error("File conversion failed:", err);
    return [{ error: "Failed to convert file", message: (err as Error).message }];
  }
}

/**
 * Safely parses JSON, returning fallback if invalid.
 */
function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return [{ text }];
  }
}