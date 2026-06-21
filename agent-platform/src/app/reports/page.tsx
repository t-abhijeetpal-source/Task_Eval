import Link from "next/link";
import { Badge } from "@/components/ui/kit";
import { ReportDownload } from "@/components/report-download";
import { FileText } from "lucide-react";
import { AGENTS, agentEntry, type Agent } from "@/lib/data";

export const metadata = { title: "Reports — AgentOS" };

// Compose a genuine markdown record for an evaluation: catalog facts + evidence, then the
// real ingested report document (VERIFICATION_RESULTS / agent-analysis) when one exists.
function buildRecord(a: Agent): string {
  const entry = agentEntry(a.code);
  const lines = [
    `# ${a.code} · ${a.name} — Evaluation Record`,
    "",
    `- **Tier:** ${a.tier}`,
    `- **Category:** ${a.category}`,
    `- **Difficulty:** ${a.difficulty}`,
    `- **Status:** ${a.status}`,
    `- **Score:** ${a.score} / 100`,
    "",
    "## Summary",
    a.description,
    "",
    "## Metrics",
    ...a.metrics.map((m) => `- **${m.label}:** ${m.value}`),
    "",
    "## Verification evidence",
    a.evidence ?? "_No verification evidence captured for this run._",
  ];
  const report = entry?.documents?.find((d) => /verification|record|analysis/i.test(d.file));
  if (report) {
    lines.push("", "---", "", `## Source: ${report.file}`, "", report.content.trim());
  }
  return lines.join("\n") + "\n";
}

export default function ReportsPage() {
  const reports = AGENTS.filter((a) => a.evidence).map((a) => ({
    code: a.code, name: a.name, id: a.id, status: a.status,
    file: `${a.code}_record.md`, evidence: a.evidence!, content: buildRecord(a),
  }));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verification Reports</h1>
        <p className="text-sm text-[var(--muted)]">Evidence-backed records for every completed evaluation. Download a record as Markdown.</p>
      </div>
      <div className="card divide-y divide-[var(--border)] p-0">
        {reports.map((r) => (
          <div key={r.id} className="flex items-center gap-4 px-5 py-4">
            <FileText size={18} className="shrink-0 text-[var(--accent)]" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/agents/${r.id}`} className="text-sm font-medium hover:underline">{r.code} · {r.name}</Link>
                <Badge variant="status">{r.status}</Badge>
              </div>
              <p className="truncate text-xs text-[var(--muted)]">{r.evidence}</p>
            </div>
            <code className="hidden sm:block text-xs text-[var(--muted)]">{r.file}</code>
            <ReportDownload filename={r.file} content={r.content} />
          </div>
        ))}
      </div>
    </div>
  );
}
