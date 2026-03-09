# futatabito (旧: nightchill)

全国10都市対応のデートプランAI。「どこに行くか」ではなく「どうデートするか」を提案する。
キャッチコピー: また"どこでもいい"って言わせたくない。
サブコピー: ふたりが楽しめる場所を、AIが30秒で見つける。

注意: GitHubリポジトリ名・Vercelプロジェクト名は「nightchill」のまま（インフラ変更リスク回避）。ユーザー向け表示のみ「futatabito」を使用。

## Quick Start

npm install
cp .env.example .env.local
npm run dev

## インフラ

- ドメイン: futatabito.com (お名前.com, ID: 56570202, 有効期限: 2027/03/08)
- DNS: お名前.com (01-04.dnsv.jp)
- A: @ → 216.150.1.1
- CNAME: www → bb10f4715a198941.vercel-dns-017.com
- Vercel: nightchill-sr5g (createriumstudio-cpus-projects)
- 本番URL: https://www.futatabito.com (futatabito.com → 307 redirect → www.futatabito.com)
- DB: Neon PostgreSQL (futatabito-db, project: twilight-darkness-40445586)
- Google Cloud: cobalt-broker-488519-c5 (Maps Platform Starter plan, $100/mo)

## Commands

npm run dev, npm run build, npm run lint, npm test, npx tsc --noEmit

## Architecture

src/app/ — Next.js App Router (layout.tsx, page.tsx, [city]/page.tsx, [city]/features/page.tsx, plan/, results/, features/, about/, privacy/, en/, admin/, error.tsx, not-found.tsx, api/, globals.css, sitemap.ts, robots.ts)
src/components/ — Header.tsx, Footer.tsx, WeeklyPicksSection.tsx, FeaturedPicks.tsx, JsonLd.tsx, SpotPhoto.tsx, SponsoredSpotCard.tsx, ContextualPRSection.tsx, LanguageSwitcher.tsx, ProductRecommendation.tsx, ReservationAffiliate.tsx
src/lib/ — types.ts, ai-planner.ts, planner.ts, cities.ts, env.ts, gemini-search.ts, google-places.ts, google-maps.ts, plan-encoder.ts, contextual-pr.ts, features.ts, db.ts, schema.ts, i18n.ts, weekly-feature-generator.ts, admin-auth.ts, products.ts, affiliate.ts, stripe.ts
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

注意: 事前検索(preSearch)は廃止済み。店舗検索は Gemini Google Search grounding で行い、写真は Google Places API (Place Photos) で取得。

## Key Design Decisions

- AI + テンプレート二段構え（フォールバック）
- sessionStorage保存（タブ閉じるまで保持）
- レート制限: 10リクエスト/分/IP
- 入力サニタイズ: HTMLタグ除去 + 文字数制限
- 結果画面: 服装アドバイス・注意ポイントは表示しない（AI出力のスリム化のため削除済み）
- 店舗検索: Gemini Google Search grounding で実在店舗データを取得。写真: Google Places API (Place Photos) で GBP 実写真を表示
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
- GOOGLE_PLACES_API_KEY — Google Places API (New) — Maps Platform Starter plan ($100/mo) で有効。Place Details + Place Photos で実店舗データ・写真を取得
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

### 地雷7: Google Places API の BILLING_DISABLED → 解決済み
- 症状: Google Places API が 403 エラーを返していた
- 原因: Google Cloud の課金が無効化されていた (BILLING_DISABLED)
- 解決: Maps Platform Starter plan ($100/mo) を有効化。Place Details + Place Photos が正常動作
- 現状: Gemini Google Search grounding で店舗データ取得 + Google Places API で GBP 写真取得のハイブリッド構成
- ファイル: src/lib/gemini-search.ts, src/lib/google-places.ts
- 注意: regularOpeningHours フィールドは取得しない（コスト最適化）

### 地雷9: アフィリエイト都市マッチングで city ID と city name の不一致
- 症状: ReservationAffiliate が提携店舗を一切表示しない
- 原因1: 結果画面が location（エリア名 "渋谷, 新宿"）を city として渡していた
- 原因2: findAffiliateVenues が v.city === city の完全一致のみで、city ID ("tokyo") と city name ("東京") の変換をしていなかった
- 対策: (1) planContext に city ID を保存し結果画面で使用 (2) findAffiliateVenues で cities.ts を使い ID/name 両方でマッチング
- ファイル: src/app/plan/page.tsx, src/app/results/page.tsx, src/lib/affiliate.ts
- 禁止: city パラメータに location（エリア名）を渡さない。必ず city ID を使う

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
自社商材の文脈連動型レコメンド + EC決済 + 提携店舗予約アフィリエイトシステム

### 収益チャネル（3本柱）
1. **自社EC** — ブレスケア・会話カードなどのデート関連グッズをStripe決済で販売
2. **予約アフィリエイト** — 提携店舗の予約リンク経由でアフィリエイト収益（ホットペッパー・一休・食べログ等）
3. **コンテキストPR** — スポンサー店舗の文脈連動型紹介（CONTEXTUAL_PR_ENABLED=trueで有効化）

