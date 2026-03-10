"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

export function PremiumCheckoutButton() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/premium")
        .then((r) => r.json())
        .then((data) => {
          if (data.isPremium) setIsPremium(true);
        })
        .catch(() => {});
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="h-12 rounded-full bg-muted/20 animate-pulse" />
    );
  }

  // 既にプレミアム会員
  if (isPremium) {
    return (
      <div className="text-center">
        <p className="text-sm font-semibold text-primary mb-2">
          プレミアム会員です
        </p>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              const res = await fetch("/api/stripe/portal", { method: "POST" });
              const data = await res.json();
              if (data.url) {
                window.location.href = data.url;
              }
            } catch {
              setError("エラーが発生しました");
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="text-sm text-muted underline hover:text-foreground transition-colors disabled:opacity-50"
        >
          {loading ? "読み込み中..." : "プランを管理"}
        </button>
      </div>
    );
  }

  // 未ログイン → ログイン誘導
  if (!session?.user) {
    return (
      <button
        onClick={() => signIn("google", { callbackUrl: "/premium" })}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Googleでログインして申し込む
      </button>
    );
  }

  // ログイン済み・未課金 → Checkout
  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.redirect) {
        setError(data.error || "現在準備中です");
      } else {
        setError(data.error || "エラーが発生しました");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "処理中..." : "プレミアムに申し込む"}
      </button>
      {error && (
        <p className="text-xs text-red-400 text-center mt-2">{error}</p>
      )}
    </div>
  );
}
