# futatabito 運用・開発ガイド

> 誰でもバグなく修正・拡張できるためのドキュメント

## 開発環境セットアップ

### Codespace（推奨）
1. https://github.com/codespaces でCodespace起動
2. Codespace名: "potential couscous"
3. ターミナルで `npm install` 実行
4. `.env.local` に以下を設定:
```
DATABASE_URL=postgresql://neondb_owner:npg_z0pbsIgxeYa2@ep-fragrant-sea-a1z0md8l-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
ANTHROPIC_API_KEY=（Vercel環境変数から取得）
GOOGLE_PLACES_API_KEY=（Vercel環境変数から取得）
GOOGLE_MAPS_API_KEY=（Vercel環境変数から取得）
ADMIN_PASSWORD=taas1111
CONTEXTUAL_PR_ENABLED=true
```

### コード変更ワークフロー
```bash
# 1. mainブランチを最新に
git checkout main && git pull origin main

# 2. 新ブランチ作成
git checkout -b fix/your-branch-name

# 3. コード変更

# 4. チェック実行（全て通ること）
npm run lint    # 0 errors必須
npm run build   # 成功必須
npm test        # 全テスト通過必須

# 5. コミット＆プッシュ
git add -A && git commit -m "fix: description" && git push -u origin fix/your-branch-name

# 6. GitHub上でPR作成 → CI通過確認 → マージ
```

## 重要な制約

### 絶対に守ること
- **mainブランチ直接pushは禁止** → 必ずPR経由
- **GitHub Web UIでのJSX編集は禁止** → CodeMirrorがタグを破壊する
- **layout.tsxにHeaderを含めない** → 各ページで個別import
- **GitHubリポジトリ名・Vercelプロジェクト名は「nightchill」のまま**
- **ユーザー向けテキストのみ「futatabito」を使用**
- **CIは `npm install` を使用**（npm ciではない）
- **テストファイルはユーザー向けテキスト変更時に必ず更新**

### API認証パターン（新規API作成時）
```typescript
// 正しいインポートパス
import { isAuthenticated } from "@/lib/admin-auth";  // ← 正しい
// import { isAuthenticated } from "@/lib/auth";      // ← 間違い

// 認証チェック
const authed = await isAuthenticated();  // 引数なし
if (!authed) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// DB接続
const db = getDb();
if (!db) {
  return NextResponse.json({ error: "Database not configured" }, { status: 500 });
}
```

### Window型宣言
- `src/components/UgcSection.tsx` に唯一の `declare global { interface Window }` がある
- 他のファイルで重複宣言しないこと

## ファイル構成

```
src/
├── app/
│   ├── page.tsx          # ホームページ（ヒーロー、特徴、HOW IT WORKS等）
│   ├── layout.tsx        # ルートレイアウト（FloatingChatButton含む）
│   ├── globals.css       # グローバルCSS（アニメーション含む）
│   ├── admin/            # 管理画面
│   │   ├── page.tsx      # 管理ダッシュボード
│   │   ├── features/     # 特集管理CRUD
│   │   ├── sponsored/    # PRスポット管理
│   │   └── ugc/          # UGC管理
│   ├── api/
│   │   ├── admin/        # 管理API
│   │   ├── chat/         # チャットAPI (route.ts)
│   │   ├── plan/         # プラン生成API
│   │   ├── sponsored/    # PRスポットAPI
│   │   └── ugc/          # UGC API
│   ├── chat/             # チャットページ
│   ├── en/               # 英語版ページ
│   ├── features/         # 特集一覧・詳細
│   ├── plan/             # デートプラン生成
│   ├── about/            # 運営者情報
│   └── privacy/          # プライバシーポリシー
├── components/
│   ├── Header.tsx        # ヘッダー（各ページでimport）
│   ├── Footer.tsx        # フッター
│   ├── ChatUI.tsx        # チャットUI（IME対応済み）
│   ├── FloatingChatButton.tsx  # フローティング相談ボタン
│   ├── UgcSection.tsx    # UGC埋め込みセクション
│   ├── TikTokEmbed.tsx   # TikTok埋め込み
│   └── InstagramEmbed.tsx # Instagram埋め込み
├── lib/
│   ├── db.ts             # DB接続
│   ├── schema.ts         # Drizzleスキーマ定義
│   └── admin-auth.ts     # 管理認証
└── data/                 # 静的データ
```

## 管理画面の使い方

### UGC投稿の追加手順
1. https://nightchill-sr5g.vercel.app/admin にログイン
2. 「UGC投稿」セクションへ移動
3. 入力項目:
   - **プラットフォーム**: tiktok または instagram
   - **投稿URL**: 元の投稿URL
   - **埋め込みHTML**: 公式埋め込みコード（blockquote全体）
   - **キャプション**: 日本語の簡潔な説明
   - **紐付け特集スラッグ**: 例) shibuya-casual-date
   - **ステータス**: approved（公開する場合）

### 特集記事の追加手順
1. 管理画面 → 「特集記事」→「新規作成」
2. Slug: URL用の英語ID（例: shibuya-sky-date）
3. タイトル・サブタイトル・説明文を日本語で入力
4. エリア: 対象エリア名
5. タグ: カンマ区切り
6. スポット情報はJSON形式で追加

### PRスポットの追加手順
1. 管理画面 → 「PRスポット管理」
2. タイトル・説明文・URL・画像URLを入力
3. カテゴリ・日本語ラベルを設定
4. 対象エリアを選択

## チャットAI仕様
- Anthropic Claude APIを使用
- DBのスポット・UGC・オリジナルコンテンツを参照（RAGパターン）
- 最適な会話ラリー: 2-3回のやり取りで具体的な店舗推薦
- 日本語IME対応済み（useRef + compositionイベント + setTimeout）

## Vercel環境変数（nightchill-sr5g プロジェクト）
- DATABASE_POSTGRES_* 系
- CONTEXTUAL_PR_ENABLED=true
- ANTHROPIC_API_KEY
- GOOGLE_PLACES_API_KEY
- GOOGLE_MAPS_API_KEY
- ADMIN_PASSWORD

## トラブルシューティング

### ビルドエラー: 型が見つからない
→ `@/lib/schema.ts` のスキーマ定義を確認

### UGCが表示されない
→ `?featureSlug=` パラメータ確認 + `Array.isArray` チェック

### チャットが店舗を推薦しない
→ `src/app/api/chat/route.ts` の `buildSystemPrompt` を確認

### IME入力でテキストが残る
→ `ChatUI.tsx` の `isComposingRef` + `onCompositionStart/End` を確認
