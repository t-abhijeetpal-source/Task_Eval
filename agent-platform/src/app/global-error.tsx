"use client"; // global-error replaces the root layout, so it must render <html>/<body>.
import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, display: "grid", placeItems: "center", minHeight: "100vh", background: "#0a0a0f", color: "#e5e5ef" }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 420 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Application error</h2>
          <p style={{ color: "#9999ad", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            A critical error occurred. Please try again.
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{ marginTop: "1.5rem", padding: "0.625rem 1rem", borderRadius: 12, border: "none", background: "#6366f1", color: "white", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
