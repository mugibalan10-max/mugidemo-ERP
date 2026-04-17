import React from 'react';
import { AlertTriangle, ArrowUpRight, CircleDollarSign, TrendingUp, Wallet } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";
import { useCountUp } from "../../hooks/use-count-up";

export function DashboardSection() {
  useReveal();
  const revenue = useCountUp(1284560);
  const active = useCountUp(842);
  const pending = useCountUp(17);
  const growth = useCountUp(34.6);

  return (
    <section id="dashboard" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl reveal">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            ERP Dashboard
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Every metric. <span className="text-gradient-brand">One glance.</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            A futuristic command center that surfaces what matters — revenue, loans, risk, and
            growth — in real time.
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-12 gap-5 reveal">
          <BigStat
            className="lg:col-span-3"
            icon={<Wallet className="size-5" />}
            label="Total Revenue"
            value={`$${Math.round(revenue).toLocaleString()}`}
            delta="+12.4%"
            tone="primary"
          />
          <BigStat
            className="lg:col-span-3"
            icon={<CircleDollarSign className="size-5" />}
            label="Active Loans"
            value={Math.round(active).toLocaleString()}
            delta="+38"
            tone="cyan"
          />
          <BigStat
            className="lg:col-span-3"
            icon={<AlertTriangle className="size-5" />}
            label="Pending EMI"
            value={Math.round(pending).toString()}
            delta="-4"
            tone="warning"
          />
          <BigStat
            className="lg:col-span-3"
            icon={<TrendingUp className="size-5" />}
            label="Monthly Growth"
            value={`${growth.toFixed(1)}%`}
            delta="+2.1%"
            tone="success"
          />

          <div className="lg:col-span-8 glass-strong rounded-3xl shadow-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Monthly growth
                </div>
                <h3 className="mt-1 font-display text-xl font-semibold">
                  Performance over time
                </h3>
              </div>
              <div className="flex gap-2 text-xs">
                {["1M", "3M", "1Y", "All"].map((t, i) => (
                  <button
                    key={t}
                    className={`rounded-full px-3 py-1 hairline ${
                      i === 1
                        ? "bg-gradient-brand text-primary-foreground"
                        : "bg-surface text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <BigChart />
          </div>

          <div className="lg:col-span-4 glass-strong rounded-3xl shadow-elevated p-6 flex flex-col">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Risk analysis
            </div>
            <div className="relative mt-4 grid place-items-center">
              <RiskGauge value={28} />
              <div className="absolute text-center">
                <div className="font-display text-3xl font-semibold tabular-nums">28</div>
                <div className="text-[11px] uppercase tracking-wider text-success">Low risk</div>
              </div>
            </div>
            <div className="mt-auto pt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-muted-foreground">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BigStat({
  icon,
  label,
  value,
  delta,
  tone,
  className = "",
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    cyan: "bg-accent text-accent-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
  }[tone];
  return (
    <div className={`glass-strong rounded-3xl shadow-soft p-5 hover:-translate-y-1 transition-transform ${className}`}>
      <div className="flex items-center justify-between">
        <div className={`size-10 rounded-xl grid place-items-center ${toneCls}`}>{icon}</div>
        <span className="text-xs font-semibold rounded-full bg-success/15 text-success px-2 py-0.5 inline-flex items-center gap-1">
          <ArrowUpRight className="size-3" /> {delta}
        </span>
      </div>
      <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function BigChart() {
  const data = [22, 30, 26, 38, 34, 46, 42, 54, 48, 60, 56, 72];
  const w = 720;
  const h = 200;
  const max = Math.max(...data);
  const step = w / (data.length - 1);
  const path = data
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * (h - 30) - 10}`)
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-5 w-full h-48">
      <defs>
        <linearGradient id="big-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="big-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((y) => (
        <line
          key={y}
          x1={0}
          x2={w}
          y1={h * y}
          y2={h * y}
          stroke="rgba(0,0,0,0.08)"
          strokeDasharray="4 6"
        />
      ))}
      <path d={area} fill="url(#big-area)" />
      <path
        d={path}
        fill="none"
        stroke="url(#big-line)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2000"
      />
      {data.map((p, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - (p / max) * (h - 30) - 10}
          r={3}
          fill="white"
          stroke="#6366f1"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

function RiskGauge({ value }) {
  const r = 70;
  const c = Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width="180" height="110" viewBox="0 0 180 110">
      <defs>
        <linearGradient id="gauge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <path
        d="M 20 100 A 70 70 0 0 1 160 100"
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={14}
        strokeLinecap="round"
      />
      <path
        d="M 20 100 A 70 70 0 0 1 160 100"
        fill="none"
        stroke="url(#gauge)"
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
