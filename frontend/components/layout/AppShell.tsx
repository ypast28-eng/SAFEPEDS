"use client";

import { useSidebar } from "@/hooks";
import { Sidebar } from "./Sidebar";
import { SetupWarningBanner } from "@/components/shared/SetupWarningBanner";
import { cn } from "@/utils/cn";

interface AppShellProps {
  children: React.ReactNode;
}

/** Authenticated app layout with responsive sidebar */
export function AppShell({ children }: AppShellProps) {
  const { isOpen, isMobileOpen, toggle, toggleMobile, closeMobile } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isOpen={isOpen}
        isMobileOpen={isMobileOpen}
        onToggle={toggle}
        onToggleMobile={toggleMobile}
        onCloseMobile={closeMobile}
      />

      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          "lg:pl-16",
          isOpen && "lg:pl-60"
        )}
      >
        <div className="h-16 lg:h-0" />
        <div className="p-4 sm:p-6 lg:p-8">
          <SetupWarningBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
