import { getIcon } from "@/components/icons";
import { Card, CardContent } from "@/components/ui";
import { LANDING_FEATURES } from "@/lib/constants";

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 glow-orb glow-orb-teal w-[500px] h-[500px] top-0 left-1/2 -translate-x-1/2 opacity-50" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Platform Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Monitor Smarter</span>
          </h2>
          <p className="text-muted text-lg">
            A comprehensive toolkit for tracking health markers, understanding risks,
            and making informed decisions — all grounded in education, not diagnosis.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {LANDING_FEATURES.map((feature) => {
            const Icon = getIcon(feature.icon);
            return (
              <Card
                key={feature.title}
                variant="gradient"
                hover
                className="group"
              >
                <CardContent className="p-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
