"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "services", label: "Services" },
  { id: "contact", label: "Contact" },
] as const;

export type SectionId = (typeof NAV_ITEMS)[number]["id"];

export function GlobalNav() {
  const [active, setActive] = useState<SectionId>("about");
  const [indicator, setIndicator] = useState<{ top: number; right: number } | null>(
    null
  );
  const navRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Partial<Record<SectionId, HTMLAnchorElement | null>>>(
    {}
  );

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) =>
      document.getElementById(item.id)
    ).filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) setActive(mostVisible.target.id as SectionId);
      },
      { threshold: [0.5, 0.75, 1] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const navEl = navRef.current;
    const activeEl = itemRefs.current[active];
    if (!navEl || !activeEl) return;

    const updatePosition = () => {
      const navRect = navEl.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();
      setIndicator({
        top: itemRect.top - navRect.top + itemRect.height / 2,
        right: navRect.right - itemRect.left + 4,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [active]);

  return (
    <nav
      ref={navRef}
      className="fixed right-9 top-9 z-50 flex flex-col items-end"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <a
            key={item.id}
            ref={(el) => {
              itemRefs.current[item.id] = el;
            }}
            href={`#${item.id}`}
            className={`text-xs leading-4 tracking-[-0.01em] transition-colors duration-300 ${
              isActive ? "text-gray-1000" : "text-gray-500"
            }`}
          >
            {item.label}
          </a>
        );
      })}
      {indicator !== null && (
        <motion.span
          className="pointer-events-none absolute h-px w-3 -translate-y-1/2 bg-gray-1000"
          initial={false}
          animate={indicator}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
    </nav>
  );
}
