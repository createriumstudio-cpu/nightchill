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


## !! 重要: 過去に踏んだ地雷と教訓 !!

このセクションは実際の障害から得た教訓です。引き継ぎ時に必ず読んでください。

### 地雷1: Claude AIのJSON出力が壊れる

**症状**: `/api/plan` が常にテンプレートフォールバックに落ちる
**ログ**: `AI plan generation failed, falling back to template` + `SyntaxError`

**原因**: Claude APIが生成するJSON文字列値にJSX風パターン (`{'\n'}`, `{' '}`) や
制御文字が混入し、`JSON.parse()` が失敗する。

**現在の防御策** (`ai-planner.ts`):
1. `SYSTEM_PROMPT` で文字列値を短く・1行に制約（最も効果的）
2. `sanitizeJsonResponse()` でmarkdownコードブロック・末尾カンマ除去
3. `cleanAIResponseText()` でJSX風パターン除去 + 制御文字エスケープ
4. `robustJsonParse()` で4段階フォールバック
5. `extractFieldsWithRegex()` で正規表現による個別フィールド抽出（最終手段）

**やってはいけないこと**:
- SYSTEM_PROMPT からJSON出力ルール（1行制約・50文字制約）を削除しないこと
- `robustJsonParse` の4段階フォールバックを簡略化しないこと
- `cleanAIResponseText` を削除しないこと（再発する）

**デバッグ方法**:
1. Vercel Runtime Logs でPOST `/api/plan` を確認
2. `AI response (attempt X, first 300 chars):` ログでAI出力を確認
3. `First JSON parse attempt failed:` ログでエラー位置を確認
4. `Context around error position:` ログで壊れた箇所を特定

### 地雷2: CodeMirrorでのコード編集時のエスケープ問題

**症状**: GitHub Web UIでファイル編集→JSコード注入時に正規表現が壊れる

**原因**: JavaScriptテンプレートリテラルを経由してCodeMirrorにコードを注入する際、
`\\` (バックスラッシュ) の多重エスケープで正規表現パターンが破損する。

**対策**:
- GitHubのCodeMirror経由でコード注入する場合、正規表現リテラル内の
  エスケープに特に注意（`\\s` → `\s`, `\\n` → `\n` になるか確認）
- 可能ならローカル開発環境でテストしてからPR作成

### 地雷3: Vercel 2プロジェクト問題

**症状**: デプロイ成功なのに変更が反映されない

**原因**: `nightchill` と `nightchill-sr5g` の2プロジェクトが同リポを参照。
本番は `nightchill-sr5g` のみ。環境変数はプロジェクトごとに別管理。

**対策**: 環境変数の設定は必ず `nightchill-sr5g` プロジェクト側で行う。

### 地雷4: npm ci と npm install の違い

**症状**: CIが失敗する

**原因**: package-lock.json とpackage.json のバージョン不一致。

**対策**: CI では `npm install`（`npm ci` ではなく）を使用。
`.github/workflows/ci.yml` を変更する際はこの点に注意。

## デバッグ手順チートシート

### 「プランがテンプレートに落ちる」場合
```
1. Vercel Logs (https://vercel.com) → nightchill-sr5g → Logs
2. POST /api/plan のリクエストを探す
3. ログメッセージを確認:
   - "AI response..." → AIは応答している。JSON解析の問題
   - "AI plan generation failed" → AI呼び出し自体が失敗
4. JSON解析エラーの場合:
   - "Context around error position" で壊れた箇所を確認
   - ai-planner.ts の cleanAIResponseText を強化
5. AI呼び出し失敗の場合:
   - ANTHROPIC_API_KEY がVercel環境変数に設定されているか確認
   - APIキーの有効期限・残高を確認
```

### 「店舗情報が表示されない」場合
```
1. Vercel Logs で External APIs に maps.googleapis.com があるか確認
2. ない場合: GOOGLE_PLACES_API_KEY が未設定
3. ある場合: Google Cloud Console でAPIが有効か確認
4. 403エラー: APIキーのリファラ制限を確認
```

### 「地図が表示されない」場合
```
1. ブラウザのDevToolsでiframeエラーを確認
2. GOOGLE_MAPS_API_KEY がVercel環境変数にあるか確認
3. Maps Embed API が Google Cloud で有効か確認
4. リファラ制限に nightchill-sr5g.vercel.app が含まれているか確認
```

## 環境変数の完全リスト（2026-02-20時点）

| 変数名 | 設定場所 | 必須 | 説明 |
|--------|----------|------|------|
| `ANTHROPIC_API_KEY` | Vercel (nightchill-sr5g) | AI生成時 | Claude APIキー |
| `ANTHROPIC_MODEL` | Vercel (nightchill-sr5g) | No | デフォルト: claude-sonnet-4-6 |
| `GOOGLE_PLACES_API_KEY` | Vercel (nightchill-sr5g) | 店舗情報 | Google Places API |
| `GOOGLE_MAPS_API_KEY` | Vercel (nightchill-sr5g) | 地図表示 | Google Maps Embed + Directions |
| `NEXT_PUBLIC_SITE_URL` | Vercel (nightchill-sr5g) | No | OGP/canonical URL |
| `CONTEXTUAL_PR_ENABLED` | 未設定 | No | Contextual PR ON/OFF (将来用) |

## コンセプト遵守チェックリスト

コードを変更する前に必ず確認:
- [ ] ファクトデータ（店名・住所・営業時間）をAIに改変させていないか？
- [ ] UGCは公式embed APIのみ使用しているか？（画像直DLは厳禁）
- [ ] PR/広告はContextual方式か？（バナー広告は厳禁）
- [ ] 「Where」ではなく「How」を提案しているか？
- [ ] 「点」ではなく「線」（1軒目→2軒目の動線）を重視しているか？
