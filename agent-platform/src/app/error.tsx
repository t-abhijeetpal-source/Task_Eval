"use client"; // Error boundaries must be Client Components.
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

// Next.js 16: the recovery callback is `unstable_retry` (formerly `reset`).
export default function Error({
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
    <div className="grid min-h-[60vh] place-items-center">
      <div className="card gradient-border max-w-md p-8 text-center">
        <h2 className="text-xl font-semibold tracking-tight">Something went wrong</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          An unexpected error occurred while rendering this page.
          {error?.digest ? <> Reference: <code className="text-[var(--fg)]">{error.digest}</code></> : null}
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
        >
          <RefreshCw size={16} /> Try again
        </button>
      </div>
    </div>
  );
}
