import Link from "next/link";
import { Check } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { PRICING_TIERS } from "@/lib/constants";
import { cn } from "@/utils/cn";

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-surface/50 border-y border-border/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Plans
          </h2>
          <p className="text-muted text-lg">
            Start free and upgrade when you need advanced tracking and AI insights.
            Pricing is a placeholder — final tiers coming soon.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PRICING_TIERS.map((tier) => (
            <Card
              key={tier.name}
              variant={tier.highlighted ? "elevated" : "default"}
              padding="lg"
              className={cn(
                "relative flex flex-col",
                tier.highlighted &&
                  "border-primary/40 shadow-[0_0_40px_rgba(20,184,166,0.12)]"
              )}
            >
              {tier.highlighted && (
                <Badge variant="primary" className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                <p className="text-sm text-muted mt-1">{tier.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-muted text-sm">{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/signup">
                <Button
                  variant={tier.highlighted ? "primary" : "outline"}
                  fullWidth
                >
                  {tier.price === "$0" ? "Get Started" : "Start Free Trial"}
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted mt-8">
          * Pricing shown is placeholder. Final pricing will be announced before launch.
        </p>
      </div>
    </section>
  );
}
