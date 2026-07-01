import type { FAQItem, Feature, NavItem, PricingTier } from "@/types";

/** Application metadata */
export const APP_NAME = "PED Health AI";
export const APP_TAGLINE = "Educational Health Monitoring for Performance Athletes";
export const APP_DESCRIPTION =
  "Track bloodwork, understand compound risks, and receive AI-powered educational insights. Not medical advice — educational guidance only.";

/** Main navigation for authenticated app shell */
export const APP_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    description: "Overview of your health metrics",
  },
  {
    label: "Cycle Builder",
    href: "/cycle-builder",
    icon: "FlaskConical",
    description: "Plan and track compound cycles",
  },
  {
    label: "Bloodwork",
    href: "/bloodwork",
    icon: "Droplets",
    description: "Log and visualize lab results",
  },
  {
    label: "Knowledge Base",
    href: "/knowledge-base",
    icon: "BookOpen",
    description: "Educational resources and guides",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "Settings",
    description: "Account and preferences",
  },
];

/** Marketing navigation links */
export const MARKETING_NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

/** Landing page features */
export const LANDING_FEATURES: Feature[] = [
  {
    title: "Bloodwork Tracking",
    description:
      "Log lab results over time and visualize trends with interactive charts. Spot patterns before they become problems.",
    icon: "Droplets",
  },
  {
    title: "Risk Assessment",
    description:
      "Structured educational risk profiles based on compounds, dosages, and health markers — not diagnoses.",
    icon: "ShieldAlert",
  },
  {
    title: "Cycle Builder",
    description:
      "Plan compound cycles with built-in safety checkpoints and educational context for each compound.",
    icon: "FlaskConical",
  },
  {
    title: "AI Explanations",
    description:
      "Get plain-language educational breakdowns of your markers and risk factors powered by AI.",
    icon: "Brain",
  },
  {
    title: "Knowledge Base",
    description:
      "Curated educational content on compounds, health markers, and harm-reduction principles.",
    icon: "BookOpen",
  },
  {
    title: "Privacy First",
    description:
      "Your health data is encrypted and never shared. You control what you log and what you delete.",
    icon: "Lock",
  },
];

/** Pricing tiers — placeholder */
export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "Essential tracking for getting started",
    features: [
      "Bloodwork logging (up to 5 entries)",
      "Basic trend charts",
      "Knowledge base access",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "Full platform for serious athletes",
    features: [
      "Unlimited bloodwork entries",
      "Advanced analytics & charts",
      "Cycle builder with risk profiles",
      "AI educational explanations",
      "Export reports (PDF)",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Elite",
    price: "$49",
    period: "/month",
    description: "Maximum insight and customization",
    features: [
      "Everything in Pro",
      "Custom marker thresholds",
      "Multi-cycle comparison",
      "API access",
      "Dedicated onboarding",
      "Early access to new features",
    ],
  },
];

/** FAQ items — placeholder */
export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Is PED Health AI a medical service?",
    answer:
      "No. PED Health AI is an educational and health-monitoring platform. It does not diagnose diseases, prescribe treatments, or replace professional medical advice. Always consult a qualified healthcare provider for medical decisions.",
  },
  {
    question: "What kind of data can I track?",
    answer:
      "You can log bloodwork results (lipids, liver enzymes, hormones, etc.), compound cycles, dosages, and notes. All data is stored securely and visible only to you.",
  },
  {
    question: "How does the AI feature work?",
    answer:
      "Our AI generates educational explanations based on structured risk assessments and your logged data. It explains what markers mean in plain language — it does not provide medical diagnoses or treatment recommendations.",
  },
  {
    question: "Is my health data secure?",
    answer:
      "Yes. We use industry-standard encryption, secure authentication via Supabase, and never sell or share your personal health data with third parties.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Absolutely. You can cancel your subscription at any time from Settings. Your data remains accessible until the end of your billing period.",
  },
];

/** Medical disclaimer shown across the app */
export const MEDICAL_DISCLAIMER =
  "PED Health AI is for educational purposes only. It is not intended to diagnose, treat, cure, or prevent any disease. Always seek the advice of a qualified healthcare provider.";
