"use client";

import * as React from "react";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import Spinner from "@/components/blocks/Spinner";

type DocumentItem = {
  id: string;
  title: string | null;
  sourceType: string | null;
  sourcePath: string | null;
  createdAt?: string;
  content?: string | null;
};

function ContentTable({ content }: { content?: string | null }) {
  let parsed: unknown = content ?? "";
  try {
    parsed = content ? JSON.parse(content) : "";
  } catch {
    // leave parsed as raw string
  }

  const formatValue = (val: unknown) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  };

  // Array of objects → union of keys as columns
  if (Array.isArray(parsed) && parsed.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
    const rows = parsed as Record<string, unknown>[];
    const columnSet = new Set<string>();
    rows.forEach((r) => Object.keys(r).forEach((k) => columnSet.add(k)));
    const columns = Array.from(columnSet).sort();

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={col}>{formatValue(row[col])}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  // Array of primitives → single "Value" column
  if (Array.isArray(parsed)) {
    const rows = parsed as unknown[];
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((val, idx) => (
            <TableRow key={idx}>
              <TableCell>{formatValue(val)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  // Object → "Key" / "Value"
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((k) => (
            <TableRow key={k}>
              <TableCell className="font-medium">{k}</TableCell>
              <TableCell>{formatValue(obj[k])}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  // Fallback: raw content in a single cell
  return (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>{typeof parsed === "string" ? parsed : ""}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

export default function ProjectData({ projectId }: { projectId: string }) {
  const [docs, setDocs] = React.useState<DocumentItem[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(true);
  const [docsError, setDocsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let canceled = false;

    const loadDocs = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/documents`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load documents");
        const data = await res.json();
        if (!canceled) setDocs(data);
      } catch (err: any) {
        if (!canceled) setDocsError(err?.message || "Failed to load documents");
      } finally {
        if (!canceled) setDocsLoading(false);
      }
    };

    loadDocs();

    return () => {
      canceled = true;
    };
  }, [projectId]);

  // Render only document content as tables — no headers or metadata
  return (
    <div className="space-y-8 pt-8">
      {docs.map((d, idx) => (
        <ContentTable key={d.id || idx} content={d.content ?? null} />
      ))}
    </div>
  );
}