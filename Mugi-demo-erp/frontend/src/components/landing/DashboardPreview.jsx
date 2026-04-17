import React from 'react';
import { ArrowUpRight, Bell, CheckCircle2, CircleDollarSign, TrendingUp, Wallet } from "lucide-react";
import { useCountUp } from "../../hooks/use-count-up";

function formatCurrency(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function DashboardPreview() {
  const revenue = useCountUp(248320);
  const loans = useCountUp(1284);
  const growth = useCountUp(28.4);

  // Simple SVG chart points
  const points = [8, 18, 14, 26, 22, 34, 30, 44, 38, 52, 48, 62, 70];
  const max = Math.max(...points);
  const w = 320;
  const h = 90;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * (h - 10) - 4}`)
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div className="relative">
      {/* Floating side cards */}
      <div
        className="absolute -left-4 sm:-left-10 top-10 z-20 hidden sm:block"
        style={{ animation: "float 6s ease-in-out infinite" }}
      >
        <div className="glass-strong rounded-2xl shadow-elevated p-4 w-56">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-green-100 grid place-items-center">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">
                Loan approved
              </div>
              <div className="text-sm font-semibold">#LN-20418 · $42,000</div>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full w-[82%] bg-indigo-600" />
          </div>
        </div>
      </div>

      <div
        className="absolute -right-3 sm:-right-6 -bottom-4 z-20 hidden sm:block"
        style={{ animation: "float 9s ease-in-out infinite" }}
      >
        <div className="glass-strong rounded-2xl shadow-elevated p-4 w-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Bell className="size-3.5 text-indigo-600" /> EMI reminder
            </div>
            <span className="text-[10px] rounded-full bg-orange-100 text-orange-700 px-2 py-0.5">
              Due 3d
            </span>
          </div>
          <div className="mt-2 text-sm font-semibold">Acme Corp · $3,250</div>
          <div className="mt-2 text-xs text-slate-500">Auto-debit scheduled · Apr 22</div>
        </div>
      </div>

      {/* Main card */}
      <div className="relative glass-strong rounded-3xl shadow-elevated p-5 sm:p-6 overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 size-72 rounded-full opacity-40 bg-indigo-600"
          style={{ backgroundImage: "linear-gradient(135deg, #6366f1, #10b981)" }}
        />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Finance Overview
            </div>
            <div className="mt-1 text-sm text-slate-500">April · 2026</div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2.5 py-1 text-xs font-semibold">
            <ArrowUpRight className="size-3.5" />
            {growth.toFixed(1)}%
          </div>
        </div>

        {/* Stats */}
        <div className="relative mt-5 grid grid-cols-3 gap-3">
          <Stat
            icon={<Wallet className="size-4" />}
            label="Revenue"
            value={formatCurrency(revenue)}
            tone="primary"
          />
          <Stat
            icon={<CircleDollarSign className="size-4" />}
            label="Active Loans"
            value={Math.round(loans).toLocaleString()}
            tone="cyan"
          />
          <Stat
            icon={<TrendingUp className="size-4" />}
            label="Growth"
            value={`+${growth.toFixed(1)}%`}
            tone="success"
          />
        </div>

        {/* Chart */}
        <div className="relative mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Cash flow</div>
            <div className="text-xs text-slate-500">Last 13 weeks</div>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full h-24">
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#area)" />
            <path
              d={path}
              fill="none"
              stroke="url(#line)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1000"
            />
          </svg>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            {["W1", "W3", "W5", "W7", "W9", "W11", "W13"].map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
        </div>

        {/* EMI list */}
        <div className="relative mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
            <div className="text-xs text-slate-500">EMI tracking</div>
            <div className="mt-2 space-y-2">
              {[
                ["Northwind", 78],
                ["Globex", 52],
                ["Initech", 91],
              ].map(([name, pct]) => (
                <div key={name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{name}</span>
                    <span className="text-slate-500">{pct}%</span>
                  </div>
                  <div className="h-1.5 mt-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
            <div className="text-xs text-slate-500">Risk analysis</div>
            <div className="mt-2 flex items-end gap-1.5 h-16">
              {[28, 42, 35, 60, 48, 72, 55, 80, 64].map((v, i) => (
                <div
                  key={i}
                  className="w-2 rounded-t bg-indigo-500"
                  style={{ height: `${v}%`, opacity: 0.55 + i * 0.05 }}
                />
              ))}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Portfolio risk · <span className="text-green-600 font-semibold">Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}) {
  const toneCls =
    tone === "primary"
      ? "bg-indigo-100 text-indigo-700"
      : tone === "cyan"
        ? "bg-cyan-100 text-cyan-700"
        : "bg-green-100 text-green-700";
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
      <div className="flex items-center gap-2">
        <div className={`size-7 rounded-lg grid place-items-center ${toneCls}`}>{icon}</div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500">
          {label}
        </div>
      </div>
      <div className="mt-2 font-display text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
