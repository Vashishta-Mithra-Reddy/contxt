"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

// Highlight.js GitHub theme (works in light/dark fairly well)
import "highlight.js/styles/github.css";

export default function LLMAnswerViewer({ content }: { content: string }) {
  const Code = React.useCallback(
    ({
      inline,
      className,
      children,
      ...props
    }: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      inline?: boolean;
    }) => {
      const text = Array.isArray(children) ? children.join("") : String(children || "");
      const isInline = !!inline;

      if (isInline) {
        return (
          <code className="rounded bg-muted px-1 py-[2px] font-mono text-[0.85em]">
            {children}
          </code>
        );
      }

      const [copied, setCopied] = React.useState(false);
      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {}
      };

      return (
        <div className="relative group">
          <button
            type="button"
            onClick={onCopy}
            className="absolute top-2 right-2 z-10 rounded-md border bg-background/90 px-2 py-1 text-xs text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Copy code"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <pre className="rounded-md border bg-muted p-3 overflow-x-auto">
            <code className={`font-mono text-sm ${className || ""}`} {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    },
    []
  );

  const A = ({
    href,
    children,
    ...props
  }: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) => {
    const safeHref = typeof href === "string" ? href : "#";
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400"
        {...props}
      >
        {children}
      </a>
    );
  };

  const Img = ({
    alt,
    ...props
  }: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>) => {
    return (
      <img
        alt={alt || ""}
        loading="lazy"
        className="max-w-full rounded-md border"
        {...props}
      />
    );
  };

  if (!content || !content.trim()) {
    return <div className="rounded-md border p-3 text-sm text-muted-foreground">—</div>;
  }

  return (
    <div className="rounded-md border px-4 pt-2 pb-4 text-sm leading-6 space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight as any]}
        components={{
          a: A,
          img: Img,
          code: Code,
          h1: (props) => <h1 className="text-xl font-semibold mt-2" {...props} />,
          h2: (props) => <h2 className="text-lg font-semibold mt-2" {...props} />,
          h3: (props) => <h3 className="text-base font-semibold mt-2" {...props} />,
          p: (props) => <p className="my-2" {...props} />,
          blockquote: (props) => (
            <blockquote
              className="border-l-4 pl-3 my-2 italic text-muted-foreground"
              {...props}
            />
          ),
          ul: (props) => <ul className="list-disc pl-6 space-y-1" {...props} />,
          ol: (props) => <ol className="list-decimal pl-6 space-y-1" {...props} />,
          li: (props) => <li className="my-0.5" {...props} />,
          table: (props) => (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" {...props} />
            </div>
          ),
          th: (props) => <th className="border px-2 py-1 font-semibold" {...props} />,
          td: (props) => <td className="border px-2 py-1" {...props} />,
          hr: (props) => <hr className="my-4 border-muted" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}