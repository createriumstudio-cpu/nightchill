"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Define which Japanese routes have English equivalents
const enRouteMap: Record<string, string> = {
  "/": "/en",
  "/features": "/en",  // No /en/features list page, fallback to /en
  "/chat": "/en",
  "/about": "/en",
  "/privacy": "/en",
  "/plan": "/en",
  "/results": "/en",
};

function getEnglishPath(pathname: string): string {
  // Feature detail pages have English equivalents
  if (pathname.startsWith("/features/")) {
    return `/en${pathname}`;
  }
  // Check static route map
  if (pathname in enRouteMap) {
    return enRouteMap[pathname];
  }
  // Default fallback to /en
  return "/en";
}

function getJapanesePath(pathname: string): string {
  // Remove /en prefix
  const jaPath = pathname.replace(/^\/en/, "") || "/";
  // /en/features/[slug] -> /features/[slug]
  return jaPath;
}

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const isEnglish = pathname.startsWith("/en");

  if (isEnglish) {
    const jaPath = getJapanesePath(pathname);
    return (
      <Link
        href={jaPath}
        className="text-sm text-gray-400 hover:text-orange-400 transition-colors px-2 py-1 rounded border border-gray-700 hover:border-orange-400"
      >
        日本語
      </Link>
    );
  }

  const enPath = getEnglishPath(pathname);
  return (
    <Link
      href={enPath}
      className="text-sm text-gray-400 hover:text-orange-400 transition-colors px-2 py-1 rounded border border-gray-700 hover:border-orange-400"
    >
      English
    </Link>
  );
}
