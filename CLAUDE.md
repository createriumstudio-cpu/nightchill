# nightchill

AIデートコンシェルジュサービス。「どこに行くか」ではなく「どうデートするか」を提案する。

## Quick Start

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY を設定
npm run dev                   # http://localhost:3000
```

## Commands

- `npm run dev` — 開発サーバー起動
- `npm run build` — プロダクションビルド
- `npm run lint` — ESLint実行
- `npm test` — 全テスト実行
- `npm test -- --watch` — テストをwatch実行
- `npx tsc --noEmit` — 型チェックのみ

## Architecture

```
src/
├── app/                    # Next.js App Router (ページ)
│   ├── layout.tsx          # ルートレイアウト (SEO, OGP, JSON-LD)
│   ├── page.tsx            # LP (ランディングページ)
│   ├── plan/page.tsx       # フォーム入力画面
│   ├── results/page.tsx    # プラン結果表示画面
│   ├── error.tsx           # エラーバウンダリ
│   ├── not-found.tsx       # 404ページ
│   ├── api/plan/route.ts   # POST /api/plan (プラン生成API)
│   └── globals.css         # CSS変数 & Tailwind
├── components/             # 共通UIコンポーネント
│   ├── Header.tsx
│   └── Footer.tsx
└── lib/                    # ビジネスロジック
    ├── types.ts            # 型定義 (DatePlan, PlanRequest, etc.)
    ├── ai-planner.ts       # Claude API連携 (AI生成)
    ├── planner.ts          # テンプレートベース生成 (フォールバック)
    └── env.ts              # 環境変数バリデーション
```

## Data Flow

```
[フォーム入力] → POST /api/plan → [AI生成 or テンプレート] → [sessionStorage] → [結果表示]
```

1. `plan/page.tsx` でユーザーが入力 → `/api/plan` にPOST
2. `api/plan/route.ts` がバリデーション → AI or テンプレートでプラン生成
3. レスポンスを `sessionStorage` に保存
4. `results/page.tsx` が sessionStorage から読み取って表示

## Key Design Decisions

- **AI + テンプレートの二段構え**: APIキー未設定やAI障害時はテンプレートにフォールバック
- **sessionStorage**: プラン保存にsessionStorageを使用（ブラウザタブを閉じるまで保持）
- **レート制限**: インメモリMap（10リクエスト/分/IP）、5分ごとにクリーンアップ
- **入力サニタイズ**: HTMLタグ除去 + 文字数制限でXSS防止

## Adding a New Feature

### 新しいシチュエーション（Occasion）を追加する場合

1. `src/lib/types.ts` — `Occasion` 型と `occasionLabels` に追加
2. `src/lib/planner.ts` — `timelineTemplates`, `conversationTopicsByOccasion`, `warningsByOccasion`, `getTitleForPlan` に追加
3. `src/app/api/plan/route.ts` — `validOccasions` 配列に追加
4. `src/app/plan/page.tsx` — フォームの選択肢に追加

### 新しいページを追加する場合

1. `src/app/[page-name]/page.tsx` を作成
2. Header/Footerコンポーネントを使用してレイアウトを統一
3. 必要に応じて `layout.tsx` の metadata を拡張

### 新しいAPIエンドポイントを追加する場合

1. `src/app/api/[endpoint]/route.ts` を作成
2. レート制限が必要な場合は `api/plan/route.ts` のパターンを参考に
3. 入力バリデーションと `sanitizeText` を必ず適用

## Testing

テストファイルは `__tests__/` ディレクトリに配置:

- `src/lib/__tests__/planner.test.ts` — テンプレート生成テスト
- `src/lib/__tests__/ai-planner.test.ts` — AI生成のプロンプト構築テスト
- `src/app/__tests__/page.test.tsx` — LPコンポーネントテスト

新機能を追加する場合は対応するテストも追加すること。

## Environment Variables

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | AI生成時 | Claude APIキー。未設定の場合テンプレートにフォールバック |
| `ANTHROPIC_MODEL` | No | 使用するモデル名（デフォルト: `claude-sonnet-4-6`） |
| `NEXT_PUBLIC_SITE_URL` | No | OGP/canonical URL（デフォルト: `http://localhost:3000`） |

## CI/CD

GitHub Actions（`.github/workflows/ci.yml`）がPRとmainプッシュで自動実行:
- Lint → Type check → Test → Build
