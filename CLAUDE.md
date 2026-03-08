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

src/app/ — Next.js App Router (layout.tsx, page.tsx, [city]/page.tsx, [city]/features/page.tsx, plan/, results/, features/, about/, privacy/, en/, admin/, error.tsx, not-found.tsx, api/, globals.css, sitemap.ts, robots.ts)
src/components/ — Header.tsx, Footer.tsx, WeeklyPicksSection.tsx, FeaturedPicks.tsx, JsonLd.tsx, SpotPhoto.tsx, SponsoredSpotCard.tsx, ContextualPRSection.tsx, LanguageSwitcher.tsx
src/lib/ — types.ts, ai-planner.ts, planner.ts, cities.ts, env.ts, gemini-search.ts, google-places.ts, google-maps.ts, plan-encoder.ts, contextual-pr.ts, features.ts, db.ts, schema.ts, i18n.ts, weekly-feature-generator.ts, admin-auth.ts
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

## AI生成フロー (gemini-planner.ts / ai-planner.ts)

プライマリ: Gemini 2.5 Flash (gemini-planner.ts)
フォールバック: Anthropic Claude Sonnet (ai-planner.ts)
フォールバック順序: Gemini → Anthropic → テンプレート

1. Contextual PR取得
2. AI API呼び出し（リトライ最大2回）— SYSTEM_PROMPTは「日本全国のデートプランニングの専門家」
   - Geminiプランナーは Google Search grounding (google_search ツール) を有効化し、実在店舗を検索しながらプラン生成
3. タイムライン店舗名で Gemini Search grounding 検索（Post-search）→ ファクトデータ付与
   - batchSearchVenuesWithGemini() で複数店舗を1回のAPI呼び出しでまとめて検索
4. 徒歩ルート取得（最初と2番目の店舗間）

注意: 事前検索(preSearch)は廃止済み。Google Places API は BILLING_DISABLED のため Gemini Google Search grounding に移行済み。

## Key Design Decisions

- AI + テンプレート二段構え（フォールバック）
- sessionStorage保存（タブ閉じるまで保持）
- レート制限: 10リクエスト/分/IP
- 入力サニタイズ: HTMLタグ除去 + 文字数制限
- 結果画面: 服装アドバイス・注意ポイントは表示しない（AI出力のスリム化のため削除済み）
- 店舗検索: Gemini Google Search grounding で実在店舗データを取得（Google Places API は廃止）
- 全国10都市対応: 都市マスターデータ(cities.ts) + フォームの都市/エリア2段選択
- UGC/SNS機能は全削除済み: SocialEmbed, UgcSection, FeatureSpotEmbedは廃止。ユーザー外部流出防止のため（注: src/lib/features.tsはPhase 3週次更新システムで使用中）

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

- ANTHROPIC_API_KEY (Vercel nightchill-sr5g) — Claude API（フォールバック、optional）
- ANTHROPIC_MODEL — デフォルト: claude-sonnet-4-6
- GEMINI_API_KEY — Gemini API（プライマリAIプロバイダー）
- GEMINI_MODEL — デフォルト: gemini-2.5-flash
- GOOGLE_PLACES_API_KEY — Google Places API（廃止: BILLING_DISABLED。Gemini Search grounding に移行済み）
- GOOGLE_MAPS_API_KEY — Google Maps Embed + Directions
- NEXT_PUBLIC_SITE_URL — OGP/canonical URL
- CONTEXTUAL_PR_ENABLED — PR ON/OFF（未設定）
- STRIPE_SECRET_KEY — Stripe決済（未設定時は決済機能無効）
- STRIPE_WEBHOOK_SECRET — Stripe Webhook署名検証（本番必須）

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

### 地雷7: Google Places API の BILLING_DISABLED
- 症状: Google Places API が 403 エラーを返す
- 原因: Google Cloud の課金が無効化されている (BILLING_DISABLED)
- 対策: Gemini Google Search grounding (google_search ツール) で店舗データを取得する方式に移行
- ファイル: src/lib/gemini-search.ts（searchVenueWithGemini, batchSearchVenuesWithGemini, searchTrendingSpotsWithGemini）
- 禁止: Google Places API への依存を再追加しない。google-places.ts の VenueFactData 型定義のみ参照可

