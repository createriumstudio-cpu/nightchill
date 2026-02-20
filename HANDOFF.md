# nightchill 引き継ぎドキュメント（HANDOFF.md）
最終更新: 2026-02-20

## プロジェクト概要
**nightchill** — 成功確約型デートコンシェルジュWebメディア
- コンセプト: 「Where」ではなく「How」を提供。「点（スポット情報）」ではなく「線（1軒目→2軒目の動線、会話、事前準備）」
- ターゲット: 都内20-30代デート層
- マネタイズ: Contextual PR（文脈連動型）のみ。嘘の営業時間や不自然なバナー広告は厳禁

## 技術スタック
- **フレームワーク**: Next.js 16 + TypeScript strict + Tailwind CSS v4
- **テスト**: Jest + React Testing Library
- **ホスティング**: Vercel (nightchill-sr5g がプロダクション)
- **リポジトリ**: https://github.com/createriumstudio-cpu/nightchill
- **本番URL**: https://nightchill-sr5g.vercel.app

## Vercel環境変数（nightchill-sr5g）
| 変数名 | 用途 |
|--------|------|
| ANTHROPIC_API_KEY | AIプラン生成 |
| GOOGLE_PLACES_API_KEY | Google Places API |
| GOOGLE_MAPS_API_KEY | Google Maps API |
| ADMIN_PASSWORD | 管理画面ログイン (値: taas1111) |

## 本番ページ構成
| URL | 説明 | 状態 |
|-----|------|------|
| / | ホームページ | ✅ 稼働中 |
| /features | 特集一覧（ヒーロー画像付きカード） | ✅ 稼働中 |
| /features/ebisu-night-date | 恵比寿ナイトデート詳細 | ✅ 稼働中 |
| /features/shibuya-casual-date | 渋谷カジュアルデート詳細 | ✅ 稼働中 |
| /plan → /results | AIデートプラン生成 | ✅ 稼働中 |
| /admin/login | 管理画面ログイン | ✅ 稼働中 |
| /admin | 管理画面ダッシュボード | ✅ 稼働中（読み取り専用） |
| /admin/features/new | 新規特集作成フォーム | ✅ UI表示（書き込み不可*） |
| /admin/features/[slug]/edit | 特集編集フォーム | ✅ UI表示（書き込み不可*） |

*Vercelのサーバーレス環境はファイルシステムが読み取り専用のため、CRUD書き込み操作は動作しません。将来的にVercel KV/Postgresへの移行が必要です。

## 画像について
- ヒーロー画像は **Gemini 3.1 Nano Banana Pro** で生成（フォトリアル）
- 画像ファイルは `public/images/` に格納
- 画像生成時のプロンプトのコツ:
  - 英語で指定（カメラ設定: "Shot on Sony A7IV, 35mm f/1.4 lens, shallow depth of field"）
  - "NO text, NO watermarks" を必ず付ける
  - 日本人モデルを指定する場合 "Japanese couple" を明記
  - 両サイドの店が異なることを "IMPORTANT: each shop must look distinctly different" で強調

## 完了済みPR一覧
| PR | 内容 |
|----|------|
| #1-#13 | プロジェクト初期セットアップ〜JSON解析修正 |
| #14 | 特集ページ + UGCエンベッド |
| #15 | ヘッダーを特集ページに追加 |
| #16 | 特集ページCTAから「AI」文言削除 |
| #17 | ホームページから「AI」文言削除 + テスト修正 |
| #18 | 特集ページにヒーロー画像追加 |
| #19 | 管理画面（Admin Panel）+ JSON CRUD API（9ファイル, 1,160行追加） |
| #20 | Nanobanana Proヒーロー画像追加 + ローカルパス |

## 重要な制約・ルール
1. **mainブランチは保護** — コード変更は必ずPR経由（データ/ドキュメントファイルは直接コミット可）
2. **CIは npm install を使用**（npm ci ではない — lockファイル同期の問題）
3. **Google Places APIデータは「絶対改変不可のファクト」** — プロンプトに注入
4. **PR/広告はON/OFF切替可能** — CONTEXTUAL_PR_ENABLED環境変数
5. **UGCエンベッドは公式プラットフォームEmbed APIのみ** — 法的要件
6. **ユーザー向けテキストに「AI」の文言は使わない** — 体験価値にフォーカス
7. **テストファイルはユーザー向けテキスト変更時に必ず更新**
8. **layout.tsxにHeaderはグローバル非含有** — 各ページで個別にimport

## 次にやるべきこと（優先順）
1. **東京主要エリアの特集記事を追加**（表参道、六本木、銀座、中目黒、代官山 等）
   - 管理画面UIはあるがVercel上では書き込み不可
   - features.jsonを直接編集してPRする or DB移行（Vercel KV/Postgres）
2. **各スポットのリアルSNS投稿URLを追加**（Instagram/TikTok embeds）
3. **Vercel KV/Postgres移行**（管理画面の書き込み機能を本番で有効化）
4. **国内旅行・海外旅行カテゴリ追加**（「深さ → 広さ」の順で拡張）

## 外部サービス
- **NotebookLM**: https://notebooklm.google.com/notebook/b5fca57c-0385-4064-9188-0f0343032e16 （進捗記録、7ソース）
- **Vercelダッシュボード**: https://vercel.com/createriumstudio-cpus-projects/nightchill-sr5g
- **Google Cloud Console**: https://console.cloud.google.com/google/maps-apis/credentials?project=starry-seat-482615-j1
- **Gemini (Nanobanana)**: https://gemini.google.com — 画像生成に使用

## CodeMirror操作（GitHub Web Editor）
- エディタのViewアクセス: `Object.keys(el).filter(k => k.startsWith('cm'))` → `el[key].view`
- 全文置換: `view.dispatch({changes: {from: 0, to: doc.length, insert: newContent}})`
- ネストが深いファイル新規作成: `github.com/.../new/BRANCH?filename=src/full/path/file.ext`
