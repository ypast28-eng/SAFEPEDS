import Link from "next/link";
import { Activity } from "lucide-react";
import { APP_NAME, MEDICAL_DISCLAIMER } from "@/lib/constants";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  Platform: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Bloodwork", href: "/bloodwork" },
    { label: "Knowledge Base", href: "/knowledge-base" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Medical Disclaimer", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <span className="font-bold text-foreground">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-muted leading-relaxed">
              Educational health monitoring for performance athletes. Not medical advice.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-10 pt-6 border-t border-border/50">
          <p className="text-xs text-muted/70 leading-relaxed max-w-3xl">
            {MEDICAL_DISCLAIMER}
          </p>
          <p className="mt-3 text-xs text-muted">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
