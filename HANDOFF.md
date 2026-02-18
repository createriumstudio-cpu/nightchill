# nightchill 引き継ぎドキュメント (HANDOFF.md)

> 最終更新: 2026-02-19
> このドキュメントは、プロジェクトの引き継ぎを円滑にするための包括的ガイドです。

## 1. プロジェクト概要

**nightchill** = 成功確約型AIデートコンシェルジュサービス

### コアコンセプト（絶対不変）
- 「Where（場所）」ではなく「How（過ごし方）」を提案
- 「点（スポット情報）」ではなく「線（1軒目→2軒目の動線・会話・準備をストーリー化）」
- ファクトデータ（Google Places API）は絶対改変不可
- マネタイズ: ユーザーファースト > 短期収益。Contextual PRのみ

### コンセプト定義の保存先
- **NotebookLM**: "nightchill コアコンセプト" ノートブック
- **Issue #6**: 要件定義書の実装計画

## 2. 技術スタック

| 技術 | バージョン | 用途 |
|------|----------|------|
| Next.js | 16.1.6 | フレームワーク (App Router) |
| React | 19.2.3 | UI |
| TypeScript | ^5 | 型安全 |
| Tailwind CSS | v4 | スタイリング |
| Anthropic SDK | ^0.76.0 | AI生成 |
| Jest | ^30.2.0 | テスト |
| Vercel | - | デプロイ |

## 3. リポジトリ構成

```
nightchill/
├── .github/workflows/ci.yml  # CI: lint → typecheck → test → build
├── CLAUDE.md                  # AI開発者向けガイド
├── HANDOFF.md                 # ← このファイル
├── src/
│   ├── app/
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx           # LP
│   │   ├── plan/page.tsx      # フォーム入力
│   │   ├── results/page.tsx   # プラン結果表示 + シェア
│   │   └── api/plan/route.ts  # POST /api/plan
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── SocialEmbed.tsx
│   └── lib/
│       ├── types.ts           # 型定義
│       ├── ai-planner.ts      # Claude API連携
│       ├── planner.ts         # テンプレートフォールバック
│       ├── plan-encoder.ts    # プランURL圧縮/共有
│       ├── env.ts             # 環境変数バリデーション
│       ├── ugc-data.ts        # UGCデータ管理
│       ├── google-places.ts   # Google Places API (Phase 1)
│       ├── google-maps.ts     # Google Maps API (Phase 1)
│       └── contextual-pr.ts   # 文脈連動型PR (Phase 1)
```
## 4. データフロー

```
[ユーザー入力] → POST /api/plan
  ├→ Google Places API で店舗ファクトデータ取得
  ├→ Google Maps API で徒歩ルート取得
  ├→ ファクトデータ + ユーザー入力 → Claude AI でプラン生成
  ├→ Contextual PR 判定・挿入
  └→ レスポンス → sessionStorage → results/page.tsx で表示
```

## 5. 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | AI生成時 | Claude APIキー |
| `ANTHROPIC_MODEL` | No | モデル名（デフォルト: claude-sonnet-4-6） |
| `NEXT_PUBLIC_SITE_URL` | No | OGP/canonical URL |
| `GOOGLE_PLACES_API_KEY` | Phase 1 | Google Places API |
| `GOOGLE_MAPS_API_KEY` | Phase 1 | Google Maps API |

## 6. デプロイ

- **Vercel**: `nightchill` と `nightchill-sr5g`（同リポジトリ）
- **本番URL**: https://nightchill-sr5g.vercel.app
- **CI**: GitHub Actions（PR + main push で自動実行）
- **注意**: CI は `npm install`（lock file 同期問題対応）

## 7. 開発ルール

### ブランチ戦略
- `main` は保護 — 全変更はPR経由
- 命名: `feature/機能名`, `fix/修正内容`

### コンセプト遵守（最重要）
- ファクトデータ（営業時間等）はAIに改変させない
- PR/広告は Contextual のみ、ON/OFF 切替可能
- UGC は公式埋め込みAPIのみ（画像直DL厳禁）

### 技術的注意点
1. TypeScript Uint8Array問題: `as any` + eslint-disable が実証済み解決策
2. ESLint set-state-in-effect: useEffect内setState は Promise.then()内で
3. Vercel: 2プロジェクトが同リポ参照、環境変数は各自管理

## 8. 完了済みPR

| PR | タイトル | マージ日 |
|----|---------|---------|
| #1 | Vercel デプロイ修正 + CI | 2026-02-18 |
| #4 | UGC合法埋め込み | 2026-02-19 |
| #5 | URL永続化 + SNSシェア | 2026-02-19 |

## 9. 開発フェーズ進捗

### Phase 1: MVP検証（進行中）
- [x] Google Places API サービス
- [x] Google Maps API サービス
- [x] Contextual PR フレームワーク
- [x] AIプロンプトにファクトデータ注入
- [x] 結果画面に店舗情報・地図表示
- [ ] Google API キー設定（Vercel環境変数）

### Phase 2: メディアサイト化（未着手）
- [ ] CMS API自動入稿
- [ ] 記事ページ生成
- [ ] 文脈・逆引き検索UI

### Phase 3: SNS拡散（未着手）
- [ ] SNS自動要約・投稿
- [ ] OGP画像自動生成

## 10. 次にやるべきこと

1. Google Cloud Console で Places API / Maps API 有効化
2. APIキーを Vercel 環境変数に設定
3. Phase 2 の CMS 統合設計
4. 記事テンプレートと自動生成パイプライン構築
