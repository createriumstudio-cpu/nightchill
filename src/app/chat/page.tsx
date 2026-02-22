import { Metadata } from "next";
import Header from "@/components/Header";
import ChatUI from "@/components/ChatUI";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "デートコンシェルジュ | futatabito",
  description: "あなたの好みや状況に合わせて、最適なデートプランをご提案。会話しながら理想のデートを一緒に作りましょう。",
};

export default function ChatPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-950 text-white pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">デートコンシェルジュ</h1>
            <p className="text-gray-400 text-sm">
              好みや状況を会話で教えてください。ぴったりのプランをご提案します。
            </p>
          </div>

          <ChatUI />

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-xs mb-2">
              サクッとプランを作りたい方はこちら
            </p>
            <Link
              href="/plan"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              フォームでデートプランを作る →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
