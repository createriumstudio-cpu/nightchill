import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '運営者情報 | nightchill',
    description: 'nightchillの運営者情報・サービス概要・お問い合わせ先をご案内します。',
    openGraph: {
          title: '運営者情報 | nightchill',
          description: 'nightchillの運営者情報・サービス概要・お問い合わせ先をご案内します。',
    },
};

export default function AboutPage() {
    return (
          <>
                <Header />
                <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 pt-24 pb-16">
                        <div className="max-w-3xl mx-auto px-4">
                                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
                                              運営者情報
                                  </h1>h1>
                        
                                  <section className="mb-12">
                                              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                                                            nightchillについて
                                              </h2>h2>
                                              <div className="text-gray-300 space-y-4 leading-relaxed">
                                                            <p>
                                                                            nightchillは、東京のデートシーンをより豊かにするためのWebメディアです。
                                                                            「どこに行くか（Where）」ではなく「どうデートするか（How）」を提案し、
                                                                            1軒目から2軒目への動線、会話のヒント、事前準備まで含めた
                                                                            「線」としてのデートプランをお届けします。
                                                            </p>p>
                                                            <p>
                                                                            単なるスポット紹介ではなく、実際のデート体験を成功に導くための
                                                                            コンシェルジュサービスとして、厳選されたエリアごとの特集記事と
                                                                            パーソナライズされたプラン生成機能を提供しています。
                                                            </p>p>
                                              </div>div>
                                  </section>section>
                        
                                  <section className="mb-12">
                                              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                                                            運営
                                              </h2>h2>
                                              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                                                            <dl className="space-y-4 text-gray-300">
                                                                            <div>
                                                                                              <dt className="text-sm text-gray-400">サービス名</dt>dt>
                                                                                              <dd className="text-white font-medium">nightchill</dd>dd>
                                                                            </div>div>
                                                                            <div>
                                                                                              <dt className="text-sm text-gray-400">運営</dt>dt>
                                                                                              <dd className="text-white font-medium">createriumstudio</dd>dd>
                                                                            </div>div>
                                                                            <div>
                                                                                              <dt className="text-sm text-gray-400">サービスURL</dt>dt>
                                                                                              <dd>
                                                                                                                  <a
                                                                                                                                          href="https://nightchill-sr5g.vercel.app"
                                                                                                                                          className="text-amber-400 hover:text-amber-300 transition-colors"
                                                                                                                                        >
                                                                                                                                        https://nightchill-sr5g.vercel.app
                                                                                                                    </a>a>
                                                                                                </dd>dd>
                                                                            </div>div>
                                                                            <div>
                                                                                              <dt className="text-sm text-gray-400">お問い合わせ</dt>dt>
                                                                                              <dd>
                                                                                                                  <a
                                                                                                                                          href="mailto:createriumstudio@gmail.com"
                                                                                                                                          className="text-amber-400 hover:text-amber-300 transition-colors"
                                                                                                                                        >
                                                                                                                                        createriumstudio@gmail.com
                                                                                                                    </a>a>
                                                                                                </dd>dd>
                                                                            </div>div>
                                                            </dl>dl>
                                              </div>div>
                                  </section>section>
                        
                                  <section className="mb-12">
                                              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                                                            コンテンツポリシー
                                              </h2>h2>
                                              <div className="text-gray-300 space-y-4 leading-relaxed">
                                                            <p>
                                                                            nightchillでは、以下のポリシーに基づいてコンテンツを制作・運営しています。
                                                            </p>p>
                                                            <ul className="list-disc list-inside space-y-2 ml-2">
                                                                            <li>
                                                                                              店舗情報（店名・住所・営業時間等）はGoogle Places APIの
                                                                                              公式データに基づいており、正確性を最優先しています。
                                                                            </li>li>
                                                                            <li>
                                                                                              広告はコンテンツの文脈に自然に連動する形式（Contextual PR）のみを採用し、
                                                                                              バナー広告や不自然な宣伝は一切掲載しません。
                                                                            </li>li>
                                                                            <li>
                                                                                              ユーザー投稿（UGC）の掲載にあたっては、各プラットフォームの
                                                                                              公式embed APIのみを使用し、投稿者の権利を尊重します。
                                                                            </li>li>
                                                                            <li>
                                                                                              デートプランの提案は、実際の体験に基づく編集部の知見と
                                                                                              データ分析を組み合わせて作成しています。
                                                                            </li>li>
                                                            </ul>ul>
                                              </div>div>
                                  </section>section>
                        
                                  <section>
                                              <h2 className="text-xl font-semibold text-amber-400 mb-4">
                                                            対象エリア
                                              </h2>h2>
                                              <div className="text-gray-300 leading-relaxed">
                                                            <p className="mb-4">
                                                                            現在、以下の東京都内7エリアの特集記事を公開しています。
                                                            </p>p>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                              {[
            { name: '恵比寿', slug: 'ebisu-night-date' },
            { name: '渋谷', slug: 'shibuya-casual-date' },
            { name: '表参道', slug: 'omotesando-sophisticated-date' },
            { name: '六本木', slug: 'roppongi-premium-night' },
            { name: '銀座', slug: 'ginza-luxury-date' },
            { name: '中目黒', slug: 'nakameguro-canal-date' },
            { name: '代官山', slug: 'daikanyama-stylish-date' },
                            ].map((area) => (
                                                <a
                                                                      key={area.slug}
                                                                      href={`/features/${area.slug}`}
                                                                      className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-center text-white hover:border-amber-400/50 hover:bg-gray-800 transition-all"
                                                                    >
                                                  {area.name}
                                                </a>a>
                                              ))}
                                                            </div>div>
                                              </div>div>
                                  </section>section>
                        </div>div>
                </main>main>
                <Footer />
          </>>
        );
}</>
