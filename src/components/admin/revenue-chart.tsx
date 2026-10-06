"use client";
import { useState } from "react";
import { formatINR } from "@/lib/format";

type Day = { date: string; total: number; n: number };

const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/** 30-day revenue columns. Single series: no legend (the card title names it), hover tooltip per column, table for screen readers. */
export function RevenueChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...days.map((d) => d.total), 1);
  const nice = Math.ceil(max / 100 / 500) * 500 * 100 || 100000; // round up to ₹500 steps
  const H = 180;
  const peak = days.reduce((best, d, i) => (d.total > days[best].total ? i : best), 0);

  return (
    <div>
      <div className="relative" style={{ height: H + 28 }}>
        {/* gridlines: baseline, mid, top */}
        {[0, 0.5, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-line" style={{ bottom: 28 + f * H }}>
            <span className="absolute -top-2.5 right-0 bg-paper pl-2 text-[0.6875rem] text-ink-faint font-numeric">{formatINR(nice * f)}</span>
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-7 top-0 mr-14 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
          {days.map((d, i) => {
            const h = d.total ? Math.max(3, (d.total / nice) * H) : 0;
            return (
              <div key={d.date} className="relative flex h-full flex-1 items-end justify-center" onMouseEnter={() => setHover(i)}>
                <div
                  className={`w-full max-w-6 rounded-t-[4px] transition-opacity ${hover !== null && hover !== i ? "opacity-40" : ""}`}
                  style={{ height: h, background: "var(--color-leaf)" }}
                />
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-md border border-line bg-paper px-2.5 py-1.5 text-xs shadow-float" style={{ bottom: h + 6 }}>
                    <p className="text-ink-soft">{dayLabel(d.date)}</p>
                    <p className="font-semibold text-ink font-numeric">{formatINR(d.total)}</p>
                    <p className="text-ink-soft">{d.n} {d.n === 1 ? "order" : "orders"}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="absolute inset-x-0 bottom-0 mr-14 flex justify-between text-[0.6875rem] text-ink-faint">
          <span>{dayLabel(days[0].date)}</span>
          {days[peak].total > 0 && <span className="sr-only">Peak {dayLabel(days[peak].date)}</span>}
          <span>{dayLabel(days[days.length - 1].date)}</span>
        </div>
      </div>
      <table className="sr-only">
        <caption>Revenue per day, last 30 days</caption>
        <thead><tr><th>Date</th><th>Revenue</th><th>Orders</th></tr></thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}><td>{dayLabel(d.date)}</td><td>{formatINR(d.total)}</td><td>{d.n}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
