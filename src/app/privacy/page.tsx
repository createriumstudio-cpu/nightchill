import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "プライバシーポリシー | futatabito",
  description:
    "futatabito（ふたたびと）のプライバシーポリシーです。個人情報の取り扱い、Cookie、アクセス解析について説明しています。",
  openGraph: {
    title: "プライバシーポリシー | futatabito",
    description: "futatabitoのプライバシーポリシー。",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            プライバシーポリシー
          </h1>
          <p className="text-gray-400 mb-10 text-sm">
            最終更新日: 2026年2月21日
          </p>

          <div className="text-gray-300 space-y-10 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                1. はじめに
              </h2>
              <p>
                futatabito（以下「当サイト」）は、ユーザーの皆さまのプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーでは、当サイトにおける情報の取り扱いについてご説明します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                2. 収集する情報
              </h2>
              <div className="space-y-3">
                <p>当サイトでは、以下の情報を取得する場合があります。</p>
                <p>
                  <span className="text-white font-medium">アクセスログ情報:</span>{" "}
                  IPアドレス、ブラウザの種類、参照元URL、アクセス日時などの情報が、サーバーログとして自動的に記録されます。
                </p>
                <p>
                  <span className="text-white font-medium">デートプラン生成時の入力情報:</span>{" "}
                  プラン生成機能をご利用いただく際に入力されるエリア・シチュエーション・予算などの情報。これらはブラウザのsessionStorageに一時保存され、タブを閉じると自動的に削除されます。サーバーには保存されません。
                </p>
                <p>
                  <span className="text-white font-medium">お問い合わせ情報:</span>{" "}
                  メールでお問い合わせいただいた際のメールアドレス・お名前・お問い合わせ内容。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                3. 情報の利用目的
              </h2>
              <div className="space-y-3">
                <p>収集した情報は、以下の目的で利用します。</p>
                <p>サイトの運営・改善・コンテンツの充実のため。お問い合わせへの対応のため。アクセス状況の分析・統計のため。不正アクセスの防止・セキュリティの維持のため。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                4. Cookie（クッキー）について
              </h2>
              <div className="space-y-3">
                <p>
                  当サイトでは、サイトの利便性向上やアクセス分析のためにCookieを使用する場合があります。
                </p>
                <p>
                  Cookieはブラウザの設定により無効にすることができます。ただし、一部の機能が正しく動作しなくなる場合があります。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                5. 第三者サービスについて
              </h2>
              <div className="space-y-3">
                <p>当サイトでは、以下の第三者サービスを利用しています。</p>
                <p>
                  <span className="text-white font-medium">Google Maps Platform:</span>{" "}
                  店舗情報の表示・地図表示のために、Google Maps PlatformのAPIを利用しています。Googleのプライバシーポリシーは{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 underline"
                  >
                    こちら
                  </a>
                  をご参照ください。
                </p>
                <p>
                  <span className="text-white font-medium">Vercel:</span>{" "}
                  当サイトのホスティングにVercelを利用しています。Vercelのプライバシーポリシーは{" "}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 underline"
                  >
                    こちら
                  </a>
                  をご参照ください。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                6. 情報の第三者提供
              </h2>
              <p>
                当サイトでは、法令に基づく場合を除き、ユーザーの個人情報を本人の同意なく第三者に提供することはありません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                7. 免責事項
              </h2>
              <div className="space-y-3">
                <p>
                  当サイトに掲載されている店舗情報は、Google Places APIから取得したデータに基づいています。営業時間・定休日・メニュー・価格等は予告なく変更される場合がありますので、ご利用前に各店舗の公式情報をご確認ください。
                </p>
                <p>
                  当サイトの利用により生じた損害について、当サイトは一切の責任を負いかねます。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                8. ポリシーの変更
              </h2>
              <p>
                本プライバシーポリシーは、必要に応じて内容を見直し、変更することがあります。変更があった場合は、当ページにて更新日とともに公表します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                9. お問い合わせ
              </h2>
              <p>
                本ポリシーに関するお問い合わせは、以下までご連絡ください。
              </p>
              <p className="mt-3">
                <a
                  href="mailto:createriumstudio@gmail.com"
                  className="text-amber-400 hover:text-amber-300 underline"
                >
                  createriumstudio@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