### 地雷8: GitHub Web Editor の CodeMirror autocomplete
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
- Gemini Google Search grounding で各都市の注目スポットを検索
- Anthropic Claude で特集記事を自動生成
- Neon Postgres (features table) に保存

### ファイル構成
- src/lib/weekly-feature-generator.ts — コア生成ロジック (generateArticleWithAI + runWeeklyBatch)
- src/lib/gemini-search.ts — Gemini Search grounding による店舗検索 (searchVenueWithGemini, batchSearchVenuesWithGemini, searchTrendingSpotsWithGemini)
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


### Phase 3 UI統合 (完了 — 2026-03-03)

#### 変更ファイル
- `src/lib/features.ts` — getAllFeatures()が静的JSON+DB週次記事をマージ。isWeeklyフラグ追加
- `src/app/features/page.tsx` — 「今週のおすすめ」+「定番エリアガイド」の2セクション構成。ISR 1時間
- `src/app/features/[slug]/page.tsx` — revalidate=3600 + dynamicParams=true
- `src/app/[city]/features/page.tsx` — 都市別週次記事表示。city.nameでのフィルタ対応

#### データフロー
1. getAllFeatures() → JSON静的記事(7件) + DB週次記事をマージして返す
2. getWeeklyFeatures(cityName?) → DBから週次記事のみ取得（静的slug除外）
3. getLatestWeeklyFeatures(limit) → 全都市の最新週次記事
4. ISR revalidate=3600 で1時間ごとに再生成

#### 表示構成
- /features → 「✨今週のおすすめ」(3カラム) + 「📖定番エリアガイド」(2カラム)
- /[city]/features → 「✨{city}の今週のおすすめ」+ 「📖定番エリアガイド」
- /features/[slug] → 静的・週次どちらも同じ詳細ページで表示

### 環境変数
- CRON_SECRET — Cron認証トークン（未設定時は認証なしで動作）
- ANTHROPIC_API_KEY — 記事生成（未設定時はテンプレートフォールバック）
- GEMINI_API_KEY — スポット検索（Gemini Search grounding）+ 記事生成フォールバック

### 手動実行
Vercel Settings > Cron Jobs > /api/cron/weekly-features > "Run" ボタン

## マネタイズ基盤 (Phase 4)

### 概要
自社商材の文脈連動型レコメンド + EC決済 + 提携店舗予約システム

### ファイル構成
- src/lib/products.ts — 商品マッチングロジック (findRecommendedProducts, getProductBySlug, getActiveProducts)
- src/lib/stripe.ts — Stripe決済クライアント + 注文/予約番号生成
- src/components/ProductRecommendation.tsx — 結果画面用の文脈連動型商品レコメンドUI

### データベーステーブル (schema.ts)
- products — 自社商材（ブレスケア、会話カード等）。targetOccasions/targetMoods/targetBudgetsでコンテキストマッチング
- orders — 注文管理。Stripe連携（stripeSessionId, stripePaymentIntentId）
- partnerVenues — 提携店舗マスター。エリア/都市/カテゴリでフィルタ
- reservations — 予約管理。提携店舗への予約リクエスト

### API
- /api/products — 公開商品一覧 or コンテキストマッチング（occasion/mood/budgetパラメータ）
- /api/products/[slug] — 商品詳細
- /api/checkout — Stripeチェックアウトセッション作成
- /api/webhook/stripe — Stripe Webhook（checkout.session.completed処理）
- /api/reservations — 予約作成
- /api/admin/products — 商品CRUD（管理者認証必須）
- /api/admin/products/[id] — 商品個別管理
- /api/admin/partner-venues — 提携店舗CRUD
- /api/admin/partner-venues/[id] — 提携店舗個別管理
- /api/admin/reservations — 予約一覧

### ページ
- /products — 商品カタログ（ISR 1時間）
- /products/[slug] — 商品詳細 + 購入ボタン
- /checkout/success — 購入完了
- /checkout/cancel — 購入キャンセル

### コンテキストマッチング
プラン生成時にsessionStorageに保存されるcontext（occasion/mood/budget）を使い、
結果画面でProductRecommendationコンポーネントが/api/productsへスコアリングリクエスト。
マッチ度: occasion+mood+budget全マッチ(3) > occasion+mood(2) > occasion or mood(1)

### 環境変数
- STRIPE_SECRET_KEY — Stripe決済（未設定時は決済機能無効）
- STRIPE_WEBHOOK_SECRET — Stripe Webhook署名検証
