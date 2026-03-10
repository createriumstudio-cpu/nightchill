"use client";

import Link from "next/link";
import { CITIES } from "@/lib/cities";

export default function Footer() {
  return (
    <footer className="bg-primary-dark border-t border-border">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="text-xl font-bold">
              <span className="text-accent">futa</span><span className="text-white">tabito</span>
            </Link>
            <p className="mt-2 text-sm text-white/70">
              全国10都市対応のデートプランAI
            </p>
            <p className="mt-1 text-xs text-white/40">
              ふたりの時間を、もっと特別に。
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-3">コンテンツ</h3>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-sm text-white/50 hover:text-accent transition-colors">デート特集</Link></li>
              <li><Link href="/blog" className="text-sm text-white/50 hover:text-accent transition-colors">ブログ</Link></li>
              <li><Link href="/plan" className="text-sm text-white/50 hover:text-accent transition-colors">プラン作成</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-3">サイト情報</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-white/50 hover:text-accent transition-colors">futatabitoについて</Link></li>
              <li><Link href="/privacy" className="text-sm text-white/50 hover:text-accent transition-colors">プライバシーポリシー</Link></li>
              <li><Link href="/en" className="text-sm text-white/50 hover:text-accent transition-colors">English</Link></li>
            </ul>
          </div>

        </div>

        {/* City Links */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <h3 className="text-sm font-semibold text-white/80 mb-3 text-center">対応都市</h3>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {CITIES.map((city) => (
              <Link key={city.id} href={`/${city.id}`} className="text-xs text-white/50 hover:text-accent transition-colors">
                {city.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} futatabito. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
