import Link from "next/link";
import { ArrowRight, Shield, TrendingUp } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { APP_TAGLINE, MEDICAL_DISCLAIMER } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="glow-orb glow-orb-teal w-[600px] h-[600px] -top-48 -right-48" />
      <div className="glow-orb glow-orb-gold w-[400px] h-[400px] -bottom-32 -left-32" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <Badge variant="primary" dot className="mb-6">
            Educational Platform — Not Medical Advice
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Understand Your{" "}
            <span className="gradient-text">Health Risks</span>
            <br />
            With Confidence
          </h1>

          <p className="text-lg sm:text-xl text-muted leading-relaxed mb-8 max-w-2xl">
            {APP_TAGLINE}. Track bloodwork, assess compound risks, and get
            AI-powered educational insights — all in one premium platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Demo Dashboard
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap gap-6 text-sm text-muted">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-secondary" />
              <span>Track markers over time</span>
            </div>
          </div>
        </div>

        {/* Hero visual — stats cards */}
        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-80 space-y-4">
          <div className="rounded-xl border border-border/50 bg-surface-elevated/80 backdrop-blur p-5 shadow-lg">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Total Cholesterol</p>
            <p className="text-3xl font-bold text-foreground">185 <span className="text-sm font-normal text-muted">mg/dL</span></p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="success" size="sm">Optimal</Badge>
              <span className="text-xs text-muted">↓ 12 from last test</span>
            </div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 backdrop-blur p-5 shadow-lg ml-8">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">ALT (Liver)</p>
            <p className="text-3xl font-bold text-primary">28 <span className="text-sm font-normal text-muted">U/L</span></p>
            <div className="mt-2">
              <Badge variant="primary" size="sm">Within Range</Badge>
            </div>
          </div>
          <div className="rounded-xl border border-border/50 bg-surface-elevated/80 backdrop-blur p-5 shadow-lg">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Risk Score</p>
            <p className="text-3xl font-bold text-secondary">Low</p>
            <p className="text-xs text-muted mt-1">Based on current markers</p>
          </div>
        </div>
      </div>

      {/* Disclaimer strip */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/30 bg-surface/50 backdrop-blur py-3">
        <p className="text-center text-xs text-muted/70 px-4 max-w-4xl mx-auto">
          {MEDICAL_DISCLAIMER}
        </p>
      </div>
    </section>
  );
}
