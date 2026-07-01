import {
  LayoutDashboard,
  FlaskConical,
  Droplets,
  BookOpen,
  Settings,
  ShieldAlert,
  Brain,
  Lock,
  type LucideIcon,
} from "lucide-react";

/** Map icon name strings to Lucide components */
export const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FlaskConical,
  Droplets,
  BookOpen,
  Settings,
  ShieldAlert,
  Brain,
  Lock,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? LayoutDashboard;
}
