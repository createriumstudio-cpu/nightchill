"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-primary">night</span>
          <span>chill</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/#features"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            特徴
          </Link>
          <Link
            href="/features"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            🔥 特集
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            使い方
          </Link>
          <Link
            href="/plan"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            デートを計画する
          </Link>
        </nav>

        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニュー"
        >
          <span
            className={`block h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-foreground transition-opacity ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-border bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link
              href="/#features"
              className="text-sm text-muted transition-colors hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              特徴
            </Link>
            <Link
              href="/features"
              className="text-sm text-muted transition-colors hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              🔥 特集
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm text-muted transition-colors hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              使い方
            </Link>
            <Link
              href="/plan"
              className="rounded-full bg-primary px-5 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-primary-dark"
              onClick={() => setMenuOpen(false)}
            >
              デートを計画する
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
