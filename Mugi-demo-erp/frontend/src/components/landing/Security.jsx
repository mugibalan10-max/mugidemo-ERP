import { TrendingUp, PieChart, Maximize, Database } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";

const items = [
  { icon: TrendingUp, title: "Improved Operational Efficiency", desc: "Automate manual processes and reduce errors to accelerate your entire business cycle." },
  { icon: PieChart, title: "Data-Driven Decision Making", desc: "Leverage real-time analytics to make strategic, informed choices across all departments." },
  { icon: Maximize, title: "Scalability for Growing Businesses", desc: "Flexible architecture that adapts and scales effortlessly as your enterprise expands." },
  { icon: Database, title: "Centralized Data Management", desc: "A single source of truth eliminating data silos and ensuring perfect synchronization." },
];

export function Security() {
  useReveal();
  return (
    <section id="benefits" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="reveal text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Key Benefits
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Unlock the power of <span className="text-gradient-brand">unified operations</span>.
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