### ファイル構成
- src/lib/products.ts — 商品マッチングロジック (findRecommendedProducts, getProductBySlug, getActiveProducts)
- src/lib/affiliate.ts — 予約アフィリエイトリンク生成 + 提携店舗コンテキストマッチング (findAffiliateVenues, buildAffiliateLink, getProviderLabel)
- src/lib/stripe.ts — Stripe決済クライアント + 注文/予約番号生成
- src/components/ProductRecommendation.tsx — 結果画面用の文脈連動型商品レコメンドUI
- src/components/ReservationAffiliate.tsx — 結果画面用の予約アフィリエイトレコメンドUI

### データベーステーブル (schema.ts)
- products — 自社商材（ブレスケア、会話カード等）。targetOccasions/targetMoods/targetBudgetsでコンテキストマッチング
- orders — 注文管理。Stripe連携（stripeSessionId, stripePaymentIntentId）
- partnerVenues — 提携店舗マスター。エリア/都市/カテゴリ + affiliateUrl/affiliateProvider + targetOccasions/targetMoodsでコンテキストマッチング
- reservations — 予約管理。提携店舗への予約リクエスト

### 予約アフィリエイト

#### 仕組み
1. 管理者がpartnerVenuesにaffiliateUrl（アフィリエイトリンク）とaffiliateProvider（プロバイダー名）を登録
2. 結果画面でReservationAffiliateコンポーネントがcity + occasion + moodでマッチングリクエスト
3. 合致する提携店舗があればアフィリエイトリンク付きカードを表示
4. リンクにはUTMパラメータ（utm_source=futatabito, utm_medium=referral, utm_campaign=date-plan）を自動付与
5. ユーザーがリンク経由で予約 → アフィリエイト収益

#### 対応プロバイダー (AffiliateProvider)
- hotpepper — ホットペッパーグルメ
- ikyu — 一休.com レストラン
- tabelog — 食べログ
- otonamie — OZmall
- other — その他予約サイト

#### マッチングスコア
- occasion + mood マッチ: スコア2（「このデートにぴったりのお店」）
- occasion のみマッチ: スコア1（「このシーンにおすすめ」）
- mood のみマッチ: スコア1（「今の雰囲気にぴったり」）
- city マッチのみ: スコア0.5（「{city}のおすすめ店」）

#### 提携店舗登録
POST /api/admin/partner-venues に以下を追加:
- affiliateUrl: アフィリエイトリンクURL（プロバイダーが発行するトラッキングURL）
- affiliateProvider: "hotpepper" | "ikyu" | "tabelog" | "otonamie" | "other"
- targetOccasions: マッチング対象のoccasion配列
- targetMoods: マッチング対象のmood配列

### API
- /api/products — 公開商品一覧 or コンテキストマッチング（occasion/mood/budgetパラメータ）
- /api/products/[slug] — 商品詳細
- /api/checkout — Stripeチェックアウトセッション作成
- /api/webhook/stripe — Stripe Webhook（checkout.session.completed処理）
- /api/reservations — 予約作成
- /api/affiliate-venues — 文脈連動型アフィリエイト店舗レコメンド（city/occasion/moodパラメータ）
- /api/admin/products — 商品CRUD（管理者認証必須）
- /api/admin/products/[id] — 商品個別管理
- /api/admin/partner-venues — 提携店舗CRUD（affiliateUrl/affiliateProvider/targetOccasions/targetMoods対応）
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

結果画面でReservationAffiliateコンポーネントが/api/affiliate-venuesへマッチングリクエスト。
マッチ度: occasion+mood(2) > occasion or mood(1) > cityのみ(0.5)

### 表示ルール
- アフィリエイトリンクには rel="sponsored" を必ず付与
- マッチ0件の場合はセクション自体を非表示（バナー広告は厳禁）
- 「PR: 提携店舗のご紹介です」の注記を表示
- 共有ビューでは非表示（自分で生成したプランのみ表示）

### 環境変数
- STRIPE_SECRET_KEY — Stripe決済（未設定時は決済機能無効）
- STRIPE_WEBHOOK_SECRET — Stripe Webhook署名検証

## 📊 運用モニタリング（GA4 + アフィリエイト確認方法）

URL: https://analytics.google.com/analytics/web/#/p{プロパティID}/reports/

測定ID: G-272CBN32K5

#### 見るべき指標（週1回程度）

1. **ユーザー数・セッション数**: レポート > リアルタイム or ユーザー > 概要
1. **プラン生成数**: レポート > エンゲージメント > イベント → `page_view` で `/results` ページのビュー数を確認
1. **流入元**: レポート > 集客 > トラフィック獲得 → どこからユーザーが来ているか
1. **離脱ページ**: レポート > エンゲージメント > ページとスクリーン → 直帰率が高いページを確認

#### アフィリエイトクリック確認

* アフィリエイトリンクのUTMパラメータ: `utm_source=futatabito&utm_medium=referral&utm_campaign=date-plan`
* GA4では現状イベントトラッキング未設定のため、クリック数はホットペッパー側で確認
* 将来的にGA4へのクリックイベント送信を追加すると計測可能

