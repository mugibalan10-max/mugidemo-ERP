import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-gradient-brand grid place-items-center">
            <Sparkles className="size-3.5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold">
            Zen<span className="text-gradient-brand"> Enterprise</span> ERP
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Zen Enterprise Systems. All rights reserved.
        </div>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
          <a href="/status" className="hover:text-foreground transition-colors">Status</a>
        </div>
      </div>
    </footer>
  );
}
