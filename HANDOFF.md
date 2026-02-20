# nightchill 引き継ぎドキュメント(HANDOFF.md)
最終更新: 2026-02-21

## プロジェクト概要
**nightchill** − 成功確約型デートコンシェルジュWebメディア
- コンセプト: 「Where」ではなく「How」を提供。「点（スポット情報）」ではなく「線（1軒目→2軒目の動線、会話、事前準備）」
- ターゲット: 都内20-30代デート層
- マネタイズ: Contextual PR（文脈連動型）のみ。嘘の営業時間や不自然なバナー広告は厳禁

## 技術スタック
- **フレームワーク**: Next.js 16 + TypeScript strict + Tailwind CSS v4
- **テスト**: Jest + React Testing Library
- **ホスティング**: Vercel (nightchill-sr5g がプロダクション)
- **リポジトリ**: https://github.com/createriumstudio-cpu/nightchill
- **本番URL**: https://nightchill-sr5g.vercel.app

## Vercel環境変数(nightchill-sr5g)
| 変数名 | 用途 |
|--------|------|
| ANTHROPIC_API_KEY | AIプラン生成 |
| GOOGLE_PLACES_API_KEY | Google Places API |
| GOOGLE_MAPS_API_KEY | Google Maps API |
| ADMIN_PASSWORD | 管理画面ログイン（値: taas1111）|

## 本番ページ構成
| URL | 説明 | 状態 |
|------|--------|-------|
| / | ホームページ | ✅ 稼働中 |
| /features | 特集一覧（ヒーロー画像付きカード）| ✅ 稼働中（7記事）|
| /features/ebisu-night-date | 恵比寿ナイトデート詳細 | ✅ 稼働中 |
| /features/shibuya-casual-date | 渋谷カジュアルデート詳細 | ✅ 稼働中 |
| /features/omotesando-sophisticated-date | 表参道デート詳細 | ✅ 稼働中 |
| /features/roppongi-premium-night | 六本木プレミアムナイト詳細 | ✅ 稼働中 |
| /features/ginza-luxury-date | 銀座ラグジュアリーデート詳細 | ✅ 稼働中 |
| /features/nakameguro-canal-date | 中目黒キャナルデート詳細 | ✅ 稼働中 |
| /features/daikanyama-stylish-date | 代官山スタイリッシュデート詳細 | ✅ 稼働中 |
| /plan → /results | AIデートプラン生成 | ✅ 稼働中 |
| /admin/login | 管理画面ログイン | ✅ 稼働中 |
| /admin | 管理画面ダッシュボード | ✅ 稼働中（読み取り専用）|

*Vercelのサーバーレス環境はファイルシステムが読み取り専用のため、CRUD書き込み操作は動作しません。将来的にVercel KV/Postgresへの移行が必要です。

## 画像について
- ヒーロー画像は **Gemini 3.1 Nano Banana Pro** で生成（フォトリアル）
- 画像ファイルは `public/images/` に格納
- 現在の画像:
  - ebisu-night-date-hero.png (993KB) - 恵比寿イタリアン路地
  - shibuya-casual-date-hero.png (1011KB) - 渋谷カフェカップル
  - omotesando-date-hero.png (991KB) - 表参道並木道カップル
  - roppongi-night-date-hero.png (826KB) - 六本木ルーフトップバー+東京タワー
  - ginza-luxury-date-hero.png - 銀座並木通りラグジュアリーカップル
  - nakameguro-canal-date-hero.png - 中目黒キャナル沿いカフェカップル
  - daikanyama-stylish-date-hero.png - 代官山スタイリッシュカップル
- 画像生成時のプロンプトのコツ:
  - **英語で記述**（日本語だとイラスト調になる）
  - カメラ設定明記: "Shot on Sony A7IV, 35mm f/1.4 lens"
  - 路地の左右は異なる店舗を明示的に指定
  - 日本人モデルは "clearly Japanese" と明記
  - "NO text, NO watermarks, NO logos" を必ず含める
  - **Google CDN URL(lh3.googleusercontent.com)は非公開** → 必ずGitHubにアップロード

## 開発ワークフロー
1. mainブランチは保護されている → コード変更はPR経由
2. ブランチ作成 → コミット → PR作成 → CI(4チェック)パス → マージ
3. マージ後Vercelが自動デプロイ
4. ドキュメントファイル(HANDOFF.md等)はmainに直接コミット可能な場合あり

## PR履歴
- PR #1-#13: プロジェクト初期セットアップ〜JSON解析修正
- PR #14: Feature pages + UGC embeds
- PR #15: Header added to feature pages
- PR #16: Remove "AI" wording from feature page CTAs
- PR #17: Remove "AI" wording from homepage + fix test
- PR #18: Add hero images to feature pages (Unsplash placeholder)
- PR #19: Admin panel with JSON data store + CRUD API
- PR #20: Nanobanana Pro hero images (ebisu + shibuya) + local paths
- PR #21: Omotesando + Roppongi feature articles + hero images
- PR #22: Ginza + Nakameguro + Daikanyama feature articles + hero images

## 重要な制約
- Google Places APIデータ = **絶対改変不可のファクト**
- UGC embeds: 公式プラットフォームembed APIのみ使用（法的要件）
- PR/広告挿入: ON/OFF切替可能（CONTEXTUAL_PR_ENABLED環境変数）
- ユーザー向けテキストに「AI」の文言は使わない
- テストファイルはユーザー向けテキスト変更時に必ず更新
- layout.tsxにHeaderは含まない → 各ページで個別にimport

## NotebookLM
- ノートブック: nightchill コアコンセプト
- 8ソース登録済み（要件定義、技術仕様、進捗記録等）
- URL: https://notebooklm.google.com/notebook/b5fca57c-0385-4064-9188-0f0343032e16

## 次のステップ（優先順）
1. ✅ 追加エリア特集（銀座、中目黒、代官山）+ 画像生成
2. ❌ 各スポットのリアルSNS投稿URL追加
3. ❌ Vercel KV/Postgres移行（管理画面の書き込み有効化）
4. ❌ 国内旅行・海外旅行カテゴリ追加
