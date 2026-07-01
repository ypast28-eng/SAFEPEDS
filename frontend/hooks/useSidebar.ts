"use client";

import { useState, useCallback } from "react";

/** Toggle sidebar open/closed state — used in app shell */
export function useSidebar(defaultOpen = true) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const toggleMobile = useCallback(() => setIsMobileOpen((prev) => !prev), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  return {
    isOpen,
    isMobileOpen,
    toggle,
    toggleMobile,
    closeMobile,
    setIsOpen,
  };
}
