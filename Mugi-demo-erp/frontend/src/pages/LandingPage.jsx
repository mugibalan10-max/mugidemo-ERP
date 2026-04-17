import React from 'react';
import { Navbar } from "../components/landing/Navbar";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { LoanShowcase } from "../components/landing/LoanShowcase";
import { DashboardSection } from "../components/landing/DashboardSection";
import { Security } from "../components/landing/Security";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Testimonials } from "../components/landing/Testimonials";
import { CTA } from "../components/landing/CTA";
import { Footer } from "../components/landing/Footer";
import '../LandingPage.css';

function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground scroll-smooth">
      <Navbar />
      <Hero />
      <Features />
      <LoanShowcase />
      <DashboardSection />
      <Testimonials />
      <Security />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  );
}

export default LandingPage;
