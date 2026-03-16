"use client";

import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AuthButton from "@/components/AuthButton";
import { useState, useEffect, useCallback, useRef } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Close mobile menu on Escape key + focus trap
  useEffect(() => {
    if (!menuOpen) return;

    // Lock body scroll when menu is open
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
        menuButtonRef.current?.focus();
        return;
      }

      // Focus trap within mobile menu
      if (e.key === "Tab" && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen, closeMenu]);

  return (
    <>
    {/* Skip to content link */}
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium"
    >
      メインコンテンツへスキップ
    </a>
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-primary">futa</span>
          <span>tabito</span>
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
            特集
          </Link>
          <Link
            href="/blog"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            ブログ
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            使い方
          </Link>
          <Link
            href="/plan"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-dark"
          >
            デートを計画する
          </Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <AuthButton />
        </div>

        <button
          ref={menuButtonRef}
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニュー"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
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
        <nav ref={menuRef} id="mobile-nav" className="border-t border-border bg-background px-6 py-4 md:hidden" aria-label="モバイルメニュー">
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
              特集
            </Link>
            <Link
              href="/blog"
              className="text-sm text-muted transition-colors hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              ブログ
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
              className="rounded-full bg-primary px-5 py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-dark"
              onClick={() => setMenuOpen(false)}
            >
              デートを計画する
            </Link>
            <div className="flex items-center justify-between pt-2">
              <AuthButton />
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      )}
    </header>
    </>
  );
}