### ホットペッパーアフィリエイトのレポート確認

* partner_venuesテーブルに登録済み店舗（6件）のaff URLへのクリックが計測される
* ホットペッパーグルメアフィリエイト管理画面でクリック数・成約数を確認
* 成約（予約完了）があると報酬が発生

### Vercelのエラー確認

URL: https://vercel.com/createriumstudio-cpus-projects/nightchill-sr5g/logs

* `Functions` タブ → API Route のエラーログ
* `/api/plan` のエラーが多い場合はGemini/Anthropic APIキーや残高を確認

---

## 🏁 現在のサイト状態（2026-03-10 時点）

### スコアサマリー

| 視点 | スコア | 状態 |
|------|--------|------|
| UX | 8/10 | 短期タスク全完了 |
| 管理・運用 | 8/10 | 短期タスク全完了 |
| マネタイズ | 6/10 | 短期タスク全完了 |

### 稼働中の収益化機能

* **ReservationAffiliateコンポーネント**: プラン結果画面でhotpepper提携6店舗を表示
* **partner_venuesテーブル**: 6件登録済み（銀座レカン, ポール・ボキューズ ミュゼ, ナチュラルハーモニーの農レストラン, XEX TOKYO, 鉄板焼銀水, クレール表参道）

### 自動化済みの運用

* **BlogAffiliateコンポーネント**: ブログ記事末尾 + 特集ページ末尾でアフィリエイト表示
* **週次コンテンツ自動更新**: 毎週月曜 9:00 JST に Cron で全国2-3都市の特集記事を自動生成・DB保存
* **GA4計測**: layout.tsx で NEXT_PUBLIC_GA4_ID=G-272CBN32K5 を使いページビュー自動計測
* **コストアラート**: Anthropic $30/$50、Gemini ¥1,500 でメール通知

---

## 🔮 今後の開発方針（中期・長期）

### 中期（次に着手すべき順）

1. **partner_venues追加** — hotpepper提携店舗を追加登録するだけで収益機会が増える。コード変更不要。Neon SQL Editorで INSERT するだけ。
1. **GA4クリックイベント実装** — アフィリエイトリンクのクリックをGA4に送信する（BlogAffiliate.tsx / ReservationAffiliate.tsx に onClick で gtag('event', 'affiliate_click') を追加）
1. **簡易ログイン（Google OAuth）** — /api/auth にNextAuth.js追加。プラン保存履歴でリピート利用を促進
1. **フリーミアム化** — 月額480〜980円のプレミアムプラン（PDF保存・予約リンク付き）

### 長期

1. **スポンサー直接契約** — 飲食店・ホテルとの直接契約（営業・交渉が必要）
1. **Google Maps連携ルート表示** — 徒歩ルートの可視化（現在は静的地図のみ）

---

## 🚨 バグ対応フロー

### よくある症状と対処法

| 症状 | 確認場所 | 対処 |
|------|---------|------|
| プランが生成されずテンプレートになる | Vercel Logs > /api/plan | Gemini/Anthropic APIキー・残高確認 |
| 店舗写真が表示されない | Vercel Logs > /api/place-photo | Google Places APIキー・課金確認 |
| アフィリエイトが表示されない | /api/affiliate-venues?city=tokyo&occasion=anniversary&mood=romantic で直接確認 | partner_venuesテーブルのデータ・city IDの一致確認 |
| 週次記事が生成されない | Vercel > Settings > Cron Jobs | CRON_SECRET / ANTHROPIC_API_KEY 確認 |
| 特集ページが古いまま | ISRキャッシュ（1時間）なので待つ | 急ぎなら Vercel > Deployments > Redeploy |
| TypeScriptエラー | npx tsc --noEmit | エラー内容に従って修正 |

### 緊急時の連絡先・ダッシュボード

* Vercel: https://vercel.com/createriumstudio-cpus-projects/nightchill-sr5g
* Neon DB: https://console.neon.tech/app/projects/twilight-darkness-40445586
* Google Cloud: https://console.cloud.google.com/home/dashboard?project=cobalt-broker-488519-c5
* Anthropic Console: https://console.anthropic.com/settings/limits
* GA4: https://analytics.google.com/analytics/web/

---

## 🗝️ 重要データ一覧

| 項目 | 値 |
|------|-----|
| ドメイン | futatabito.com（有効期限: 2027/03/08） |
| Vercelプロジェクト | nightchill-sr5g |
| GA4測定ID | G-272CBN32K5 |
| Vercel環境変数（GA4） | NEXT_PUBLIC_GA4_ID と NEXT_PUBLIC_GA_MEASUREMENT_ID（両方設定済み） |
| Neon DB project | twilight-darkness-40445586 (futatabito-db) |
| Google Cloud project | cobalt-broker-488519-c5 |
| Anthropicアラート閾値 | $30 / $50 |
| AIプライマリ | Gemini 2.5 Flash |
| AIフォールバック | Claude Sonnet 4.6 |
| Geminiアラート閾値 | ¥1,500（50%/90%/100%通知） |
| partner_venues登録数 | 6件（hotpepper、東京） |
