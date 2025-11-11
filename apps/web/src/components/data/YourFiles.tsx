import Link from "next/link";
import { Button } from "@/components/ui/button";
import { File as FileIcon } from "lucide-react";

type DocumentItem = {
  id: string;
  title: string | null;
  sourcePath: string | null;
  metadata?: Record<string, any> | null;
  createdAt?: string;
  status?: "active" | "archived";
};

export default function YourFiles({
  docs,
  loading = false,
  onToggleStatus,
  toggling,
}: {
  docs: DocumentItem[];
  loading?: boolean;
  onToggleStatus?: (docId: string, nextStatus: "active" | "archived") => void;
  toggling?: Record<string, boolean>;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="rounded-lg border overflow-hidden bg-background animate-pulse">
            <div className="aspect-square bg-muted" />
            <div className="p-3 flex items-center justify-between">
              <span className="h-4 w-24 bg-muted rounded" />
              <span className="h-6 w-16 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!docs || docs.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-background p-10 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-muted">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No documents yet. Upload files to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {docs.map((d) => {
        const isImage =
          typeof d.sourcePath === "string" &&
          /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(d.sourcePath || "");
        const sourcePath =
          d.sourcePath?.includes("storage.vashishtamithra.com")
            ? "https://" + d.sourcePath
            : d.sourcePath || "#";

        const archived = d.status === "archived";
        const busy = !!toggling?.[d.id];

        return (
          <div
            key={d.id}
            className={`rounded-lg border overflow-hidden bg-background ${archived ? "opacity-80" : ""}`}
          >
            <div className="aspect-square relative">
              {archived && (
                <div className="absolute top-2 left-2 z-10 rounded-md bg-muted px-2 py-1">
                  <span className="text-xs font-medium text-muted-foreground">Archived</span>
                </div>
              )}
              {isImage && d.sourcePath ? (
                <img
                  src={d.sourcePath}
                  alt={d.title ?? "Uploaded file"}
                  loading="lazy"
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
            <div className="p-3 flex items-center justify-between gap-2">
              <span
                className="text-sm font-medium truncate max-w-[50%]"
                title={d.title ?? "Untitled"}
              >
                {d.title ?? "Untitled"}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={{ pathname: sourcePath }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs"
                    aria-label={`Open ${d.title ?? "file"}`}
                  >
                    Open
                  </Link>
                </Button>
                {onToggleStatus && (
                  <Button
                    variant={archived ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    disabled={busy}
                    onClick={() => onToggleStatus(d.id, archived ? "active" : "archived")}
                    aria-label={archived ? "Restore document" : "Archive document"}
                  >
                    {busy ? (archived ? "Restoring..." : "Archiving...") : archived ? "Restore" : "Archive"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}