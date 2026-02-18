"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          エラーが発生しました
        </h1>
        <p className="mt-4 text-muted">
          申し訳ありません。問題が発生しました。
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <button
            onClick={reset}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            もう一度試す
          </button>
          <Link
            href="/"
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-surface"
          >
            トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
