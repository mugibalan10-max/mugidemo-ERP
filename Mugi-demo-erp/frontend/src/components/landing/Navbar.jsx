import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const links = [
  { label: "Modules", href: "#features" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Benefits", href: "#benefits" },
];

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 pt-4">
      <div className="mx-auto max-w-6xl glass rounded-2xl shadow-soft flex items-center justify-between px-4 sm:px-5 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-gradient-brand grid place-items-center shadow-soft">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="font-display text-base font-semibold tracking-tight">
            Zen<span className="text-gradient-brand"> Enterprise</span>
          </span>
          <span className="hidden sm:inline ml-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            ERP
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center text-sm font-medium text-foreground/80 hover:text-foreground px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            to="/login"
            className="btn-glow inline-flex items-center gap-2 rounded-xl bg-gradient-brand text-primary-foreground text-sm font-semibold px-4 py-2 shadow-soft"
          >
            Login to ERP
          </Link>
        </div>
      </div>
    </header>
  );
}
