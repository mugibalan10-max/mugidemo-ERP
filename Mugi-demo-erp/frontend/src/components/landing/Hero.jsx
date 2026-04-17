import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useReveal } from "../../hooks/use-reveal";

export function Hero() {
  useReveal();
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10">
        <div className="absolute top-0 left-1/4 size-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 size-[500px] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="mx-auto max-w-6xl px-4 text-center">
        <div className="reveal inline-flex items-center gap-2 rounded-full hairline bg-surface px-3 py-1 text-xs font-semibold text-primary mb-8">
          <Sparkles className="size-3" />
          <span>v5.0: Advanced Loan Automation Engine is live</span>
        </div>

        <h1 className="reveal font-display text-5xl sm:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
          The Intelligent <span className="text-gradient-brand">ERP & Unified</span> <br />
          Financial Operating System.
        </h1>

        {/* Brand New Feature: Dashboard Preview with Hover Effect */}
        <div className="reveal mt-12 relative group max-w-3xl mx-auto perspective-1000">
           <div className="relative rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-700 ease-out group-hover:rotate-x-2 group-hover:rotate-y-[-2deg] group-hover:scale-[1.03] group-hover:shadow-[0_45px_100px_-20px_rgba(99,102,241,0.3)]">
              <img 
                src="/assets/dashboard_preview.png" 
                alt="Zen Finance Loan Management Dashboard"
                className="w-full h-auto object-cover border border-white/10"
              />
              {/* Inner Glow Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
           </div>
           
           {/* Decorative Floaters */}
           <div className="absolute -top-6 -right-6 px-4 py-2 rounded-xl bg-white/90 backdrop-blur shadow-soft border border-border/50 text-xs font-bold text-primary animate-bounce hidden sm:block">
              +12.4% Recovery
           </div>
        </div>

        <p className="reveal mt-12 mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Automate the entire lifecycle of your finance operations. From complex loan disbursements 
          to GST-ready invoicing and real-time Tally synchronization — all in one unified, 
          enterprise-grade workstation.
        </p>

        <div className="reveal mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="btn-glow w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-8 py-4 text-sm font-bold text-primary-foreground shadow-elevated hover:scale-[1.02] transition-transform"
          >
            Enter Workstation
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="#loans"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl hairline bg-surface px-8 py-4 text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
          >
            <Play className="size-4 fill-current" />
            Watch Product Tour
          </a>
        </div>

        <div className="reveal mt-16 flex items-center justify-center gap-8 sm:gap-12 opacity-50 grayscale transition-all hover:grayscale-0">
          <span className="font-display font-bold text-xl">FINTECH</span>
          <span className="font-display font-bold text-xl">LENDING+</span>
          <span className="font-display font-bold text-xl">TALLY SYNC</span>
          <span className="font-display font-bold text-xl">SECURE-PAY</span>
        </div>
      </div>
    </section>
  );
}
