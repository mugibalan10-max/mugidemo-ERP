import { LayoutDashboard, LogIn, Settings2, RefreshCcw } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";

const steps = [
  {
    icon: LogIn,
    title: "1. Unified Onboarding",
    desc: "Sign into your Zen Finance instance and set up your organizational entities.",
  },
  {
    icon: RefreshCcw,
    title: "2. Sync ERP Logic",
    desc: "Connect your existing Tally data or start fresh with our automated accounting templates.",
  },
  {
    icon: Settings2,
    title: "3. Configure Workflows",
    desc: "Define your loan approval hierarchies, interest rates, and payroll structures.",
  },
  {
    icon: LayoutDashboard,
    title: "4. Scale Operations",
    desc: "Start processing loans, invoices, and payroll while we handle the automated synchronization.",
  },
];

export function HowItWorks() {
  useReveal();
  return (
    <section id="how" className="py-20 sm:py-28 bg-surface/30 relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 relative z-10">
        <div className="reveal text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Onboarding
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            How to <span className="text-gradient-brand">Automate Your Ledger</span>.
          </h2>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-6 relative">
          {steps.map((s, i) => (
            <div key={s.title} className="reveal relative flex flex-col items-center text-center" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="size-16 rounded-3xl bg-surface grid place-items-center text-primary shadow-soft relative z-10">
                <s.icon className="size-7" />
                <div className="absolute -top-3 -right-3 size-8 rounded-full bg-gradient-brand text-primary-foreground text-xs font-bold grid place-items-center border-4 border-surface shadow-hard">
                  {i + 1}
                </div>
              </div>
              <h3 className="mt-8 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
