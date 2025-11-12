"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import LLMAnswerViewer from "@/components/data/LLMAnswerViewer";

type ChunkContext = {
  id: string;
  documentId: string | null;
  chunkIndex: number;
  similarity: number;
  text: string;
  metadata: Record<string, any>;
};

export default function QueryPlayground({
  projectId,
  defaults,
}: {
  projectId: string;
  defaults?: { topK?: number; threshold?: number; retrievalMode?: "chunk" | "row" };
}) {
  const [query, setQuery] = React.useState("");
  const [topK, setTopK] = React.useState<number>(defaults?.topK ?? 6);
  const [threshold, setThreshold] = React.useState<number>(defaults?.threshold ?? 0.65);
  const [retrievalMode, setRetrievalMode] = React.useState<"chunk" | "row">(defaults?.retrievalMode ?? "chunk");
  const [useLLM, setUseLLM] = React.useState<boolean>(true);
  const [loading, setLoading] = React.useState(false);
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [chunks, setChunks] = React.useState<ChunkContext[]>([]);
  const [mode, setMode] = React.useState<string | null>(null);
  const [apiRetrievalMode, setApiRetrievalMode] = React.useState<"chunk" | "row" | null>(null);

  const ask = async () => {
    const q = query.trim();
    if (!q) {
      toast.error("Enter a question to query the project");
      return;
    }
    const safeTopK = Number.isFinite(topK) ? Math.max(1, Math.min(50, Math.round(topK))) : 6;
    const safeThreshold = Number.isFinite(threshold)
      ? Math.max(0, Math.min(1, Number(threshold.toFixed(3))))
      : 0.65;

    setLoading(true);
    setAnswer(null);
    setChunks([]);
    setMode(null);
    setApiRetrievalMode(null);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          query: q,
          topK: safeTopK,
          threshold: safeThreshold,
          retrievalMode,
          useLLM,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || "Query failed");
      }

      setAnswer(j?.answer ?? "");
      setChunks(Array.isArray(j?.chunks) ? j.chunks : []);
      setMode(j?.mode || null);
      setApiRetrievalMode(j?.retrievalMode || null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to run query");
    } finally {
      setLoading(false);
    }
  };

  const onCopyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(answer || "");
      toast.success("Answer copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Query Playground</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <label className="text-sm font-medium">Question</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                ask();
              }
            }}
            placeholder="Ask a question based on your project's data..."
            className="min-h-[120px] w-full rounded-md border bg-transparent p-3 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <label htmlFor="topK" className="text-sm font-medium">
              Top K
            </label>
            <Input
              id="topK"
              type="number"
              min={1}
              max={50}
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value || "6", 10))}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="threshold" className="text-sm font-medium">
              Similarity Threshold
            </label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value || "0.65"))}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Retrieval Mode</label>
          <Select value={retrievalMode} onValueChange={(v) => setRetrievalMode(v as "chunk" | "row")}>
            <SelectTrigger className="rounded-md border bg-transparent p-2 text-sm">
              <SelectValue placeholder="Select retrieval mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chunk">Chunk (text)</SelectItem>
              <SelectItem value="row">Row (structured)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="useLLM" className="text-sm font-medium">
            Generate Answer (LLM)
          </label>
          <Switch id="useLLM" checked={useLLM} onCheckedChange={setUseLLM} />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={ask} disabled={loading}>
            {loading ? "Asking..." : "Ask"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setAnswer(null);
              setChunks([]);
              setMode(null);
              setApiRetrievalMode(null);
            }}
            disabled={loading || (!answer && chunks.length === 0)}
          >
            Clear
          </Button>
        </div>

        {mode && (
          <p className="text-xs text-muted-foreground">
            Auth: {mode === "apiKey" ? "API Key" : "Session"}
          </p>
        )}
        {apiRetrievalMode && (
          <p className="text-xs text-muted-foreground">
            Retrieval: {apiRetrievalMode === "row" ? "Row (structured)" : "Chunk (text)"}
          </p>
        )}

        {answer !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Answer</h3>
              <Button variant="outline" size="sm" onClick={onCopyAnswer}>
                Copy
              </Button>
            </div>
            {/* Render markdown answer beautifully */}
            <LLMAnswerViewer content={answer || ""} />
          </div>
        )}

        {/* Context viewer (optional) */}
        {chunks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Retrieved Contexts</h3>
            <div className="space-y-3">
              {chunks.map((c, idx) => (
                <div key={c.id || idx} className="rounded-md border p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Similarity: {Number(c.similarity).toFixed(3)} {typeof c.chunkIndex === "number" ? `· Chunk #${c.chunkIndex}` : ""}
                    </span>
                    {typeof c.documentId !== "undefined" && <span>Doc: {c.documentId || "—"}</span>}
                  </div>
                  <pre className="mt-2 text-sm whitespace-pre-wrap">{c.text}</pre>
                  {c.metadata && Object.keys(c.metadata).length > 0 && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer">Metadata</summary>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {JSON.stringify(c.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}