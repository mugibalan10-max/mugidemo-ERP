import { Cloud, Fingerprint, Lock, ShieldCheck } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";

const items = [
  { icon: Lock, title: "Bank-grade Security", desc: "AES-256 data encryption at rest and TLS 1.3 encryption in transit." },
  { icon: Fingerprint, title: "Granular Role Control", desc: "Permission-based matrices for Sales, Accounts, HR, and Inventory teams." },
  { icon: ShieldCheck, title: "Immutable Audit Trails", desc: "Every ledger entry and data change is logged with timestamp and IP origin." },
  { icon: Cloud, title: "Automated Continuity", desc: "Redundant cloud infrastructure with daily backups and disaster recovery." },
];

export function Security() {
  useReveal();
  return (
    <section id="security" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="reveal text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Governance
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Security for <span className="text-gradient-brand">high-stakes finance</span>.
          </h2>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((it, i) => (
            <div key={it.title} className="reveal text-center" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="mx-auto size-14 rounded-2xl bg-surface grid place-items-center text-primary shadow-soft mb-6 hover:scale-110 transition-transform">
                <it.icon className="size-6" />
              </div>
              <h3 className="font-display text-lg font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {it.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
