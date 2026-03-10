"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (status === "loading") {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted/30" />
    );
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn("google")}
        className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-primary hover:text-foreground"
      >
        ログイン
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 rounded-full border border-border px-2 py-1 transition-colors hover:border-primary/50"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {session.user.name?.charAt(0) || "U"}
          </div>
        )}
        <span className="hidden text-sm sm:inline">
          {session.user.name?.split(" ")[0] || "ユーザー"}
        </span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-background shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium truncate">
              {session.user.name}
            </p>
            <p className="text-xs text-muted truncate">
              {session.user.email}
            </p>
          </div>
          <div className="py-1">
            <Link
              href="/mypage"
              className="block px-4 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              マイページ
            </Link>
            <button
              onClick={() => signOut()}
              className="block w-full px-4 py-2 text-left text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              ログアウト
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
