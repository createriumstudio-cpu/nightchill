import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'プライバシーポリシー | nightchill',
    description: 'nightchillのプライバシーポリシー。個人情報の取り扱い方針について説明します。',
    openGraph: {
          title: 'プライバシーポリシー | nightchill',
          description: 'nightchillのプライバシーポリシー。個人情報の取り扱い方針について説明します。',
    },
};

export default function PrivacyPage() {
    return (
          <>
                <Header />
                <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 pt-24 pb-16">
                        <div className="max-w-3xl mx-auto px-4">
                                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                              プライバシーポリシー
                                  </h1>h1>
                                  <p className="text-gray-400 text-sm mb-8">最終更新日: 2026年2月21日</p>p>
                        
                                  <div className="text-gray-300 space-y-8 leading-relaxed">
                                              <section>
                                                            <h2 className="text-xl font-semibold text-amber-400 mb-3">
                                                                            1. はじめに
                                                            </h2>h2>
                                                            <p>
                                                                            nightchill（以下「当サービス」）は、ユーザーのプライバシーを尊重し、
                                                                            個人情報の保護に努めます。本プライバシーポリシーでは、当サービスにおける
                                                                            個人情報の取り扱いについて説明します。
                                                            </p>p>
                                              </section>section>
                                  
                                              <section>
                                                            <h2 className="text-xl font-semibold text-amber-400 mb-3">
                                                                            2. 収集する情報
                                                            </h2>h2>
                                                            <p className="mb-3">
                                                                            当サービスでは、以下の情報を収集する場合があります。
                                                            </p>p>
                                                            <ul className="list-disc list-inside space-y-2 ml-2">
                                                                            <li>
                                                                                              デートプラン生成時に入力されるエリア・シチュエーション・
                                                                                              予算等の選択情報（個人を特定する情報は含みません）
                                                                            </li>li>
                                                                            <li>
                                                                                              アクセスログ（IPアドレス、ブラウザ情報、アクセス日時等）
                                                                            </li>li>
                                                                            <li>
                                                                                              Cookie および類似の技術による閲覧情報
                                                                            </li>li>
                                                            </ul>ul>
                                              </section>section>
                                  
                                              <section>
                                                            <h2 className="text-xl font-semibold text-amber-400 mb-3">
                                                                            3. 情報の利用目的
                                                            </h2>h2>
                                                            <p className="mb-3">
                                                                            収集した情報は、以下の目的で利用します。
                                                            </p>p>
                                                            <ul className="list-disc list-inside space-y-2 ml-2">
                                                                            <li>デートプランの生成・表示</li>li>
                                                                            <li>サービスの改善・新機能の開発</li>li>
                                                                            <li>アクセス状況の分析・統計情報の作成</li>li>
                                                                            <li>サービスの安全性確保・不正利用の防止</li>li>
                                                            </ul>ul>
                                              </section>section>
                                  
                                              <section>
                                                            <h2 className="text-xl font-semibold text-amber-400 mb-3">
                                                                            4. 第三者サービスの利用
                                                            </h2>h2>
                                                            <p className="mb-3">
                                                                            当サービスでは、以下の第三者サービスを利用しています。
                                                                            各サービスのプライバシーポリシーについては、それぞれのリンク先をご確認ください。
                                                            </p>p>
                                                            <ul className="list-disc list-inside space-y-2 ml-2">
                                                                            <li>
                                                                                              <strong>Google Maps Platform</strong>strong>（地図表示・スポット情報）
                                                                                              — Google のプライバシーポリシーに準拠
                                                                            </li>li>
                                                                            <li>
                                                                                              <strong>Vercel Analytics</strong>strong>（アクセス解析）
                                                                                              — 匿名化されたアクセスデータを収集
                                                                            </li>li>
                                                            </ul>ul>
                                              </section>section>
                                  
                                              <section>
                                                            <h2 className="text-xl font-semibold text-amber-400 mb-3">
                                                                            5. 情報の保護
                                                            </h2>h2>
                                                            <p>
                                                                            当サービスは、収集した情報の漏洩・滅失・毀損を防ぐため、
                                                                            適切なセキュリティ対策を実施します。通信はSSL/TLSにより
                                                                            暗号化されています。
                                                            </p>p>
                                              </section>section>
                                  
                                              <section>
                                                            <h2 className="text-xl font-semibold text-amber-400 mb-3">
                                                                            6. 情報の第三者提供
                                                            </h2>h2>
                                                            <p>
                                                                            当サービスは、法令に基づく場合を除き、ユーザーの同意なく
                                                                            個人情報を第三者に提供することはありません。
                                                            </p>p>
                                              </section>section>
                                  
                                              <section>
                                                            <h2 className="text-xl font-semibold text-amber-400 mb-3">
                                                                            7. Cookie の使用
                                                            </h2>h2>
                                                            <p>
                                                                            当サービスでは、ユーザー体験の向上およびアクセス分析のために
                                                                            Cookie を使用する場合があります。ブラウザの設定により
                                                                            Cookie の受け入れを拒否することができますが、一部の機能が
                                                                            利用できなくなる場合があります。
                                                            </p>p>
                                              </section>section>
                                  
                                              <section>
                                                            <h2 className="text-xl font-semibold text-amber-400 mb-3">
                                                                            8. ポリシーの変更
                                                            </h2>h2>
                                                            <p>
                                                                            本プライバシーポリシーは、必要に応じて変更されることがあります。
                                                                            重要な変更がある場合は、当サービス上でお知らせします。
                                                            </p>p>
                                              </section>section>
                                  
                                              <section>
                                                            <h2 className="text-xl font-semibold text-amber-400 mb-3">
                                                                            9. お問い合わせ
                                                            </h2>h2>
                                                            <p>
                                                                            プライバシーに関するお問い合わせは、以下までご連絡ください。
                                                            </p>p>
                                                            <div className="mt-3 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                                                            <p className="text-white font-medium">nightchill 運営事務局</p>p>
                                                                            <a
                                                                                                href="mailto:createriumstudio@gmail.com"
                                                                                                className="text-amber-400 hover:text-amber-300 transition-colors"
                                                                                              >
                                                                                              createriumstudio@gmail.com
                                                                            </a>a>
                                                            </div>div>
                                              </section>section>
                                  </div>div>
                        </div>div>
                </main>main>
                <Footer />
          </>>
        );
}</>
