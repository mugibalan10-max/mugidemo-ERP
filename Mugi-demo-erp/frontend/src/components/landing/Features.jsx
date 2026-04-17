import React from 'react';
import { BarChart3, Landmark, Receipt, Wallet, Users, RefreshCcw } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";

const features = [
  {
    icon: Landmark,
    title: "Loan Lifecycle Management",
    desc: "End-to-end loan automation — from lead capture and credit scoring to disbursement and EMI collection.",
    bullets: ["Credit Risk Analysis", "EMI Auto-scheduling", "Collection Tracking"],
    accent: "from-blue-600 to-indigo-500",
  },
  {
    icon: RefreshCcw,
    title: "Live TallyPrime Sync",
    desc: "Industry-leading data pipeline that pushes your sales, payments, and ledgers to Tally in real-time.",
    bullets: ["Auto-Voucher Creation", "Ledger Reconciliation", "Error Logs"],
    accent: "from-emerald-500 to-teal-400",
  },
  {
    icon: Wallet,
    title: "Finance & Accounting",
    desc: "A powerful double-entry accounting engine with GST-ready reporting and multi-entity support.",
    bullets: ["GST Reports", "Cash Flow Sync", "Multi-Currency"],
    accent: "from-indigo-500 to-blue-400",
  },
  {
    icon: Receipt,
    title: "Procurement & Inventory",
    desc: "Full visibility over your supply chain — from purchase requests and POs to GRNs and stock valuation.",
    bullets: ["Auto-Reorder Alerts", "Batch Tracking", "Vendor Management"],
    accent: "from-amber-500 to-orange-400",
  },
  {
    icon: Users,
    title: "HR & Payroll Engine",
    desc: "Automate your workforce management with biometric attendance sync and automated salary computation.",
    bullets: ["Salary Automation", "Attendance Tracking", "Compliance Forms"],
    accent: "from-rose-500 to-pink-400",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    desc: "Futuristic business intelligence dashboards that surface trends and risk metrics across every module.",
    bullets: ["Custom Dashboards", "Audit Trails", "Export to PDF/Excel"],
    accent: "from-indigo-600 to-violet-400",
  },
];

export function Features() {
  useReveal();
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl reveal">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Enterprise Suite
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            A complete ecosystem for <span className="text-gradient-brand">modern finance</span>.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built to replace fragmented spreadsheets with a single, intelligent workstation that 
            manages every aspect of your business operations.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <article
              key={f.title}
              className="reveal group relative overflow-hidden rounded-3xl glass-strong p-6 shadow-soft hover:shadow-elevated transition-all duration-500 hover:-translate-y-1"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div
                aria-hidden
                className={`absolute -top-20 -right-20 size-56 rounded-full opacity-10 blur-2xl bg-gradient-to-br ${f.accent} transition-opacity group-hover:opacity-20`}
              />
              <div className="relative flex flex-col items-start gap-4">
                <div
                  className={`size-12 rounded-2xl bg-gradient-to-br ${f.accent} grid place-items-center text-primary-foreground shadow-soft`}
                >
                  <f.icon className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {f.bullets.map((b) => (
                      <li
                        key={b}
                        className="text-[10px] uppercase font-bold tracking-wider rounded-lg bg-surface px-2.5 py-1 text-foreground/60"
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
