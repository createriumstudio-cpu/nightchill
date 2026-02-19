# nightchill 引き継ぎドキュメント (HANDOFF.md)

> 最終更新: 2026-02-19 (Phase 1 マージ完了)
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
| #7 | Phase 1: Google API統合・ファクトデータ注入・Contextual PR基盤 | 2026-02-19 |

## 9. 開発フェーズ進捗

### Phase 1: MVP検証（✅ 完了・マージ済み PR #7）
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

### 即座に必要（運用開始に必須）
1. Google Cloud Console で Places API / Maps API を有効化
2. APIキーを取得し、Vercel 環境変数に設定:
   - `GOOGLE_PLACES_API_KEY` → 店舗情報取得用
   - `GOOGLE_MAPS_API_KEY` → 徒歩ルート・地図埋め込み用
3. Google Cloud Console でAPIキーにリファラ制限を設定

### Codex Review Bot 指摘事項（改善推奨）
4. plan-encoder.ts に venues/walkingRoute のシリアライズ追加（共有URL対応）
5. Google Maps Embed APIキーのクライアント露出対策の検討

### Phase 2 開発
6. CMS 統合設計（記事テンプレート・自動生成パイプライン）
7. 逆引き検索UI実装
8. タグ・カテゴリシステム構築


---

## 最新更新: 2026-02-20 (JSON解析バグ修正完了)

### 解決した問題: AIレスポンスJSON解析失敗
Claude AIが生成するJSONにJSX風パターン(`{'\n'}`)が含まれ、JSON.parseが常に失敗していた。
テンプレートフォールバックが毎回使用され、AI生成プランが表示されなかった。

### 修正履歴 (PR #9 - #13)
| PR | 内容 | 結果 |
|----|------|------|
| #9 | markdownコードブロック除去 | 別のJSONエラー発覚 |
| #10 | robustJsonParse 3段階+リトライ | 全パース失敗 |
| #11 | escapeNewlinesInStrings 文字列内改行エスケープ | 改行以外の原因判明 |
| #12 | regex fallback 4段階目追加 | regex抽出も失敗 |
| #13 | **cleanAIResponseText + システムプロンプト強化** | **成功** |

### 根本原因と解決策
- **原因**: AIが文字列値に`{'\n'}`等のJSX風テンプレート構文を混入
- **解決**: システムプロンプトでJSON出力ルールを厳格化（1行・50文字以内制約）
- **防御**: cleanAIResponseText() + 4段階フォールバック + regex抽出

### 現在の動作状態
- AI生成プラン: **正常動作** (初回パースで成功)
- Google Places API: **正常動作** (店舗ファクトデータ取得)
- Google Maps Embed: **正常動作** (徒歩ルート地図表示)
- 応答時間: 約18秒 (AI生成+API呼び出し)

### 次のステップ
1. UGC統合: Instagram/TikTok公式embed API連携 (実在店舗と紐付け)
2. HANDOFF.md / NotebookLM 継続更新
3. Phase 2: CMS統合・逆引き検索UI


---

## 11. 開発ワークフロー（GitHub Web UI経由）

このプロジェクトはGitHub Web UI + Vercel自動デプロイで開発されています。
ローカル環境がなくても以下のフローで開発可能です。

### コード修正の手順
1. GitHub Web UIで対象ファイルの Edit ボタンをクリック
2. コードを修正
3. 「Commit changes...」→ 「Create a new branch」を選択
4. ブランチ名を `fix/修正内容` 形式で入力
5. 「Propose changes」→ PR作成画面で説明を追加
6. 「Create pull request」でPR作成
7. CI（4チェック）が全てパスするのを待つ（約1〜2分）
8. 「Merge pull request」→「Confirm merge」
9. 「Delete branch」でブランチ削除
10. Vercelが自動デプロイ（約30秒〜1分）
11. 本番サイトで動作確認

