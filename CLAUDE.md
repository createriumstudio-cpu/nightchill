# futatabito (旧: nightchill)

全国10都市対応のデートプランAI。「どこに行くか」ではなく「どうデートするか」を提案する。
キャッチコピー: 「失敗しない」を、ふたりの自信に。
サブコピー: デートの"どこ行く？"を、30秒で解決。

注意: GitHubリポジトリ名・Vercelプロジェクト名は「nightchill」のまま（インフラ変更リスク回避）。ユーザー向け表示のみ「futatabito」を使用。

## Quick Start

npm install
cp .env.example .env.local
npm run dev

## Commands

npm run dev, npm run build, npm run lint, npm test, npx tsc --noEmit

## Architecture

src/app/ — Next.js App Router (layout.tsx, page.tsx, [city]/page.tsx, [city]/features/page.tsx, plan/, results/, features/, error.tsx, not-found.tsx, api/plan/, globals.css)
src/components/ — Header.tsx, Footer.tsx
src/lib/ — types.ts, ai-planner.ts, planner.ts, cities.ts, env.ts, google-places.ts, google-maps.ts, plan-encoder.ts, contextual-pr.ts
src/data/ — features.json（特集データ）

## Data Flow

フォーム入力（都市選択 + エリア選択）→ POST /api/plan → AI生成 or テンプレート → sessionStorage → 結果表示

## 都市システム (cities.ts)

- 全国10都市: 東京, 横浜, 大阪, 京都, 名古屋, 福岡, 金沢, 神戸, 仙台, 広島
- CityData: id(スラッグ), name, searchName, description, areas(エリアプリセット)
- フォームで都市選択 → エリアプリセットが動的に切替
- PlanRequest.city でAIプランナー・テンプレートプランナーに都市情報を渡す
- 都市追加: cities.ts の CITIES 配列に CityData を追加するだけ

## URL階層 (Phase 2)
- / — トップページ
- /[city] — 都市別ランディングページ（10都市分、generateStaticParams）
- /[city]/features — 都市別特集一覧ページ（features.jsonのareaフィルタ）
- /plan?city=xxx — デートプラン作成（都市プリセレクト対応）
- /features — 全特集一覧
- /features/[slug] — 特集記事詳細
- sitemap.ts: 全都市LP + 全都市features + feature記事詳細を自動生成

## AI生成フロー (ai-planner.ts)

1. Contextual PR取得
2. Claude API呼び出し（max_tokens: 768, リトライ最大2回）— SYSTEM_PROMPTは「日本全国のデートプランニングの専門家」
3. タイムライン店舗名でGoogle Places検索（Post-search）→ ファクトデータ付与
4. 徒歩ルート取得（最初と2番目の店舗間）

注意: 事前検索(preSearch)は廃止済み。AIが生成した店舗名を使ったPost-searchのみ。

## Key Design Decisions

- AI + テンプレート二段構え（フォールバック）
- sessionStorage保存（タブ閉じるまで保持）
- レート制限: 10リクエスト/分/IP
- 入力サニタイズ: HTMLタグ除去 + 文字数制限
- 結果画面: 服装アドバイス・注意ポイントは表示しない（AI出力のスリム化のため削除済み）
- Places API: regularOpeningHoursフィールドは取得しない（コスト最適化）
- 全国10都市対応: 都市マスターデータ(cities.ts) + フォームの都市/エリア2段選択
- UGC/SNS機能は全削除済み: SocialEmbed, UgcSection, FeatureSpotEmbed, features.tsは廃止。ユーザー外部流出防止のため

## Adding a New Feature

- シチュエーション追加: types.ts → planner.ts → route.ts → plan/page.tsx
- 都市追加: src/lib/cities.ts の CITIES 配列に CityData オブジェクトを追加
- ページ追加: src/app/[name]/page.tsx + Header/Footer使用
- 既存ページ: /about（運営者情報）, /privacy（プライバシーポリシー）
- sitemap.ts + robots.ts でSEO基盤構築済み
- API追加: src/app/api/[name]/route.ts + レート制限 + sanitizeText

## Testing

- src/lib/__tests__/planner.test.ts, ai-planner.test.ts
- src/app/__tests__/page.test.tsx

## Environment Variables

- ANTHROPIC_API_KEY (Vercel nightchill-sr5g) — Claude API
- ANTHROPIC_MODEL — デフォルト: claude-sonnet-4-6
- GOOGLE_PLACES_API_KEY — Google Places API
- GOOGLE_MAPS_API_KEY — Google Maps Embed + Directions
- NEXT_PUBLIC_SITE_URL — OGP/canonical URL
- CONTEXTUAL_PR_ENABLED — PR ON/OFF（未設定）

## CI/CD

GitHub Actions: Lint → Type check → Test → Build

## !! 重要: 過去に踏んだ地雷と教訓 !!

