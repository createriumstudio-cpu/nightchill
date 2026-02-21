# futatabito (旧: nightchill)

デート視点の東京カルチャーガイド。「どこに行くか」ではなく「どうデートするか」を提案する。
キャッチコピー: ふたりの時間を、もっとおもしろく。

注意: GitHubリポジトリ名・Vercelプロジェクト名は「nightchill」のまま（インフラ変更リスク回避）。ユーザー向け表示のみ「futatabito」を使用。

## Quick Start

npm install
cp .env.example .env.local
npm run dev

## Commands

npm run dev, npm run build, npm run lint, npm test, npx tsc --noEmit

## Architecture

src/app/ — Next.js App Router (layout.tsx, page.tsx, plan/, results/, error.tsx, not-found.tsx, api/plan/, globals.css)
src/components/ — Header.tsx, Footer.tsx
src/lib/ — types.ts, ai-planner.ts, planner.ts, env.ts

## Data Flow

フォーム入力 → POST /api/plan → AI生成 or テンプレート → sessionStorage → 結果表示

## Key Design Decisions

- AI + テンプレート二段構え（フォールバック）
- - sessionStorage保存（タブ閉じるまで保持）
  - - レート制限: 10リクエスト/分/IP
    - - 入力サニタイズ: HTMLタグ除去 + 文字数制限
     
      - ## Adding a New Feature
     
      - シチュエーション追加: types.ts → planner.ts → route.ts → plan/page.tsx
      - ページ追加: src/app/[name]/page.tsx + Header/Footer使用
既存ページ: /about（運営者情報）, /privacy（プライバシーポリシー）
sitemap.ts + robots.ts でSEO基盤構築済み
      - API追加: src/app/api/[name]/route.ts + レート制限 + sanitizeText
     
      - ## Testing
     
      - src/lib/__tests__/planner.test.ts, ai-planner.test.ts
      - src/app/__tests__/page.test.tsx
     
      - ## Environment Variables
     
      - ANTHROPIC_API_KEY (Vercel nightchill-sr5g) — Claude API
      - ANTHROPIC_MODEL — デフォルト: claude-sonnet-4-6
      - GOOGLE_PLACES_API_KEY — Google Places API
      - GOOGLE_MAPS_API_KEY — Google Maps Embed + Directions
      - NEXT_PUBLIC_SITE_URL — OGP/canonical URL
      - CONTEXTUAL_PR_ENABLED — PR ON/OFF（未設定）
     
      - ## CI/CD
     
      - GitHub Actions: Lint → Type check → Test → Build
     
      - ## !! 重要: 過去に踏んだ地雷と教訓 !!
     
      - ### 地雷1: Claude AIのJSON出力が壊れる
      - 症状: /api/plan が常にテンプレートフォールバック
      - 原因: JSX風パターンや制御文字がJSON.parse()を壊す
      - 防御策: SYSTEM_PROMPT制約 + sanitizeJsonResponse + cleanAIResponseText + robustJsonParse(4段階) + extractFieldsWithRegex
      - 禁止: SYSTEM_PROMPTルール削除、robustJsonParse簡略化、cleanAIResponseText削除
     
      - ### 地雷2: GitHub Web UIでのTSX編集
      - 症状: JSXの閉じタグが破損する
      - 原因: CodeMirrorが日本語含むTSXの閉じタグを破損
      - 対策: Codespaces またはローカル環境で編集。Web UIは使わない
     
      - ### 地雷3: Vercel 2プロジェクト問題
      - 本番は nightchill-sr5g のみ。環境変数は必ずこちらに設定。
     
      - ### 地雷4: npm ci vs npm install
      - CIではnpm install を使用（npm ciではない）。
     
      - ## デバッグチートシート
     
      - プランがテンプレートに落ちる → Vercel Logs → POST /api/plan確認
      - 店舗情報表示されない → GOOGLE_PLACES_API_KEY確認
      - 地図表示されない → GOOGLE_MAPS_API_KEY + Maps Embed API有効化確認
     
      - ## コンセプト遵守チェックリスト
     
      - - ファクトデータをAIに改変させていないか？
        - - UGCは公式embed APIのみか？
          - - PR/広告はContextual方式か？（バナー広告は厳禁）
            - - 「Where」ではなく「How」を提案しているか？
              - - 「点」ではなく「線」を重視しているか？
                - - ブランド名は「futatabito」を使用しているか？
                  - - キャッチコピーは「ふたりの時間を、もっとおもしろく。」か？
                    - - ユーザー向けテキストに「AI」の文言は含まれていないか？
