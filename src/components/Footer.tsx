import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
          <div>
            <Link href="/" className="text-xl font-bold text-white">
              futa<span className="text-primary">tabito</span>
            </Link>
            <p className="text-sm text-muted mt-2">
              デート視点の東京カルチャーガイド
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            <Link
              href="/features"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              特集一覧
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
            <Link
              href="/about"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              運営者情報
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              プライバシーポリシー
            </Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted">
          &copy; {new Date().getFullYear()} futatabito. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
