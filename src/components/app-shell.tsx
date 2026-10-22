"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { markAppHydrated, markNavigation } from "@/components/soft-blur-in";
import { playPress } from "@/lib/sounds";

/**
 * Shared by every route: the click sounds, and the hooks the blur-in
 * animations use to tell a page load from a client-side navigation. Pages lay
 * themselves out; there's no frame around them.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(markAppHydrated, []);

  // "Click" for any click, "Tap" when it came from a touch.
  useEffect(() => {
    let pointerType = "mouse";
    const remember = (event: PointerEvent) => {
      pointerType = event.pointerType;
    };
    const press = () => {
      playPress(pointerType === "touch" ? "tap" : "click");
      pointerType = "mouse"; // a keyboard click has no pointer of its own
    };
    document.addEventListener("pointerdown", remember, true);
    document.addEventListener("click", press, true);
    return () => {
      document.removeEventListener("pointerdown", remember, true);
      document.removeEventListener("click", press, true);
    };
  }, []);

  // Every route change after the first render is a client-side navigation.
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (pathname !== previousPath.current) markNavigation();
    previousPath.current = pathname;
  }, [pathname]);

  return children;
}
