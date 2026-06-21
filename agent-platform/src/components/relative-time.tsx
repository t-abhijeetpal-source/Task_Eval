"use client";
import { useEffect, useState } from "react";

const DIVISIONS: [number, Intl.RelativeTimeFormatUnit][] = [
  [60, "second"],
  [60, "minute"],
  [24, "hour"],
  [7, "day"],
  [4.34524, "week"],
  [12, "month"],
  [Number.POSITIVE_INFINITY, "year"],
];

function relative(from: number, now: number) {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  let duration = (from - now) / 1000;
  for (const [amount, unit] of DIVISIONS) {
    if (Math.abs(duration) < amount) return rtf.format(Math.round(duration), unit);
    duration /= amount;
  }
  return rtf.format(Math.round(duration), "year");
}

/** Renders an ISO timestamp as live relative time (e.g. "2 hours ago"), computed on the
 *  client so it never goes stale the way a build-time string would. The absolute time is
 *  available on hover. */
export function RelativeTime({ iso }: { iso: string }) {
  const ms = Date.parse(iso);
  // Render the absolute date on the server / first paint to avoid hydration drift; swap to
  // relative once mounted on the client.
  const [label, setLabel] = useState<string>(() =>
    Number.isNaN(ms) ? iso : new Date(ms).toISOString().slice(0, 10)
  );
  useEffect(() => {
    if (Number.isNaN(ms)) return;
    const update = () => setLabel(relative(ms, Date.now()));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [ms]);
  return (
    <time dateTime={iso} title={Number.isNaN(ms) ? iso : new Date(ms).toLocaleString()}>
      {label}
    </time>
  );
}
