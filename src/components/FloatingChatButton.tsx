"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FloatingChatButton() {
  const pathname = usePathname();
  
  // Don't show on chat page itself
  if (pathname === "/chat") return null;

  return (
    <Link
      href="/chat"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
      aria-label="コンシェルジュに相談する"
    >
      <span className="text-lg">💬</span>
      <span className="text-sm font-semibold hidden sm:inline">相談する</span>
    </Link>
  );
}