### CI チェック項目（4つ）
- `CI / ci` — lint + typecheck + test + build
- `Vercel / nightchill` — プレビューデプロイ
- `Vercel / nightchill-sr5g` — 本番デプロイ
- `Vercel Preview Comments` — プレビューコメント

### 注意事項
- **main ブランチは直接コミット禁止**（docsファイルのみ例外）
- CIが `npm ci` でなく `npm install` を使っているのは意図的
- Vercelデプロイは main マージで自動実行される

## 12. 完了済みPR（全履歴）

| PR | タイトル | マージ日 | 備考 |
|----|---------|---------|------|
| #1 | Vercel デプロイ修正 + CI | 2026-02-18 | |
| #4 | UGC合法埋め込み | 2026-02-19 | |
| #5 | URL永続化 + SNSシェア | 2026-02-19 | |
| #7 | Phase 1: Google API統合 | 2026-02-19 | |
| #8 | HANDOFF.md更新 | 2026-02-19 | |
| #9 | JSON sanitize (markdown除去) | 2026-02-19 | 不十分 |
| #10 | robustJsonParse 3段階 | 2026-02-19 | 不十分 |
| #11 | escapeNewlinesInStrings | 2026-02-19 | 不十分 |
| #12 | regex fallback追加 | 2026-02-19 | 不十分 |
| #13 | **cleanAIResponseText + prompt強化** | **2026-02-20** | **JSON問題解決** |

## 13. 障害対応ガイド

### 障害パターン1: 「プランがテンプレートに落ちる」

**重要度**: 高（コア機能がダウン）

**確認手順**:
1. Vercel Dashboard → nightchill-sr5g → Logs
2. POST `/api/plan` リクエストのログを確認
3. エラーメッセージに応じて対処:

| ログメッセージ | 原因 | 対処 |
|--------------|------|------|
| `AI response (attempt...)` + `JSON parse failed` | AIのJSON出力が壊れた | `ai-planner.ts` の防御を強化 |
| `AI plan generation failed` のみ | APIキー/モデル問題 | 環境変数確認 |
| ログなし | APIキー未設定 | ANTHROPIC_API_KEY確認 |

**AI JSON解析エラーの修正アプローチ**:
1. まず `SYSTEM_PROMPT` の出力制約を強化（最も効果的）
2. 次に `cleanAIResponseText()` に新しいパターンを追加
3. 最後に `extractFieldsWithRegex()` を改善

**絶対にやってはいけないこと**:
- SYSTEM_PROMPTのJSON出力ルールを緩めること
- robustJsonParseのフォールバック段数を減らすこと
- cleanAIResponseTextを削除すること

### 障害パターン2: 「店舗情報が出ない」

**確認手順**:
1. Vercel Logs の External APIs に `maps.googleapis.com` があるか
2. Google Cloud Console でAPIキーの有効性を確認
3. `GOOGLE_PLACES_API_KEY` が Vercel (nightchill-sr5g) に設定されているか

### 障害パターン3: 「地図が表示されない」

**確認手順**:
1. ブラウザDevTools → Console でエラー確認
2. `GOOGLE_MAPS_API_KEY` がVercelに設定されているか
3. Maps Embed API がGoogle Cloudで有効か
4. APIキーのリファラ制限に `nightchill-sr5g.vercel.app` が含まれているか

## 14. 参照リンク

| リソース | URL |
|---------|-----|
| 本番サイト | https://nightchill-sr5g.vercel.app |
| GitHubリポジトリ | https://github.com/createriumstudio-cpu/nightchill |
| Vercel Dashboard | https://vercel.com/createriumstudio-cpus-projects/nightchill-sr5g |
| Google Cloud Console | https://console.cloud.google.com/google/maps-apis/credentials?project=starry-seat-482615-j1 |
| NotebookLM | https://notebooklm.google.com/notebook/b5fca57c-0385-4064-9188-0f0343032e16 |
