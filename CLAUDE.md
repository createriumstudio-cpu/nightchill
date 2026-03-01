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

src/app/ — Next.js App Router (layout.tsx, page.tsx, plan/, results/, features/, error.tsx, not-found.tsx, api/plan/, globals.css)
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
