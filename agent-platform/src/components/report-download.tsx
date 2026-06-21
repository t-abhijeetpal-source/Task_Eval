"use client";
import { Download } from "lucide-react";

// Downloads a real, pre-composed markdown record for an evaluation. The content is built
// on the server from the agent catalog + ingested report docs and passed in, so this is a
// genuine artifact — not a decorative button.
export function ReportDownload({ filename, content }: { filename: string; content: string }) {
  const download = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      onClick={download}
      aria-label={`Download ${filename}`}
      title={`Download ${filename}`}
      className="glass grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] hover:text-[var(--fg)]"
    >
      <Download size={15} />
    </button>
  );
}
