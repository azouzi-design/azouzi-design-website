"use client";

import { useEffect, useState } from "react";
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

  return (
    <nav className="fixed right-11 top-11 z-50 flex flex-col items-end">
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`flex items-center gap-1 text-xs leading-4 tracking-[-0.01em] transition-colors duration-300 ${
              isActive ? "text-gray-1000" : "text-gray-500"
            }`}
          >
            {item.label}
            {isActive && (
              <motion.span
                layoutId="nav-stepper"
                className="h-px w-3 bg-gray-1000"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </a>
        );
      })}
    </nav>
  );
}
