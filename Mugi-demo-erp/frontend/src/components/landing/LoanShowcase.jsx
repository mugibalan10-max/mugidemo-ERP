import React from "react";
import { 
  Calculator, 
  CheckCircle2, 
  FileText, 
  GitBranch, 
  Send,
  UserCheck,
  Briefcase
} from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";

const steps = [
  { 
    icon: FileText, 
    title: "Application Capture", 
    desc: "Seamless lead capture with automated KYC validation and document collection.",
    status: "done"
  },
  { 
    icon: UserCheck, 
    title: "Credit Assessment", 
    desc: "Advanced risk scoring algorithms analyze financial health and repayment capacity.",
    status: "active" 
  },
  { 
    icon: GitBranch, 
    title: "Multi-level Approval", 
    desc: "Customizable hierarchy for credit, risk, and operations team approval.",
    status: "pending" 
  },
  { 
    icon: Briefcase, 
    title: "Disbursement", 
    desc: "Single-click disbursement to bank accounts with auto-generation of loan agreements.",
    status: "pending" 
  },
  { 
    icon: Send, 
    title: "EMI Collection", 
    desc: "Automated payment links and reminders ensure healthy portfolio recovery rates.",
    status: "pending" 
  },
];

export function LoanShowcase() {
  useReveal();
  return (
    <section id="loans" className="py-20 sm:py-28 bg-surface/30">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/2 reveal">
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
              Proprietary Engine
            </div>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight leading-tight">
              A Loan Engine designed for <span className="text-gradient-brand">precision at scale</span>.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Managing thin-margin lending operations requires more than just a spreadsheet. 
              Our engine automates the friction points of the loan journey, reducing turnaround 
              time by up to 80% while tightening risk controls.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                "AI-powered Credit Risk Scoring",
                "Automated EMI Interest Computation",
                "Delinquency & Bucket Management",
                "Regulatory Compliance Exports"
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 font-medium text-foreground/80">
                  <div className="size-5 rounded-full bg-primary/10 grid place-items-center">
                    <CheckCircle2 className="size-3 text-primary" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:w-1/2 w-full reveal">
            <div className="relative glass-strong rounded-[2.5rem] p-8 shadow-elevated overflow-hidden">
               {/* Lifecycle Visualization */}
               <div className="space-y-6 relative z-10">
                 {steps.map((s, i) => (
                   <div key={s.title} className="flex items-start gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className={`size-10 rounded-xl grid place-items-center border-2 transition-all duration-500 ${
                          s.status === 'done' ? 'bg-primary border-primary text-primary-foreground' : 
                          s.status === 'active' ? 'bg-surface border-primary text-primary animate-pulse shadow-glow' : 
                          'bg-surface border-border text-muted-foreground opacity-50'
                        }`}>
                           <s.icon className="size-5" />
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`w-0.5 h-10 mt-1 ${s.status === 'done' ? 'bg-primary' : 'bg-border opacity-50'}`} />
                        )}
                      </div>
                      <div className="pt-1">
                         <h3 className="font-semibold text-sm">{s.title}</h3>
                         <p className="text-xs text-muted-foreground mt-1 max-w-xs">{s.desc}</p>
                      </div>
                   </div>
                 ))}
               </div>

               {/* Design decoration */}
               <div className="absolute -bottom-10 -right-10 size-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
