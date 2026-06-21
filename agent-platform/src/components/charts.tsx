"use client";
import {
  Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell, Legend,
} from "recharts";
import { TREND, CATEGORY_PERF } from "@/lib/data";

const tip = {
  contentStyle: {
    background: "var(--bg-elev)", border: "1px solid var(--border)",
    borderRadius: 12, fontSize: 12, color: "var(--fg)",
  },
  labelStyle: { color: "var(--muted)" },
};

// Verification coverage per tier — total agents vs. agents with verified evidence.
// Both series are computed from the catalog (see scripts/build-metrics.mjs); nothing here
// is synthesized.
export function TrendChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={TREND} margin={{ left: -20, right: 8, top: 8 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="tier" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip {...tip} cursor={{ fill: "var(--fg)", opacity: 0.04 }} />
        <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
        <Bar dataKey="total" name="Agents" radius={[6, 6, 0, 0]} fill="var(--border)" />
        <Bar dataKey="verified" name="Verified" radius={[6, 6, 0, 0]} fill="var(--accent)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={CATEGORY_PERF} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="category" stroke="var(--muted)" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={56} />
        <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
        <Tooltip {...tip} cursor={{ fill: "var(--fg)", opacity: 0.04 }} />
        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
          {CATEGORY_PERF.map((_, i) => (
            <Cell key={i} fill={i % 2 ? "var(--accent-2)" : "var(--accent)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
