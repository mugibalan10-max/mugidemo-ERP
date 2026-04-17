import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";

export function CTA() {
  useReveal();
  return (
    <section id="login" className="relative py-24 sm:py-32 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-hero"
        style={{ backgroundSize: "200% 200%", animation: "var(--animate-gradient-shift)" }}
      />
      <div className="mx-auto max-w-4xl px-4 text-center reveal">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs text-muted-foreground shadow-soft">
          Ready when you are
        </div>
        <h2 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
          Start managing finance{" "}
          <span className="text-gradient-brand">smarter today</span>.
        </h2>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Join 12,400+ teams running their entire finance, loan, and ERP workflows on Zen.
          No setup fee. Migrate in minutes.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/login"
            className="btn-glow inline-flex items-center gap-2 rounded-xl bg-gradient-brand text-primary-foreground text-base font-semibold px-6 py-3.5 shadow-soft"
            style={{ animation: "var(--animate-pulse-glow)" }}
          >
            Login to ERP
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl glass-strong text-foreground text-base font-semibold px-6 py-3.5 hover:-translate-y-0.5 transition-transform"
          >
            Talk to sales
          </a>
        </div>
      </div>
    </section>
  );
}
