"use client";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Download, Check, ChevronDown } from "lucide-react";
import type { Agent, AgentEntry } from "@/lib/data";
import { cn } from "@/lib/utils";

type View = "Preview" | "Raw";
interface Doc { label: string; file: string; content: string; lines: number; bytes: number; kind: "definition" | "output" }

function fmtBytes(b: number) {
  return b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`;
}

export function DocViewer({ agent, entry }: { agent: Agent; entry?: AgentEntry }) {
  const docs: Doc[] = useMemo(() => {
    const out: Doc[] = [];
    if (entry?.definition) {
      const c = entry.definition;
      out.push({ label: "Agent Definition", file: entry.definitionFile ?? `${agent.code}_agent.md`, content: c, lines: c.split("\n").length, bytes: c.length, kind: "definition" });
    }
    for (const d of entry?.documents ?? []) out.push({ ...d, kind: "output" });
    return out;
  }, [entry, agent.code]);

  const [idx, setIdx] = useState(0);
  const [view, setView] = useState<View>("Preview");
  const [copied, setCopied] = useState(false);
  const cur = docs[Math.min(idx, docs.length - 1)];

  if (!cur) {
    return <div className="card p-8 text-center text-sm text-[var(--muted)]">No source documents found for {agent.code}.</div>;
  }

  const copy = async () => { await navigator.clipboard.writeText(cur.content); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const download = () => {
    const blob = new Blob([cur.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = cur.label === "Agent Definition" ? cur.file : cur.label; a.click();
    URL.revokeObjectURL(url);
  };
  const lines = cur.content.split("\n");

  return (
    <div className="card overflow-hidden">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] p-3">
        <div className="relative">
          <select value={idx} onChange={(e) => setIdx(Number(e.target.value))}
            className="appearance-none rounded-lg bg-[var(--fg)]/5 py-1.5 pl-3 pr-8 text-xs font-medium outline-none ring-1 ring-[var(--border)] focus:ring-[var(--accent)]">
            {docs.map((d, i) => (
              <option key={i} value={i}>{d.kind === "definition" ? "Agent Definition" : `Output · ${d.label}`}</option>
            ))}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        </div>
        <span className="rounded-md bg-[var(--fg)]/5 px-2 py-0.5 text-[11px] text-[var(--muted)]">{docs.length} doc{docs.length > 1 ? "s" : ""}</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-[var(--fg)]/5 p-0.5">
            {(["Preview", "Raw"] as View[]).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition",
                  view === v ? "bg-[var(--bg-elev)] text-[var(--fg)] shadow-sm ring-1 ring-[var(--border)]" : "text-[var(--muted)] hover:text-[var(--fg)]")}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110">
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy .md"}
          </button>
          <button onClick={download}
            className="glass inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:text-[var(--fg)]">
            <Download size={14} /> Download
          </button>
        </div>
      </div>

      {/* source line */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-1.5 font-mono text-[11px] text-[var(--muted)]">
        <span>{cur.file}</span>
        <span>{cur.lines} lines · {fmtBytes(cur.bytes)}</span>
      </div>

      {/* body */}
      {view === "Preview" ? (
        <div className="md-prose max-h-[62vh] overflow-auto scrollbar-thin px-5 py-3 text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{cur.content}</ReactMarkdown>
        </div>
      ) : (
        <div className="max-h-[62vh] overflow-auto scrollbar-thin font-mono text-[12px] leading-relaxed">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((ln, i) => (
                <tr key={i} className="hover:bg-[var(--fg)]/[0.03]">
                  <td className="select-none border-r border-[var(--border)] px-3 text-right align-top text-[var(--muted)] tabular-nums w-12">{i + 1}</td>
                  <td className="whitespace-pre-wrap break-words px-4 py-px align-top">{ln || " "}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
