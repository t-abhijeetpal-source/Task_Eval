import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="card gradient-border max-w-md p-8 text-center">
        <p className="gradient-text text-5xl font-semibold tracking-tight">404</p>
        <h2 className="mt-3 text-lg font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          The page you’re looking for doesn’t exist or has moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
