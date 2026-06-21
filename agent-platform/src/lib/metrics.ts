// Dashboard metrics — read from the build-time-generated metrics.json.
// That file is produced by scripts/build-metrics.mjs, which scans the repo for REAL
// data (agent catalog, VERIFICATION_RESULTS.md test footers, git history). Nothing
// here is hand-entered telemetry; anything illustrative is flagged in `isIllustrative`
// and surfaced with a visible badge in the UI.
import metrics from "@/content/metrics.json";

export interface DashboardMetrics {
  totalAgents: number;
  completed: number;
  successRate: number;
  executions: number;
  projects: number;
  avgScore: number;
}

export interface ActivityEvent {
  agent: string;
  text: string;
  iso: string;
  kind: string;
}

export interface TierProgress {
  tier: string;
  total: number;
  verified: number;
}

export interface CategoryScore {
  category: string;
  score: number;
}

interface MetricsFile {
  generatedAt: string;
  source: string;
  metrics: DashboardMetrics;
  activity: ActivityEvent[];
  trend: TierProgress[];
  categoryPerf: CategoryScore[];
  isIllustrative: { activity: boolean; trend: boolean };
}

const data = metrics as MetricsFile;

export const METRICS: DashboardMetrics = data.metrics;
export const ACTIVITY: ActivityEvent[] = data.activity;
export const TREND: TierProgress[] = data.trend;
export const CATEGORY_PERF: CategoryScore[] = data.categoryPerf;
export const METRICS_GENERATED_AT = data.generatedAt;
export const METRICS_SOURCE = data.source;
export const METRICS_ILLUSTRATIVE = data.isIllustrative;
