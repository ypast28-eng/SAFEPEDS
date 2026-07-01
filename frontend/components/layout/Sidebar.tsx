"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { APP_NAME, APP_NAV_ITEMS } from "@/lib/constants";
import { getIcon } from "@/components/icons";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

function getUserInitials(email: string | undefined): string {
  if (!email) return "?";
  return email.charAt(0).toUpperCase();
}

interface SidebarProps {
  isOpen: boolean;
  isMobileOpen: boolean;
  onToggle: () => void;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}

export function Sidebar({
  isOpen,
  isMobileOpen,
  onToggle,
  onToggleMobile,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const email = user?.email ?? "";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border/50 px-4 gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-foreground truncate">{APP_NAME}</p>
            <p className="text-xs text-muted truncate">Health Monitor</p>
          </div>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={onToggle}
          className="ml-auto hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {/* Mobile close */}
        <button
          onClick={onCloseMobile}
          className="ml-auto lg:hidden h-7 w-7 flex items-center justify-center rounded-md text-muted hover:text-foreground"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {APP_NAV_ITEMS.map((item) => {
          const Icon = getIcon(item.icon);
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={!isOpen ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted hover:text-foreground hover:bg-surface-elevated",
                !isOpen && "justify-center px-2"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
              {isOpen && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section placeholder */}
      <div className="border-t border-border/50 p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5",
            !isOpen && "justify-center"
          )}
        >
          <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-background">
            {getUserInitials(email)}
          </div>
          {isOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">
                {email || "Account"}
              </p>
              <p className="text-xs text-muted truncate">Signed in</p>
            </div>
          )}
          {isOpen && (
            <button
              type="button"
              onClick={() => signOut()}
              className="text-muted hover:text-accent transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      {/* Mobile toggle button (in app header area) */}
      <button
        onClick={onToggleMobile}
        className="fixed top-4 left-4 z-30 lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-foreground"
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Sidebar — mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-surface transition-transform duration-300 lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar — desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 border-r border-border bg-surface transition-all duration-300",
          isOpen ? "w-60" : "w-16"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
