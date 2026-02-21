# futatabito 引き継ぎドキュメント(HANDOFF.md)

最終更新: 2026-02-21

## ブランドリネーム履歴

旧名称「nightchill（成功確約型デートコンシェルジュ）」から「futatabito（デート視点の東京カルチャーガイド）」へリネーム（2026-02-21）。

- 旧名: nightchill
- - 新名: futatabito（ふたたびと）
  - - 名前の由来: 「二人（ふたり）」+「旅人（たびびと）」+「再び（ふたたび）」の三重の意味を持つ造語
    - - 旧コンセプト: 成功確約型デートコンシェルジュ（夜限定の印象、硬い表現）
      - - 新コンセプト: デート視点の東京カルチャーガイド（食・カフェ・街歩き・イベント・全時間帯）
        - - 旧キャッチコピー: 成功確約型デートコンシェルジュ
          - - 新キャッチコピー: ふたりの時間を、もっとおもしろく。
            - - 理由: 実際のコンテンツ（表参道の並木道散歩、中目黒のカフェ、代官山の街歩き等）がナイト限定ではなく、デートという視点でライフスタイル全般をカバーしているため
              - - インバウンド展望: 英語圏での "Tokyo date guide" 需要に対応可能（i18n対応予定）
               
                - ### リネーム時のコード変更対象（未実施・PR経由で実行）
               
                - 注意: GitHub Web UIでの日本語TSXコード編集はCodeMirrorが閉じタグを破損する（地雷2）。Codespaces/ローカル環境で実行すること。
               
                - 変更が必要なファイル:
                - - src/app/layout.tsx（metadata: title, description, OGP）
                  - - src/app/page.tsx（ホームページのブランド名・キャッチコピー表示）
                    - - src/components/Header.tsx（ロゴテキスト）
                      - - src/components/Footer.tsx（コピーライト表示）
                        - - src/app/plan/page.tsx（プランページのタイトル等）
                          - - src/app/results/page.tsx（結果ページのブランド表示）
                            - - src/app/admin/login/page.tsx（管理画面ログインタイトル）
                              - - src/app/admin/page.tsx（管理画面ダッシュボードタイトル）
                                - - src/lib/ai-planner.ts（SYSTEM_PROMPTのブランド名）
                                  - - package.json（name フィールド）
                                    - - README.md（プロジェクト名・説明）
                                      - - テストファイル（ブランド名を参照しているアサーション）
                                       
                                        - ## プロジェクト概要
                                       
                                        - **futatabito** - デート視点の東京カルチャーガイド
                                       
                                        - - コンセプト: 「Where」ではなく「How」を提供。「点（スポット情報）」ではなく「線（1軒目から2軒目の動線、会話、事前準備）」。デートという切り口で食・カフェ・街歩き・イベントを全時間帯カバー
                                          - - ターゲット: 都内20-30代デート層 + インバウンド外国人カップル
                                            - - キャッチコピー: ふたりの時間を、もっとおもしろく。
                                              - - マネタイズ: Contextual PR（文脈連動型）のみ。嘘の営業時間や不自然なバナー広告は厳禁
                                               
                                                - ## 技術スタック
                                               
                                                - - フレームワーク: Next.js 16 + TypeScript strict + Tailwind CSS v4
                                                  - - テスト: Jest + React Testing Library
                                                    - - ホスティング: Vercel (nightchill-sr5g がプロダクション)
                                                      - - リポジトリ: https://github.com/createriumstudio-cpu/nightchill
                                                        - - 本番URL: https://nightchill-sr5g.vercel.app
                                                         
                                                          - 注意: GitHubリポジトリ名とVercelプロジェクト名は「nightchill」のまま。変更するとURL・CI・デプロイが壊れるため、コード内のブランド表示のみ変更する。
                                                         
                                                          - ## Vercel環境変数(nightchill-sr5g)
                                                         
                                                          - | 変数名 | 用途 |
                                                          - |--------|------|
                                                          - | ANTHROPIC_API_KEY | AIプラン生成 |
                                                          - | GOOGLE_PLACES_API_KEY | Google Places API |
                                                          - | GOOGLE_MAPS_API_KEY | Google Maps API |
                                                          - | ADMIN_PASSWORD | 管理画面ログイン（値: taas1111) |
                                                         
                                                          - ## 本番ページ構成
                                                         
                                                          - | URL | 説明 | 状態 |
                                                          - |-----|------|------|
                                                          - | / | ホームページ | 稼働中 |
                                                          - | /features | 特集一覧（ヒーロー画像付きカード） | 稼働中（7記事） |
                                                          - | /features/ebisu-night-date | 恵比寿ナイトデート詳細 | 稼働中 |
                                                          - | /features/shibuya-casual-date | 渋谷カジュアルデート詳細 | 稼働中 |
                                                          - | /features/omotesando-sophisticated-date | 表参道デート詳細 | 稼働中 |
                                                          - | /features/roppongi-premium-night | 六本木プレミアムナイト詳細 | 稼働中 |
                                                          - | /features/ginza-luxury-date | 銀座ラグジュアリーデート詳細 | 稼働中 |
                                                          - | /features/nakameguro-canal-date | 中目黒キャナルデート詳細 | 稼働中 |
                                                          - | /features/daikanyama-stylish-date | 代官山スタイリッシュデート詳細 | 稼働中 |
                                                          - | /plan から /results | AIデートプラン生成 | 稼働中 |
                                                          - | /admin/login | 管理画面ログイン | 稼働中 |
                                                          - | /admin | 管理画面ダッシュボード | 稼働中（読み取り専用） |
                                                         
                                                          - Vercelのサーバーレス環境はファイルシステムが読み取り専用のため、CRUD書き込み操作は動作しません。将来的にVercel Postgres への移行が必要です。
                                                         
                                                          - ## 画像について
                                                         
                                                          - ### 現在の画像（2026-02-21時点・全7枚統一済み）
                                                         
                                                          - ヒーロー画像は Gemini で生成（フォトリアル）。すべて public/images/ に格納。
                                                         
                                                          - | ファイル名 | サイズ | 説明 |
                                                          - |-----------|--------|------|
                                                          - | ebisu-night-date-hero.png | 1370x896 | 恵比寿イタリアン路地 |
                                                          - | shibuya-casual-date-hero.png | 1370x896 | 渋谷カフェカップル |
                                                          - | omotesando-date-hero.png | 1370x896 | 表参道並木道カップル |
                                                          - | roppongi-night-date-hero.png | 1370x896 | 六本木ルーフトップバー+東京タワー |
                                                          - | ginza-luxury-date-hero.png | 1370x896 | 銀座並木通りラグジュアリーカップル |
                                                          - | nakameguro-canal-date-hero.png | 1370x896 | 中目黒キャナル沿いカフェカップル |
                                                          - | daikanyama-stylish-date-hero.png | 1370x896 | 代官山スタイリッシュカップル |
                                                         
                                                          - ### 画像修正履歴
                                                         
                                                          - 初期: Geminiで生成した画像をGitHubにアップロード。恵比寿・渋谷・表参道・六本木は正常にダウンロード画像が反映されたが、銀座・中目黒・代官山はGemini UIの黒枠付きスクリーンショットになってしまった。
                                                          - 修正1回目: 銀座・中目黒・代官山をGeminiから再ダウンロードし、フルビューポートのクリーンな画像に差し替え（1370x896）。
                                                          - 修正2回目: 恵比寿・渋谷・表参道・六本木の画像も統一されたクリーン画像に差し替え。全7枚が統一された。
                                                         
                                                          - 重要: 今後画像を追加する場合は、Geminiから画像を「ダウンロード」して純粋な画像ファイルとしてアップロードすること。スクリーンショットはライトボックスUIや黒枠が混入するリスクがある。Google CDN URLは非公開URLのため、必ずGitHubリポジトリにアップロードする。
                                                         
                                                          - ### 画像生成時のプロンプトのコツ
                                                         
                                                          - - 英語で記述（日本語だとイラスト調になる）
                                                            - - カメラ設定明記: "Shot on Sony A7IV, 35mm f/1.4 lens"
                                                              - - 路地の左右は異なる店舗を明示的に指定
                                                                - - 日本人モデルは "clearly Japanese" と明記
                                                                  - - "NO text, NO watermarks, NO logos" を必ず含める
                                                                   
                                                                    - ## UGC（User Generated Content）運用ガイドライン
                                                                   
                                                                    - ### 概要
                                                                   
                                                                    - UGC embedとは、Instagram・TikTok等のSNS投稿を特集記事ページに埋め込み表示する機能。ユーザーのリアルな体験をサイトに反映することで、E-E-A-Tの「Experience」を強化し、コンテンツの信頼性を向上させる。
                                                                   
                                                                    - 運用方式: ハイブリッド方式（AI収集 + 人間最終判断）
                                                                   
                                                                    - ### フェーズ1: 手動運用（初期）
                                                                   
                                                                    - DB移行前は、embed codeを手動でコピペする運用。
                                                                    - 1. 運営者がInstagram/TikTokで関連投稿を検索
                                                                      2. 2. embed codeをコピー
                                                                         3. 3. 特集記事のソースコードに直接追記（PR経由）
                                                                            4. 4. レビュー、マージ、デプロイ
                                                                              
                                                                               5. ### フェーズ2: 管理画面から運用（DB移行後）
                                                                              
                                                                               6. 管理画面にUGCキュレーション機能を追加。
                                                                              
                                                                               7. 収集フロー:
                                                                               8. - AIがハッシュタグ検索で候補を自動収集
                                                                                  - - エンゲージメント指標でスコアリング
                                                                                    - - 画像品質フィルタリング
                                                                                      - - デートプランのエリア・カテゴリとの自動マッチング
                                                                                       
                                                                                        - 承認フロー（人間が最終判断）:
                                                                                        - - 管理画面に候補一覧がスコア順で表示される
                                                                                          - - 運営者が各投稿を確認し、承認/却下をワンクリックで判断
                                                                                            - - 承認された投稿のみがサイトに反映
                                                                                             
                                                                                              - 人間が判断すべきポイント:
                                                                                              - - ブランドトーン適合性（futatabitoの「デート視点の東京カルチャーガイド」コンセプトに合うか）
                                                                                                - - 著作権・肖像権リスク
                                                                                                  - - コンテンツ信頼性（ステマ・広告投稿の見極め）
                                                                                                    - - E-E-A-T「Experience」の品質（本物の体験投稿かどうか）
                                                                                                     
                                                                                                      - ### プラットフォーム別embed制約
                                                                                                     
                                                                                                      - | プラットフォーム | API | 審査 | 備考 |
                                                                                                      - |---------------|-----|------|------|
                                                                                                      - | Instagram | oEmbed API | Meta App Review必要 | Business/Creator アカウントのみ |
                                                                                                      - | TikTok | oEmbed API | 比較的容易 | 公開投稿のみ |
                                                                                                      - | X (Twitter) | Publish API | 不要 | 最も導入しやすい |
                                                                                                     
                                                                                                      - 厳守事項:
                                                                                                      - - 公式プラットフォームembed APIのみ使用（法的要件）
                                                                                                        - - スクレイピングや非公式APIは厳禁
                                                                                                          - - 投稿者の意図に反する使用は禁止
                                                                                                            - - embed表示時に投稿者名・プロフィールリンクを必ず表示
                                                                                                             
                                                                                                              - ## データベース設計方針（Vercel Postgres移行時）
                                                                                                             
                                                                                                              - ### 移行の必要性
                                                                                                             
                                                                                                              - 現状の管理画面はファイルシステム(JSON)ベースで、Vercelサーバーレス環境では読み取り専用。記事管理・UGCキュレーション・分析を実現するにはDBが必須。
                                                                                                             
                                                                                                              - 推奨: Vercel Postgres (Neon) Hobby Planで無料枠あり。
                                                                                                             
                                                                                                              - ### テーブル設計（案）
                                                                                                             
                                                                                                              - features（特集記事）、spots（Google Places APIデータ連携）、ugc_posts（UGC投稿管理）、ugc_collection_rules（AI自動収集設定）、admin_audit_log（監査ログ）の5テーブル構成。詳細なCREATE TABLE文は前バージョンのHANDOFF.mdを参照。
                                                                                                             
                                                                                                              - ### 管理画面に必要な機能（DB移行後）
                                                                                                             
                                                                                                              - - 記事管理: 作成・編集・公開/下書き切替・プレビュー
                                                                                                                - - UGCキュレーション: 候補一覧・承認/却下・収集ルール設定
                                                                                                                  - - 分析ダッシュボード: PV・プラン生成数・UGCクリック率
                                                                                                                    - - 監査ログ: 全管理操作の記録
                                                                                                                     
                                                                                                                      - ### 実装に必要な作業（15-20ファイル変更）
                                                                                                                     
                                                                                                                      - DB移行はGitHub Web UIでは困難。GitHub Codespaces またはローカル開発環境が必要。
                                                                                                                     
                                                                                                                      - ## 開発ワークフロー
                                                                                                                     
                                                                                                                      - - mainブランチは保護されている。コード変更はPR経由
                                                                                                                        - - ドキュメントファイル(HANDOFF.md等)はmainに直接コミット可能
                                                                                                                          - - マージ後Vercelが自動デプロイ
                                                                                                                           
                                                                                                                            - ## 重要な制約
                                                                                                                           
                                                                                                                            - - Google Places APIデータ = 絶対改変不可のファクト
                                                                                                                              - - UGC embeds: 公式プラットフォームembed APIのみ使用（法的要件）
                                                                                                                                - - PR/広告挿入: ON/OFF切替可能（CONTEXTUAL_PR_ENABLED環境変数）
                                                                                                                                  - - ユーザー向けテキストに「AI」の文言は使わない
                                                                                                                                    - - テストファイルはユーザー向けテキスト変更時に必ず更新
                                                                                                                                      - - layout.tsxにHeaderは含まない。各ページで個別にimport
                                                                                                                                        - - GitHub Web UIでの日本語TSXコード編集は閉じタグが破損する（地雷2）
                                                                                                                                         
                                                                                                                                          - ## NotebookLM
                                                                                                                                         
                                                                                                                                          - ノートブック: futatabito コアコンセプト（旧: nightchill コアコンセプト）
                                                                                                                                          - 10ソース登録済み（要件定義、技術仕様、進捗記録、UGC運用方針、ブランドリネーム等）
                                                                                                                                          - URL: https://notebooklm.google.com/notebook/b5fca57c-0385-4064-9188-0f0343032e16
                                                                                                                                          
                                                                                                                                          ## パフォーマンスベンチマーク（2026-02-21時点）
                                                                                                                                          
                                                                                                                                          PageSpeed Insights（モバイル）:
                                                                                                                                          
                                                                                                                                          | 指標 | スコア |
                                                                                                                                          |------|--------|
                                                                                                                                          | Performance | 97 |
                                                                                                                                          | Accessibility | 95 |
                                                                                                                                          | Best Practices | 100 |
                                                                                                                                          | SEO | 100 |
                                                                                                                                          | FCP | 1.6s |
                                                                                                                                          | LCP | 1.8s |
                                                                                                                                          
                                                                                                                                          ## ロードマップ（優先順位）
                                                                                                                                          
                                                                                                                                          ### Phase 0: ブランドリネーム（最優先）
                                                                                                                                          
                                                                                                                                          - [ ] コード内のブランド名変更（nightchill表示をfutatabitoに）（Codespaces/ローカル環境で実行）
                                                                                                                                          - [ ] - [ ] layout.tsxのmetadata更新（title, description, OGP）
                                                                                                                                          - [ ] - [ ] Header/Footerのブランド表示更新
                                                                                                                                          - [ ] - [ ] ai-planner.tsのSYSTEM_PROMPT更新
                                                                                                                                          - [ ] テストファイル更新
                                                                                                                                          - [ ] - [ ] package.json / README.md更新
                                                                                                                                         
                                                                                                                                          - [ ] ### Phase 1: E-E-A-T基盤 + SEO
                                                                                                                                         
                                                                                                                                          - [ ] - [ ] /about ページ（運営者情報）
                                                                                                                                          - [ ] - [ ] /privacy ページ（プライバシーポリシー）
                                                                                                                                          - [ ] - [ ] sitemap.xml + robots.txt
                                                                                                                                          - [ ] - [ ] OGPメタデータ強化
                                                                                                                                         
                                                                                                                                          - [ ] ### Phase 2: 運営基盤（DB移行）
                                                                                                                                         
                                                                                                                                          - [ ] - [ ] Vercel Postgres セットアップ + マイグレーション
                                                                                                                                          - [ ] - [ ] 記事管理機能
                                                                                                                                          - [ ] UGCキュレーション機能
                                                                                                                                          - [ ] - [ ] 監査ログ
                                                                                                                                         
                                                                                                                                          - [ ] ### Phase 3: UGC embed実装
                                                                                                                                          
                                                                                                                                          - [ ] X (Twitter) embed
                                                                                                                                          - [ ] - [ ] TikTok oEmbed API
                                                                                                                                          - [ ] - [ ] Instagram oEmbed API（Meta App Review）
                                                                                                                                          - [ ] AI自動収集パイプライン
                                                                                                                                          
                                                                                                                                          ### Phase 4: ユーザーリテンション + インバウンド対応
                                                                                                                                          
                                                                                                                                          - [ ] プラン保存機能（SSO）
                                                                                                                                          - [ ] - [ ] i18n対応（英語版: /en/ ルーティング）
                                                                                                                                          - [ ] - [ ] アクセス分析ダッシュボード
                                                                                                                                          
                                                                                                                                          ### Phase 5: 収益化・拡張
                                                                                                                                          
                                                                                                                                          - [ ] Contextual PR管理
                                                                                                                                          - [ ] - [ ] プレミアムプラン生成
                                                                                                                                          - [ ] - [ ] エリア拡大
                                                                                                                                         
                                                                                                                                          - [ ] ## 完了済み
                                                                                                                                          
                                                                                                                                          - [x] 全7エリア特集記事
                                                                                                                                          - [ ] - [x] ヒーロー画像の統一（全7枚、1370x896）
                                                                                                                                          - [ ] - [x] AIデートプラン生成機能
                                                                                                                                          - [x] 管理画面（読み取り専用）
                                                                                                                                          - [ ] - [x] CI/CD
                                                                                                                                          - [ ] - [x] パフォーマンスベンチマーク取得（97/95/100/100）
                                                                                                                                          - [x] ブランドリネーム方針決定（nightchill -> futatabito）
                                                                                                                                          - [x] 商標調査実施（J-PlatPat: 関連区分での直接競合なし）
                                                                                                                                          - [ ] - [x] HANDOFF.md更新
                                                                                                                                          - [x] NotebookLM更新
