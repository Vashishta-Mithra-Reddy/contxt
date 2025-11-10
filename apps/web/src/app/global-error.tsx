"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: 16, maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: "gray", marginBottom: 16 }}>
            {error?.message || "Unexpected error"}
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#2b2b2b",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}