### 地雷1: Claude AIのJSON出力が壊れる
- 症状: /api/plan が常にテンプレートフォールバック
- 原因: JSX風パターンや制御文字がJSON.parse()を壊す
- 防御策: SYSTEM_PROMPT制約 + sanitizeJsonResponse + cleanAIResponseText + robustJsonParse(4段階) + extractFieldsWithRegex
- 禁止: SYSTEM_PROMPTルール削除、robustJsonParse簡略化、cleanAIResponseText削除

### 地雷2: GitHub Web UIでのTSX編集
- 症状: JSXの閉じタグが破損する
- 原因: CodeMirrorが日本語含むTSXの閉じタグを破損
- 対策: Codespaces またはローカル環境で編集。Web UIは使わない

### 地雷3: Vercel 2プロジェクト問題
- 本番は nightchill-sr5g のみ。環境変数は必ずこちらに設定。

### 地雷4: npm ci vs npm install
- CIではnpm install を使用（npm ciではない）。

### 地雷5: AI出力フィールドの肥大化
- 症状: トークン消費が多く、レスポンスが遅い
- 原因: fashionAdvice, warnings, conversationTopicsをAIに生成させていた
- 対策: SYSTEM_PROMPTからこれらの指示を削除し、JSON定義もスリム化。max_tokensを768に削減
- 禁止: 不要なフィールドをAI出力に追加しない

### 地雷6: UGC/SNS埋め込みによるユーザー外部流出
- 症状: Instagram/TikTok埋め込みからユーザーが外部サイトへ離脱
- 原因: SocialEmbed, UgcSection, FeatureSpotEmbed でSNS埋め込みを提供していた
- 対策: UGC/SNS関連コンポーネント・機能を全削除（PR #84）
- 禁止: SNS埋め込み・外部リンク導線の再追加。features.jsonのinstagramHashtag/tiktokHashtag/embedsフィールドも削除済み

### 地雷7: GitHub Web Editor の CodeMirror autocomplete
- 症状: JSXの閉じタグが重複する（例: </Link>Link>）
- 原因: GitHub Web Editor (github.com/.../edit/) でTSXファイルを編集すると、CodeMirrorのautocompleteが閉じタグ名を重複挿入する
- 対策: (1) execCommand('insertText') で一括挿入 (2) Clipboard API + cmd+v でペースト (3) cmd+a → Backspace で全選択削除してから貼り付け
- 禁止: GitHub Web Editor で type アクションを使ったJSX/TSXの直接入力

## デバッグチートシート

- プランがテンプレートに落ちる → Vercel Logs → POST /api/plan確認
- 店舗情報表示されない → GOOGLE_PLACES_API_KEY確認
- 地図表示されない → GOOGLE_MAPS_API_KEY + Maps Embed API有効化確認

## コンセプト遵守チェックリスト

- ファクトデータをAIに改変させていないか？
- PR/広告はContextual方式か？（バナー広告は厳禁）
- 「Where」ではなく「How」を提案しているか？
- 「点」ではなく「線」を重視しているか？
- ブランド名は「futatabito」を使用しているか？
- キャッチコピーは「「失敗しない」を、ふたりの自信に。」か？
- SNS埋め込み・外部リンク導線を追加していないか？（ユーザー流出防止）
- 都市追加時にcities.tsのCITIES配列に正しいCityDataを定義したか？


## 週次自動更新システム (Phase 3)

B案: リアルタイム週次更新 — 「今週のおすすめデートプラン」

### 仕組み
- Vercel Cron: 毎週月曜 0:00 UTC (= 9:00 JST) に自動実行
- Google Places API (New) で各都市の注目スポットを検索
- Anthropic Claude で特集記事を自動生成
- Neon Postgres (features table) に保存

### ファイル構成
- src/lib/weekly-feature-generator.ts — コア生成ロジック (searchTrendingSpots + generateArticleWithAI + runWeeklyBatch)
- src/app/api/cron/weekly-features/route.ts — Cron エンドポイント (CRON_SECRET認証)
- src/lib/features.ts — getWeeklyFeatures(cityName?, limit) + getLatestWeeklyFeatures(limit)
- vercel.json — cron設定 ("0 0 * * 1")

### カテゴリ (WeeklyCategory)
- new-spots: 注目の新店・話題のスポット
- seasonal-menu: 季節限定メニュー・期間限定イベント
- classic-date: この季節の外さないデートプラン

### バッチ実行
- ランダムに2-3都市を選択
- 各都市から1-2カテゴリを選択
- API レート制限対策: 各生成間に2秒待機
- slug形式: {city.id}-{category}-{weekBatch} (例: tokyo-new-spots-2026-w10)

### 環境変数
- CRON_SECRET — Cron認証トークン（未設定時は認証なしで動作）
- ANTHROPIC_API_KEY — 記事生成（未設定時はテンプレートフォールバック）
- GOOGLE_PLACES_API_KEY — スポット検索（未設定時は空配列）

### 手動実行
Vercel Settings > Cron Jobs > /api/cron/weekly-features > "Run" ボタン
