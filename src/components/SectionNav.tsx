"use client";

import { useEffect, useState } from "react";

const sectionIds = [
  { id: "overview", label: "概要" },
  { id: "venues", label: "店舗" },
  { id: "timeline", label: "タイムライン" },
  { id: "advice", label: "アドバイス" },
] as const;

export default function SectionNav() {
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const { id } of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="sticky top-16 z-30 -mx-6 mb-8 overflow-x-auto border-b border-border bg-background/95 px-6 backdrop-blur-sm">
      <div className="flex gap-1">
        {sectionIds.map(({ id, label }) => (
          <a
            key={id}
            href={"#" + id}
            className={
              "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors " +
              (activeSection === id
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground")
            }
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
