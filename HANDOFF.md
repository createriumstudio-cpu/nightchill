# nightchill 引き継ぎドキュメント(HANDOFF.md)

最終更新: 2026-02-21

## プロジェクト概要

**nightchill** − 成功確約型デートコンシェルジュWebメディア

- コンセプト: 「Where」ではなく「How」を提供。「点（スポット情報）」ではなく「線（1軒目→2軒目の動線、会話、事前準備）」
-   - ターゲット: 都内20-30代デート層
    -     - マネタイズ: Contextual PR（文脈連動型）のみ。嘘の営業時間や不自然なバナー広告は厳禁
 
    -   - ## 技術スタック
     
        -   - **フレームワーク**: Next.js 16 + TypeScript strict + Tailwind CSS v4
            -   - **テスト**: Jest + React Testing Library
                -     - **ホスティング**: Vercel (nightchill-sr5g がプロダクション)
                -       - **リポジトリ**: https://github.com/createriumstudio-cpu/nightchill
                -         - **本番URL**: https://nightchill-sr5g.vercel.app
             
                -           - ## Vercel環境変数(nightchill-sr5g)
             
                -             - | 変数名 | 用途 |
                -               - |--------|------|
                -                 - | ANTHROPIC_API_KEY | AIプラン生成 |
                -                   - | GOOGLE_PLACES_API_KEY | Google Places API |
                -                     - | GOOGLE_MAPS_API_KEY | Google Maps API |
                -                       - | ADMIN_PASSWORD | 管理画面ログイン（値: taas1111)  |
             
                -                         - ## 本番ページ構成
             
                -                           - | URL | 説明 | 状態 |
                -                             - |-----|------|------|
                -                               - | / | ホームページ | ✅ 稼働中 |
                -                                 - | /features | 特集一覧（ヒーロー画像付きカード） | ✅ 稼働中（7記事） |
                -                                   - | /features/ebisu-night-date | 恵比寿ナイトデート詳細 | ✅ 稼働中 |
                -                                     - | /features/shibuya-casual-date | 渋谷カジュアルデート詳細 | ✅ 稼働中 |
                -                                       - | /features/omotesando-sophisticated-date | 表参道デート詳細 | ✅ 稼働中 |
                -                                         - | /features/roppongi-premium-night | 六本木プレミアムナイト詳細 | ✅ 稼働中 |
                -                                           - | /features/ginza-luxury-date | 銀座ラグジュアリーデート詳細 | ✅ 稼働中 |
                -                                             - | /features/nakameguro-canal-date | 中目黒キャナルデート詳細 | ✅ 稼働中 |
                -                                               - | /features/daikanyama-stylish-date | 代官山スタイリッシュデート詳細 | ✅ 稼働中 |
                -                                                 - | /plan → /results | AIデートプラン生成 | ✅ 稼働中 |
                -                                                   - | /admin/login | 管理画面ログイン | ✅ 稼働中 |
                -                                                     - | /admin | 管理画面ダッシュボード | ✅ 稼働中（読み取り専用） |
             
                -                                                 *Vercelのサーバーレス環境はファイルシステムが読み取り専用のため、CRUD書き込み操作は動作しません。将来的にVercel Postgres への移行が必要です。
             
                -                                             ---

                ## 画像について

                ### 現在の画像（2026-02-21時点・全7枚統一済み）

                ヒーロー画像は Gemini で生成（フォトリアル）。すべて public/images/ に格納。

                | ファイル名 | サイズ | 説明 |
                |-----------|--------|------|
                | ebisu-night-date-hero.png | 1370x896 | 恵比寿イタリアン路地 |
                | shibuya-casual-date-hero.png | 1370x896 | 渋谷カフェカップル |
                | omotesando-date-hero.png | 1370x896 | 表参道並木道カップル |
                | roppongi-night-date-hero.png | 1370x896 | 六本木ルーフトップバー+東京タワー |
                | ginza-luxury-date-hero.png | 1370x896 | 銀座並木通りラグジュアリーカップル |
                | nakameguro-canal-date-hero.png | 1370x896 | 中目黒キャナル沿いカフェカップル |
                | daikanyama-stylish-date-hero.png | 1370x896 | 代官山スタイリッシュカップル |

                ### 画像修正履歴

                画像は複数回の修正を経て現在の状態に至っています。引き継ぎ時に理解しておくべき経緯：

                1. **初期（PR #18〜#22）**: Geminiで生成した画像をGitHubにアップロード。恵比寿・渋谷・表参道・六本木は正常にダウンロード画像が反映されたが、銀座・中目黒・代官山はGeminiのライトボックスUIごとスクリーンショットされた画像（Gemini UIの黒枠付き）になってしまった。
                2. 2. **修正1回目**: 銀座・中目黒・代官山をGeminiから再ダウンロードし、フルビューポートのクリーンな画像に差し替え（1370x896）。
                   3. 3. **修正2回目**: 銀座等を修正した結果、恵比寿・渋谷・表参道・六本木の画像（元々はGeminiライトボックスのスクリーンショット、1158x1036）に黒い枠が残っていることが目立つようになった。CSSズーム手法（155vw/155vh、-27.5%オフセット + object-fit:cover）で黒枠部分をクロップしたスクリーンショットに差し替え。全7枚が統一された。
                     
                      4. **重要**: 今後画像を追加する場合は、Geminiから画像を「ダウンロード」して純粋な画像ファイルとしてアップロードすること。スクリーンショットはライトボックスUIや黒枠が混入するリスクがある。Google CDN URL（lh3.googleusercontent.com）は非公開URLのため、必ずGitHubリポジトリにアップロードする。
                     
                      5. ### 画像生成時のプロンプトのコツ
                     
                      6. - 英語で記述（日本語だとイラスト調になる）
                         - - カメラ設定明記: "Shot on Sony A7IV, 35mm f/1.4 lens"
                           - - 路地の左右は異なる店舗を明示的に指定
                             - - 日本人モデルは "clearly Japanese" と明記
                               - - "NO text, NO watermarks, NO logos" を必ず含める
                                
                                 - ---

                                 ## UGC（User Generated Content）運用ガイドライン

                                 ### 概要

                                 UGC embedとは、Instagram・TikTok等のSNS投稿を特集記事ページに埋め込み表示する機能。ユーザーのリアルな体験をサイトに反映することで、E-E-A-Tの「Experience（経験）」を強化し、コンテンツの信頼性を向上させる。

                                 ### 運用方式: ハイブリッド方式（AI収集 + 人間最終判断）

                                 #### フェーズ1: 手動運用（初期）

                                 DB移行前は、embed codeを手動でコピペする運用。

                                 1. 運営者がInstagram/TikTokで関連投稿を検索
                                 2. 2. embed codeをコピー
                                    3. 3. 特集記事のソースコードに直接追記（PR経由）
                                       4. 4. レビュー → マージ → デプロイ
                                         
                                          5. #### フェーズ2: 管理画面から運用（DB移行後）
                                         
                                          6. 管理画面にUGCキュレーション機能を追加。
                                         
                                          7. **収集フロー:**
                                          8. 1. AIがハッシュタグ検索で候補を自動収集（#銀座デート #表参道カフェ 等）
                                             2. 2. エンゲージメント指標（いいね数・コメント数・保存数）でスコアリング
                                                3. 3. 画像品質フィルタリング（ぼやけ・不適切コンテンツの自動除外）
                                                   4. 4. デートプランのエリア・カテゴリとの自動マッチング
                                                     
                                                      5. **承認フロー（人間が最終判断）:**
                                                      6. 1. 管理画面に候補一覧がスコア順で表示される
                                                         2. 2. 運営者が各投稿を確認し、承認/却下をワンクリックで判断
                                                            3. 3. 承認された投稿のみがサイトに反映
                                                              
                                                               4. **人間が判断すべきポイント:**
                                                               5. - ブランドトーン適合性（nightchillの「成功確約型」「大人のデート」コンセプトに合うか）
                                                                  - - 著作権・肖像権リスク（他人の顔の映り込み、無許可撮影等）
                                                                    - - コンテンツ信頼性（ステマ・広告投稿の見極め）
                                                                      - - E-E-A-T「Experience」の品質（本物の体験投稿かどうか）
                                                                       
                                                                        - ### プラットフォーム別embed制約
                                                                       
                                                                        - | プラットフォーム | API | 審査 | 備考 |
                                                                        - |---------------|-----|------|------|
                                                                        - | Instagram | oEmbed API | Meta App Review必要（数週間） | Business/Creator アカウントのみ対応 |
                                                                        - | TikTok | oEmbed API | 比較的容易 | 公開投稿のみ対応 |
                                                                        - | X (Twitter) | Publish API | 不要 | 最も導入しやすい |
                                                                       
                                                                        - **厳守事項:**
                                                                        - - 公式プラットフォームembed APIのみ使用（法的要件、CLAUDE.md記載）
                                                                          - - スクレイピングや非公式APIは厳禁
                                                                            - - 投稿者の意図に反する使用は禁止
                                                                              - - embed表示時に投稿者名・プロフィールリンクを必ず表示
                                                                               
                                                                                - ---

                                                                                ## データベース設計方針（Vercel Postgres移行時）

                                                                                ### 移行の必要性

                                                                                現状の管理画面はファイルシステム(JSON)ベースで、Vercelサーバーレス環境では読み取り専用。記事管理・UGCキュレーション・分析を実現するにはDBが必須。

                                                                                ### 推奨: Vercel Postgres (Neon)

                                                                                Vercelとネイティブ統合されたPostgreSQLサービス。Hobby Planで無料枠あり。

                                                                                ### テーブル設計（案）

                                                                                ```sql
                                                                                -- 特集記事テーブル
                                                                                CREATE TABLE features (
                                                                                  id SERIAL PRIMARY KEY,
                                                                                  slug VARCHAR(255) UNIQUE NOT NULL,
                                                                                  title VARCHAR(500) NOT NULL,
                                                                                  area VARCHAR(100) NOT NULL,
                                                                                  description TEXT,
                                                                                  hero_image_path VARCHAR(500),
                                                                                  status VARCHAR(20) DEFAULT 'draft', -- draft / published
                                                                                  published_at TIMESTAMP,
                                                                                  created_at TIMESTAMP DEFAULT NOW(),
                                                                                  updated_at TIMESTAMP DEFAULT NOW()
                                                                                );

                                                                                -- スポットテーブル（Google Places APIデータ連携）
                                                                                CREATE TABLE spots (
                                                                                  id SERIAL PRIMARY KEY,
                                                                                  feature_id INTEGER REFERENCES features(id),
                                                                                  place_id VARCHAR(255), -- Google Places API place_id
                                                                                  name VARCHAR(500) NOT NULL,
                                                                                  category VARCHAR(100),
                                                                                  order_in_plan INTEGER, -- 1軒目、2軒目等の順序
                                                                                  editorial_note TEXT, -- 補足情報（ファクトデータは改変不可）
                                                                                  created_at TIMESTAMP DEFAULT NOW()
                                                                                );

                                                                                -- UGC投稿テーブル
                                                                                CREATE TABLE ugc_posts (
                                                                                  id SERIAL PRIMARY KEY,
                                                                                  platform VARCHAR(50) NOT NULL, -- instagram / tiktok / x
                                                                                  post_url VARCHAR(1000) NOT NULL,
                                                                                  embed_code TEXT,
                                                                                  author_handle VARCHAR(255),
                                                                                  caption_preview VARCHAR(500),
                                                                                  engagement_score FLOAT, -- AI算出のスコア
                                                                                  hashtags TEXT[], -- 関連ハッシュタグ
                                                                                  matched_feature_id INTEGER REFERENCES features(id),
                                                                                  matched_area VARCHAR(100),
                                                                                  status VARCHAR(20) DEFAULT 'pending', -- pending / approved / rejected
                                                                                  reviewed_by VARCHAR(255),
                                                                                  reviewed_at TIMESTAMP,
                                                                                  collected_at TIMESTAMP DEFAULT NOW(),
                                                                                  displayed_at TIMESTAMP -- サイト反映日時
                                                                                );

                                                                                -- UGC収集ルール（AI自動収集の設定）
                                                                                CREATE TABLE ugc_collection_rules (
                                                                                  id SERIAL PRIMARY KEY,
                                                                                  feature_id INTEGER REFERENCES features(id),
                                                                                  platform VARCHAR(50) NOT NULL,
                                                                                  search_hashtags TEXT[] NOT NULL,
                                                                                  min_engagement_score FLOAT DEFAULT 0.5,
                                                                                  is_active BOOLEAN DEFAULT true,
                                                                                  last_collected_at TIMESTAMP,
                                                                                  created_at TIMESTAMP DEFAULT NOW()
                                                                                );

                                                                                -- 管理者アクションログ
                                                                                CREATE TABLE admin_audit_log (
                                                                                  id SERIAL PRIMARY KEY,
                                                                                  admin_user VARCHAR(255),
                                                                                  action VARCHAR(100) NOT NULL, -- approve_ugc / reject_ugc / publish_feature etc.
                                                                                  target_table VARCHAR(100),
                                                                                  target_id INTEGER,
                                                                                  details JSONB,
                                                                                  created_at TIMESTAMP DEFAULT NOW()
                                                                                );
                                                                                ```

                                                                                ### 管理画面に必要な機能（DB移行後）

                                                                                **記事管理:**
                                                                                - 特集記事の作成・編集・公開/下書き切替
                                                                                - - 画像アップロード
                                                                                  - - スポット紐付け（Google Places APIデータ閲覧 + 補足情報追加）
                                                                                    - - プレビュー機能
                                                                                     
                                                                                      - **UGCキュレーション:**
                                                                                      - - 候補一覧（スコア順、プラットフォーム別フィルタ）
                                                                                        - - ワンクリック承認/却下
                                                                                          - - 承認済み投稿の表示順管理
                                                                                            - - 収集ルール設定（エリア別ハッシュタグ、最低スコア閾値）
                                                                                             
                                                                                              - **分析ダッシュボード:**
                                                                                              - - 記事PV（Vercel Analytics連携）
                                                                                                - - プラン生成数
                                                                                                  - - UGC表示回数・クリック率
                                                                                                   
                                                                                                    - **監査ログ:**
                                                                                                    - - 全管理操作の記録（誰が・いつ・何を変更したか）
                                                                                                     
                                                                                                      - ### 実装に必要な作業（15-20ファイル変更）
                                                                                                     
                                                                                                      - DB移行はGitHub Web UIでは困難。GitHub Codespaces またはローカル開発環境が必要。
                                                                                                     
                                                                                                      - 1. Vercel Postgres セットアップ（Vercelダッシュボードから）
                                                                                                        2. 2. `@vercel/postgres` パッケージインストール
                                                                                                           3. 3. マイグレーションスクリプト作成
                                                                                                              4. 4. `src/lib/db.ts` — DB接続・クエリヘルパー
                                                                                                                 5. 5. `src/lib/features.ts` — JSON読み取り → DB読み取りに変更
                                                                                                                    6. 6. `src/app/api/features/route.ts` — CRUD API
                                                                                                                       7. 7. `src/app/api/ugc/route.ts` — UGC管理API
                                                                                                                          8. 8. `src/app/admin/page.tsx` — 管理画面UI更新
                                                                                                                             9. 9. `src/app/admin/ugc/page.tsx` — UGCキュレーション画面
                                                                                                                                10. 10. テスト更新
                                                                                                                                   
                                                                                                                                    11. ---
                                                                                                                                   
                                                                                                                                    12. ## 開発ワークフロー
                                                                                                                                   
                                                                                                                                    13. - mainブランチは保護されている → コード変更はPR経由
                                                                                                                                        - - ブランチ作成 → コミット → PR作成 → CI(4チェック)パス → マージ
                                                                                                                                          - - マージ後Vercelが自動デプロイ
                                                                                                                                            - - ドキュメントファイル(HANDOFF.md等)はmainに直接コミット可能な場合あり
                                                                                                                                             
                                                                                                                                              - ### PR履歴
                                                                                                                                             
                                                                                                                                              - - PR #1-#13: プロジェクト初期セットアップ〜JSON解析修正
                                                                                                                                                - - PR #14: Feature pages + UGC embeds
                                                                                                                                                  - - PR #15: Header added to feature pages
                                                                                                                                                    - - PR #16: Remove "AI" wording from feature page CTAs
                                                                                                                                                      - - PR #17: Remove "AI" wording from homepage + fix test
                                                                                                                                                        - - PR #18: Add hero images to feature pages (Unsplash placeholder)
                                                                                                                                                          - - PR #19: Admin panel with JSON data store + CRUD API
                                                                                                                                                            - - PR #20: Nanobanana Pro hero images (ebisu + shibuya) + local paths
                                                                                                                                                              - - PR #21: Omotesando + Roppongi feature articles + hero images
                                                                                                                                                                - - PR #22: Ginza + Nakameguro + Daikanyama feature articles + hero images
                                                                                                                                                                 
                                                                                                                                                                  - ### 直接コミット履歴（画像修正）
                                                                                                                                                                 
                                                                                                                                                                  - - Commit: fix: replace hero images with clean Gemini-generated images for Ginza...
                                                                                                                                                                    - - Commit: fix: replace hero images with full-viewport clean images for Ginza, N...
                                                                                                                                                                      - - Commit: fix: replace hero images with clean full-viewport versions for Ebisu, Shibuya, Omotesando, Roppongi
                                                                                                                                                                       
                                                                                                                                                                        - ---
                                                                                                                                                                        
                                                                                                                                                                        ## 重要な制約
                                                                                                                                                                        
                                                                                                                                                                        - Google Places APIデータ = 絶対改変不可のファクト
                                                                                                                                                                        - - UGC embeds: 公式プラットフォームembed APIのみ使用（法的要件）
                                                                                                                                                                          - - PR/広告挿入: ON/OFF切替可能（CONTEXTUAL_PR_ENABLED環境変数）
                                                                                                                                                                          - ユーザー向けテキストに「AI」の文言は使わない
                                                                                                                                                                          - - テストファイルはユーザー向けテキスト変更時に必ず更新
                                                                                                                                                                            - - layout.tsxにHeaderは含まない → 各ページで個別にimport
                                                                                                                                                                            
                                                                                                                                                                            ---
                                                                                                                                                                            
                                                                                                                                                                            ## NotebookLM
                                                                                                                                                                            
                                                                                                                                                                            - ノートブック: nightchill コアコンセプト
                                                                                                                                                                            - - 9ソース登録済み（要件定義、技術仕様、進捗記録、UGC運用方針等）
                                                                                                                                                                              - - URL: https://notebooklm.google.com/notebook/b5fca57c-0385-4064-9188-0f0343032e16
                                                                                                                                                                               
                                                                                                                                                                                - ---
                                                                                                                                                                                
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
                                                                                                                                                                                
                                                                                                                                                                                ---
                                                                                                                                                                                
                                                                                                                                                                                ## 現在の課題・制約
                                                                                                                                                                                
                                                                                                                                                                                ### 管理画面
                                                                                                                                                                                - Vercelサーバーレス環境のため、ファイルシステム書き込みが不可
                                                                                                                                                                                - 現在は読み取り専用ダッシュボード
                                                                                                                                                                                - - 記事追加・編集にはGitHubへの直接コミットが必要（非エンジニアには困難）
                                                                                                                                                                                - UGCキュレーション機能なし（DB移行後に実装予定）
                                                                                                                                                                               
                                                                                                                                                                                - ### コンテンツ
                                                                                                                                                                                - 各スポットのリアルSNS投稿URL（UGC embed）が未実装
                                                                                                                                                                                - プラン結果がsessionStorage保存のみ（ブラウザを閉じると消失）
                                                                                                                                                                                - /about（運営者情報）ページなし → E-E-A-T Trustworthiness不足
                                                                                                                                                                                - /privacy（プライバシーポリシー）ページなし → E-E-A-T Trustworthiness不足
                                                                                                                                                                                - sitemap.xml / robots.txt 未作成 → SEOインデックス最適化不足
                                                                                                                                                                                
                                                                                                                                                                                ### インフラ
                                                                                                                                                                                - Vercel 2プロジェクト問題: nightchill と nightchill-sr5g が共存。本番は nightchill-sr5g のみ
                                                                                                                                                                                
                                                                                                                                                                                ---
                                                                                                                                                                                
                                                                                                                                                                                ## ロードマップ（優先順位）
                                                                                                                                                                                
                                                                                                                                                                                ### Phase 1: E-E-A-T基盤 + SEO（最優先・GitHub Web UIで実行可能）
                                                                                                                                                                                - [ ] /about ページ（運営者情報） — E-E-A-T Trustworthiness
                                                                                                                                                                                - [ ] - [ ] /privacy ページ（プライバシーポリシー） — E-E-A-T Trustworthiness
                                                                                                                                                                                - [ ] sitemap.xml + robots.txt — SEOインデックス最適化
                                                                                                                                                                                - [ ] OGPメタデータ強化 — SNSシェア最適化
                                                                                                                                                                               
                                                                                                                                                                                - [ ] ### Phase 2: 運営基盤（DB移行 — Codespaces/ローカル環境が必要）
                                                                                                                                                                                - [ ] Vercel Postgres セットアップ + マイグレーション
                                                                                                                                                                                - [ ] 記事管理機能: 特集記事の作成・編集・公開/下書き切替
                                                                                                                                                                                - [ ] スポット管理: Google Places APIデータの閲覧 + 補足情報の追加
                                                                                                                                                                                - [ ] UGCキュレーション機能: 候補一覧・ワンクリック承認/却下・収集ルール設定
                                                                                                                                                                                - [ ] 監査ログ: 全管理操作の記録
                                                                                                                                                                                
                                                                                                                                                                                ### Phase 3: UGC embed実装
                                                                                                                                                                                - [ ] X (Twitter) embed（最も導入しやすい、API審査不要）
                                                                                                                                                                                - [ ] TikTok oEmbed API 連携
                                                                                                                                                                                - [ ] Instagram oEmbed API 連携（Meta App Review 申請→承認待ち）
                                                                                                                                                                                - [ ] AI自動収集パイプライン（ハッシュタグ検索→スコアリング→候補表示）
                                                                                                                                                                                
                                                                                                                                                                                ### Phase 4: ユーザーリテンション
                                                                                                                                                                                - [ ] プラン保存機能: SSO（Googleログイン等）で軽量アカウント → 生成プラン・お気に入り記事を保存
                                                                                                                                                                                - [ ] アクセス分析ダッシュボード: 記事PV、プラン生成数などの運営指標
                                                                                                                                                                                
                                                                                                                                                                                ### Phase 5: 収益化・拡張（ユーザー基盤ができてから）
                                                                                                                                                                                - [ ] Contextual PR管理: 広告枠の管理・掲載ON/OFF・効果測定
                                                                                                                                                                                - [ ] プレミアムプラン生成: 無料=テンプレート / 有料=AIパーソナライズ
                                                                                                                                                                                - [ ] - [ ] エリア拡大: 国内旅行・海外旅行カテゴリ追加
                                                                                                                                                                               
                                                                                                                                                                                - [ ] ### 会員登録・決済について
                                                                                                                                                                                現時点では不要。理由:
- まだユーザー基盤がない段階で課金機能を作るのは時期尚早
- - まずはコンテンツ（特集記事+UGC）で集客 → ユーザー行動データを蓄積
- Phase 4のSSO（Googleログイン等）で十分。独自会員登録はUX負荷が高い
- - 決済（Stripe等）はPhase 5でプレミアムプラン生成の需要が確認できてから
 
  - ### 完了済み
  - - [x] 全7エリア特集記事（恵比寿・渋谷・表参道・六本木・銀座・中目黒・代官山）
    - [ ] - [x] ヒーロー画像の統一（全7枚、1370x896フルビューポート、黒枠なし）
    - [ ] - [x] AIデートプラン生成機能（Claude API + テンプレートフォールバック）
    - [ ] - [x] 管理画面（ログイン + 読み取り専用ダッシュボード）
    - [ ] - [x] CI/CD（GitHub Actions → Vercel自動デプロイ）
    - [ ] - [x] パフォーマンスベンチマーク取得（97/95/100/100）
