import { LayoutDashboard, Cloud, ShieldCheck, Settings2, Globe, Link as LinkIcon } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";

const steps = [
  {
    icon: LayoutDashboard,
    title: "Real-time Analytics",
    desc: "Interactive dashboards offering actionable insights and real-time business intelligence.",
  },
  {
    icon: Cloud,
    title: "Cloud-Based Access",
    desc: "Secure, highly available cloud infrastructure allowing access from anywhere.",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Permissions",
    desc: "Granular access control ensuring data security and compliant internal governance.",
  },
  {
    icon: Settings2,
    title: "Workflow Automation",
    desc: "Automate repetitive tasks, approvals, and data synchronization across modules.",
  },
  {
    icon: Globe,
    title: "Multi-Branch & Currency",
    desc: "Seamlessly manage operations across multiple geographical locations and currencies.",
  },
  {
    icon: LinkIcon,
    title: "Integration Capabilities",
    desc: "Robust APIs and built-in connectors to integrate with third-party tools.",
  },
];

export function HowItWorks() {
  useReveal();
  return (
    <section id="features" className="py-20 sm:py-28 bg-surface/30 relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 relative z-10">
        <div className="reveal text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Core Features
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Enterprise-Grade <span className="text-gradient-brand">Capabilities</span>.
          </h2>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-12 sm:gap-6 relative">
          {steps.map((s, i) => (
            <div key={s.title} className="reveal relative flex flex-col items-center text-center" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="size-16 rounded-3xl bg-surface grid place-items-center text-primary shadow-soft relative z-10">
                <s.icon className="size-7" />
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
