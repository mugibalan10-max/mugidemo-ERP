import React from 'react';
import { Quote } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";
import BorderGlow from "../ui/BorderGlow";

const testimonials = [
  {
    author: "Sarah J. Miller",
    role: "CFO, Globe-X Finance",
    text: "Zen Finance transformed our loan approval lifecycle from weeks to hours. The Tally integration is a masterpiece of engineering.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
  },
  {
    author: "David Chen",
    role: "Director, Northwind Systems",
    text: "The most intuitive ERP we've ever deployed. The dashboard surfaces critical risk metrics before they become problems.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David"
  },
  {
    author: "Elena Rodriguez",
    role: "Operations Head, Initech",
    text: "Scaling our fintech business was impossible without Zen. The automated billing and collection flows are game-changers.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena"
  }
];

export function Testimonials() {
  useReveal();
  return (
    <section className="py-20 sm:py-28 bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <div className="max-w-2xl mx-auto reveal">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Success Stories
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Trusted by the world's <span className="text-gradient-brand">best finance teams</span>.
          </h2>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <BorderGlow
              key={t.author}
              className="reveal h-full"
              edgeSensitivity={30}
              glowColor="250 100 50" // A more vibrant blue for light mode
              backgroundColor="#f8fafc" // Light mild color
              borderRadius={28}
              glowRadius={40}
              glowIntensity={1.2}
              coneSpread={25}
              animated={true}
              colors={['#e0e7ff', '#f5f3ff', '#ecfeff']}
            >
              <div className="p-8 text-left relative h-full flex flex-col">
                <Quote className="size-10 text-primary/10 absolute top-6 right-6" />
                <p className="text-slate-700 leading-relaxed relative z-10 flex-1">"{t.text}"</p>
                <div className="mt-8 flex items-center gap-4">
                  <img src={t.avatar} alt={t.author} className="size-12 rounded-full border border-slate-200 bg-white shadow-sm" />
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{t.author}</div>
                    <div className="text-xs text-slate-500 font-medium">{t.role}</div>
                  </div>
                </div>
              </div>
            </BorderGlow>
          ))}
        </div>
      </div>
    </section>
  );
}
