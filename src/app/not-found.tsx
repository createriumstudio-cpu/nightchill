import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-primary">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          ページが見つかりません
        </h1>
        <p className="mt-4 text-muted">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            トップに戻る
          </Link>
          <Link
            href="/plan"
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-surface"
          >
            プランを作成する
          </Link>
        </div>
      </div>
    </div>
  );
}
