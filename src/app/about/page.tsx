import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "futatabito について | 運営者情報",
  description:
    "futatabito（ふたたびと）は、デート視点で東京のカルチャーを再発見するガイドメディアです。運営者情報・コンセプト・お問い合わせ先をご紹介します。",
  openGraph: {
    title: "futatabito について | 運営者情報",
    description:
      "デート視点の東京カルチャーガイド「futatabito」の運営者情報ページ。",
  },
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">
            futatabito について
          </h1>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-amber-400 mb-4">
              コンセプト
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>
                futatabito（ふたたびと）は、「デート視点の東京カルチャーガイド」をコンセプトにした情報メディアです。
              </p>
              <p>
                「どこに行くか」ではなく「どうデートするか」。スポット情報だけでなく、1軒目から2軒目への動線、会話のきっかけ、事前準備まで。ふたりの時間をもっとおもしろくするための「線」の情報をお届けします。
              </p>
              <p>
                名前の由来は、「二人（ふたり）」「旅人（たびびと）」「再び（ふたたび）」の三重の意味を持つ造語です。東京という街を、大切な人と何度でも再発見してほしいという想いを込めています。
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-amber-400 mb-4">
              提供コンテンツ
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>
                東京の主要エリア（恵比寿・渋谷・表参道・六本木・銀座・中目黒・代官山）を中心に、デートに最適なスポット情報と、エリアごとのモデルコースを紹介しています。
              </p>
              <p>
                各特集記事では、Google Places APIから取得した正確な店舗情報（営業時間・評価・住所）を掲載しており、常に信頼性の高いデータを提供しています。
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-amber-400 mb-4">
              運営者情報
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p>
                <span className="text-gray-400">運営:</span>{" "}
                createriumstudio
              </p>
              <p>
                <span className="text-gray-400">所在地:</span> 東京都
              </p>
              <p>
                <span className="text-gray-400">メール:</span>{" "}
                <a
                  href="mailto:createriumstudio@gmail.com"
                  className="text-amber-400 hover:text-amber-300 underline"
                >
                  createriumstudio@gmail.com
                </a>
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-amber-400 mb-4">
              情報の正確性について
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>
                掲載している店舗情報は、Google Places APIから取得したデータに基づいています。営業時間・定休日・価格帯などは変更される可能性がありますので、ご来店前に公式サイト等で最新情報をご確認ください。
              </p>
              <p>
                記事の内容に誤りを発見された場合は、上記メールアドレスまでお知らせください。速やかに確認・修正いたします。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-amber-400 mb-4">
              広告・PR表記について
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>
                当サイトでは、記事の文脈に沿った形でのPR情報を掲載する場合があります。その際は必ず「PR」と明記し、読者の皆さまに誤解を与えないよう配慮しています。
              </p>
              <p>
                バナー広告やポップアップ広告は一切掲載しておりません。コンテンツの読みやすさと信頼性を最優先にしています。
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
