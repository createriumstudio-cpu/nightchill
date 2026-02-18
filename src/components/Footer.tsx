import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-primary">night</span>
              <span>chill</span>
            </Link>
            <p className="mt-2 text-sm text-muted">
              成功確約型デートコンシェルジュ
            </p>
          </div>

          <nav className="flex gap-8">
            <Link
              href="/#features"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              特徴
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              使い方
            </Link>
            <Link
              href="/plan"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              デートを計画する
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted">
          &copy; {new Date().getFullYear()} nightchill. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
