/** Shared application types — Phase 1 placeholders */

import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  description?: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: string;
}

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "info";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

export type ButtonSize = "sm" | "md" | "lg";
