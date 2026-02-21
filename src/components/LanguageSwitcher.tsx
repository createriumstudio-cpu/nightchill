"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const isEnglish = pathname.startsWith("/en");

  if (isEnglish) {
    // On English page, link to Japanese equivalent
    const jaPath = pathname.replace(/^\/en/, "") || "/";
    return (
      <Link
        href={jaPath}
        className="text-sm text-gray-400 hover:text-orange-400 transition-colors px-2 py-1 rounded border border-gray-700 hover:border-orange-400"
      >
        日本語
      </Link>
    );
  }

  // On Japanese page, link to English equivalent
  const enPath = `/en${pathname === "/" ? "" : pathname}`;
  return (
    <Link
      href={enPath}
      className="text-sm text-gray-400 hover:text-orange-400 transition-colors px-2 py-1 rounded border border-gray-700 hover:border-orange-400"
    >
      English
    </Link>
  );
}
