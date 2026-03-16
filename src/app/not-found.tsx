import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f1a] px-6 text-[#f0ebe5]">
      <div className="text-center">
        <p className="text-8xl font-bold text-[#c9a96e]">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          お探しのページが見つかりません
        </h1>
        <p className="mt-4 text-[#a3a5b0]">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="rounded-full bg-[#dbc49b] px-6 py-3 text-sm font-semibold text-[#1a1a2e] transition-colors hover:bg-[#c9a96e]"
          >
            ホームに戻る
          </Link>
          <Link
            href="/plan"
            className="rounded-full border border-[#353557] px-6 py-3 text-sm font-semibold text-[#f0ebe5] transition-colors hover:bg-[#1a1a2e]"
          >
            プランを作成する
          </Link>
        </div>
      </div>
    </div>
  );
}
