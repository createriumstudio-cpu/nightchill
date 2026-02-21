# nightchill 引き継ぎドキュメント(HANDOFF.md)

最終更新: 2026-02-21

## プロジェクト概要

**nightchill** − 成功確約型デートコンシェルジュWebメディア

- コンセプト: 「Where」ではなく「How」を提供。「点（スポット情報）」ではなく「線（1軒目→2軒目の動線、会話、事前準備）」
- - ターゲット: 都内20-30代デート層
  - - マネタイズ: Contextual PR（文脈連動型）のみ。嘘の営業時間や不自然なバナー広告は厳禁
   
    - ## 技術スタック
   
    - - **フレームワーク**: Next.js 16 + TypeScript strict + Tailwind CSS v4
      - - **テスト**: Jest + React Testing Library
        - - **ホスティング**: Vercel (nightchill-sr5g がプロダクション)
          - - **リポジトリ**: https://github.com/createriumstudio-cpu/nightchill
            - - **本番URL**: https://nightchill-sr5g.vercel.app
             
              - ## Vercel環境変数(nightchill-sr5g)
             
              - | 変数名 | 用途 |
              - |--------|------|
              - | ANTHROPIC_API_KEY | AIプラン生成 |
              - | GOOGLE_PLACES_API_KEY | Google Places API |
              - | GOOGLE_MAPS_API_KEY | Google Maps API |
              - | ADMIN_PASSWORD | 管理画面ログイン（値: taas1111） |
             
              - ## 本番ページ構成
             
              - | URL | 説明 | 状態 |
              - |-----|------|------|
              - | / | ホームページ | ✅ 稼働中 |
              - | /features | 特集一覧（ヒーロー画像付きカード） | ✅ 稼働中（7記事） |
              - | /features/ebisu-night-date | 恵比寿ナイトデート詳細 | ✅ 稼働中 |
              - | /features/shibuya-casual-date | 渋谷カジュアルデート詳細 | ✅ 稼働中 |
              - | /features/omotesando-sophisticated-date | 表参道デート詳細 | ✅ 稼働中 |
              - | /features/roppongi-premium-night | 六本木プレミアムナイト詳細 | ✅ 稼働中 |
              - | /features/ginza-luxury-date | 銀座ラグジュアリーデート詳細 | ✅ 稼働中 |
              - | /features/nakameguro-canal-date | 中目黒キャナルデート詳細 | ✅ 稼働中 |
              - | /features/daikanyama-stylish-date | 代官山スタイリッシュデート詳細 | ✅ 稼働中 |
              - | /plan → /results | AIデートプラン生成 | ✅ 稼働中 |
              - | /admin/login | 管理画面ログイン | ✅ 稼働中 |
              - | /admin | 管理画面ダッシュボード | ✅ 稼働中（読み取り専用） |
             
              - *Vercelのサーバーレス環境はファイルシステムが読み取り専用のため、CRUD書き込み操作は動作しません。将来的にVercel KV/Postgresへの移行が必要です。
             
              - ## 画像について
             
              - ### 現在の画像（2026-02-21時点・全7枚統一済み）
             
              - ヒーロー画像は Gemini で生成（フォトリアル）。すべて `public/images/` に格納。
             
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
             
              - 画像は複数回の修正を経て現在の状態に至っています。引き継ぎ時に理解しておくべき経緯：
             
              - 1. **初期（PR #18〜#22）**: Geminiで生成した画像をGitHubにアップロード。恵比寿・渋谷・表参道・六本木は正常にダウンロード画像が反映されたが、銀座・中目黒・代官山はGeminiのライトボックスUIごとスクリーンショットされた画像（Gemini UIの黒枠付き）になってしまった。
                2. 2. **修正1回目**: 銀座・中目黒・代官山をGeminiから再ダウンロードし、フルビューポートのクリーンな画像に差し替え（1370x896）。
                   3. 3. **修正2回目**: 銀座等を修正した結果、恵比寿・渋谷・表参道・六本木の画像（元々はGeminiライトボックスのスクリーンショット、1158x1036）に黒い枠が残っていることが目立つようになった。CSSズーム手法（155vw/155vh、-27.5%オフセット + object-fit:cover）で黒枠部分をクロップしたスクリーンショットに差し替え。全7枚が統一された。
                     
                      4. **重要**: 今後画像を追加する場合は、Geminiから画像を「ダウンロード」して純粋な画像ファイルとしてアップロードすること。スクリーンショットはライトボックスUIや黒枠が混入するリスクがある。Google CDN URL（lh3.googleusercontent.com）は非公開URLのため、必ずGitHubリポジトリにアップロードする。
                     
                      5. ### 画像生成時のプロンプトのコツ
                     
                      6. - 英語で記述（日本語だとイラスト調になる）
                         - - カメラ設定明記: "Shot on Sony A7IV, 35mm f/1.4 lens"
                           - - 路地の左右は異なる店舗を明示的に指定
                             - - 日本人モデルは "clearly Japanese" と明記
                               - - "NO text, NO watermarks, NO logos" を必ず含める
                                
                                 - ## 開発ワークフロー
                                
                                 - - mainブランチは保護されている → コード変更はPR経由
                                   - - ブランチ作成 → コミット → PR作成 → CI(4チェック)パス → マージ
                                     - - マージ後Vercelが自動デプロイ
                                       - - ドキュメントファイル(HANDOFF.md等)はmainに直接コミット可能な場合あり
                                        
                                         - ### PR履歴

                                         - PR #1-#13: プロジェクト初期セットアップ〜JSON解析修正
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
                                                                
                                                                 - ## 重要な制約
                                                                
                                                                 - - Google Places APIデータ = 絶対改変不可のファクト
                                                                   - - UGC embeds: 公式プラットフォームembed APIのみ使用（法的要件）
                                                                     - - PR/広告挿入: ON/OFF切替可能（CONTEXTUAL_PR_ENABLED環境変数）
                                                                       - - ユーザー向けテキストに「AI」の文言は使わない
                                                                         - - テストファイルはユーザー向けテキスト変更時に必ず更新
                                                                           - - layout.tsxにHeaderは含まない → 各ページで個別にimport
                                                                            
                                                                             - ## NotebookLM
                                                                            
                                                                             - - ノートブック: nightchill コアコンセプト
                                                                               - - 8ソース登録済み（要件定義、技術仕様、進捗記録等）
                                                                                 - - URL: https://notebooklm.google.com/notebook/b5fca57c-0385-4064-9188-0f0343032e16
                                                                                  
                                                                                   - ## 現在の課題・制約
                                                                                  
                                                                                   - ### 管理画面
                                                                                   - - Vercelサーバーレス環境のため、ファイルシステム書き込みが不可
                                                                                     - - 現在は読み取り専用ダッシュボード
                                                                                       - - 記事追加・編集にはGitHubへの直接コミットが必要（非エンジニアには困難）
                                                                                        
                                                                                         - ### コンテンツ
                                                                                         - - 各スポットのリアルSNS投稿URL（UGC embed）が未実装
                                                                                           - - プラン結果がsessionStorage保存のみ（ブラウザを閉じると消失）
                                                                                            
                                                                                             - ### インフラ
                                                                                             - - Vercel 2プロジェクト問題: nightchill と nightchill-sr5g が共存。本番は nightchill-sr5g のみ
                                                                                              
                                                                                               - ## ロードマップ（優先順位）
                                                                                              
                                                                                               - ### Phase 1: 運営基盤（最優先）
                                                                                               - - [ ] **管理画面DB移行**: Vercel Postgres へ移行し、記事CRUD操作を有効化
                                                                                                 - [ ] - [ ] **記事管理機能**: 特集記事の作成・編集・公開/下書き切替、画像アップロード、スポット紐付け
                                                                                                 - [ ] - [ ] **スポット管理**: Google Places APIデータの閲覧 + 補足情報の追加（ファクトデータは改変不可を遵守）
                                                                                                
                                                                                                 - [ ] ### Phase 2: コンテンツ強化
                                                                                                 - [ ] - [ ] **UGC embed実装**: 各スポットにリアルSNS投稿（Instagram/X等）の公式embedを埋め込み
                                                                                                 - [ ] - [ ] **SEO基盤整備**: sitemap.xml、robots.txt、各記事のOGP画像、JSON-LD構造化データの充実
                                                                                                
                                                                                                 - [ ] ### Phase 3: ユーザーリテンション
                                                                                                 - [ ] - [ ] **プラン保存機能**: SSO（Googleログイン等）で軽量アカウント → 生成プラン・お気に入り記事を保存
                                                                                                 - [ ] - [ ] **アクセス分析ダッシュボード**: 記事PV、プラン生成数などの運営指標
                                                                                                
                                                                                                 - [ ] ### Phase 4: 収益化・拡張（ユーザー基盤ができてから）
                                                                                                 - [ ] - [ ] **Contextual PR管理**: 広告枠の管理・掲載ON/OFF・効果測定
                                                                                                 - [ ] - [ ] **プレミアムプラン生成**: 無料=テンプレート / 有料=AIパーソナライズ
                                                                                                 - [ ] - [ ] **エリア拡大**: 国内旅行・海外旅行カテゴリ追加
                                                                                                
                                                                                                 - [ ] ### 完了済み
                                                                                                 - [ ] - [x] 全7エリア特集記事（恵比寿・渋谷・表参道・六本木・銀座・中目黒・代官山）
                                                                                                 - [ ] - [x] ヒーロー画像の統一（全7枚、1370x896フルビューポート、黒枠なし）
                                                                                                 - [ ] - [x] AIデートプラン生成機能（Claude API + テンプレートフォールバック）
                                                                                                 - [ ] - [x] 管理画面（ログイン + 読み取り専用ダッシュボード）
                                                                                                 - [ ] - [x] CI/CD（GitHub Actions → Vercel自動デプロイ）
