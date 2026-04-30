import React from 'react';
import { Check } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";

const tiers = [
  {
    name: "Growth",
    price: "$299",
    desc: "For small businesses starting their automation journey.",
    features: [
      "Up to 500 Loans/mo",
      "Cash Flow Analytics",
      "Tally Integration",
      "Email Support",
      "Advanced Reporting"
    ],
    accent: "bg-surface"
  },
  {
    name: "Enterprise",
    price: "$899",
    desc: "The complete command center for scaling enterprise teams.",
    features: [
      "Unlimited Loans",
      "AI Risk Assessment",
      "Custom Workflow Automation",
      "24/7 Priority Support",
      "Multiple Entity Sync",
      "Dedicated Account Manager"
    ],
    accent: "bg-gradient-brand text-primary-foreground",
    popular: true
  },
  {
    name: "Custom",
    price: "PoA",
    desc: "Tailored infrastructure for high-volume banking entities.",
    features: [
      "On-premise Deployment",
      "Custom API Webhooks",
      "SLA Guarantees",
      "Hardware Security Modules",
      "Legacy System Migration"
    ],
    accent: "bg-surface"
  }
];

export function Pricing() {
  useReveal();
  return (
    <section id="pricing" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl reveal">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Pricing Plans
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Plans built to <span className="text-gradient-brand">scale with you</span>.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Clear, transparent pricing. No hidden fees. Start small and upgrade as your ledger grows.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {tiers.map((t, i) => (
            <div
              key={t.name}
              className={`reveal relative rounded-3xl p-8 shadow-soft border border-border/50 ${t.popular ? 'scale-105 z-10 shadow-elevated' : 'bg-surface/50'}`}
              style={{ 
                transitionDelay: `${i * 100}ms`,
                background: t.popular ? 'linear-gradient(135deg, #6366f1, #a855f7)' : ''
              }}
            >
              {t.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-soft">
                  Most Popular
                </div>
              )}
              <div className={`text-sm font-semibold uppercase tracking-wider ${t.popular ? 'text-white/80' : 'text-primary'}`}>{t.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className={`text-4xl font-bold tracking-tight ${t.popular ? 'text-white' : 'text-foreground'}`}>{t.price}</span>
                <span className={t.popular ? 'text-white/60' : 'text-muted-foreground'}>/month</span>
              </div>
              <p className={`mt-4 text-sm ${t.popular ? 'text-white/80' : 'text-muted-foreground'}`}>{t.desc}</p>
              
              <ul className="mt-8 space-y-4">
                {t.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <div className={`size-5 rounded-full grid place-items-center ${t.popular ? 'bg-white/20' : 'bg-primary/10'}`}>
                      <Check className={`size-3 ${t.popular ? 'text-white' : 'text-primary'}`} />
                    </div>
                    <span className={t.popular ? 'text-white/90' : 'text-foreground/80'}>{f}</span>
                  </li>
                ))}
              </ul>

              <button className={`mt-8 w-full rounded-xl py-3 text-sm font-semibold transition-all ${t.popular ? 'bg-white text-primary hover:shadow-glow' : 'bg-primary text-white hover:opacity-90'}`}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
