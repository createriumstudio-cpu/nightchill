# futatabito 引き継ぎドキュメント

> 最終更新: 2026-02-23
> ステータス: 運用テストフェーズ

## プロジェクト概要

- **ブランド名**: futatabito（ふたたびと）
- **コンセプト**: デート視点の東京カルチャーガイド
- **キャッチフレーズ**: ふたりの時間を、もっとおもしろく。
- **本番URL**: https://nightchill-sr5g.vercel.app
- **リポジトリ**: https://github.com/createriumstudio-cpu/nightchill
- **技術スタック**: Next.js 15 / TypeScript / Tailwind CSS / Neon Postgres / Drizzle ORM

## 重要なURL一覧

| 用途 | URL |
|------|-----|
| 本番サイト | https://nightchill-sr5g.vercel.app |
| 管理画面 | https://nightchill-sr5g.vercel.app/admin |
| チャット | https://nightchill-sr5g.vercel.app/chat |
| GitHub | https://github.com/createriumstudio-cpu/nightchill |
| Vercel | https://vercel.com/createriumstudio-cpus-projects/nightchill-sr5g |
| NotebookLM | https://notebooklm.google.com/notebook/b5fca57c-0385-4064-9188-0f0343032e16 |
| Google Cloud | https://console.cloud.google.com/google/maps-apis/credentials?project=starry-seat-482615-j1 |

## 認証情報

- **管理画面パスワード**: taas1111
- **Neon DB**: postgresql://neondb_owner:npg_z0pbsIgxeYa2@ep-fragrant-sea-a1z0md8l-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

## 完了済みPR一覧

| PR | 内容 | 状態 |
|----|------|------|
| #24 | Phase 0: Brand rename (nightchill → futatabito) | Merged |
| #25 | Phase 1: E-E-A-T pages | Merged |
| #26 | Homepage copy refinement | Merged |
| #27 | Phase 2a: Neon Postgres DB setup | Merged |
| #28 | Phase 2b: Admin CRUD with DB writes | Merged |
| #29 | Phase 3: UGC embed system | Merged |
| #30 | Phase 4: OGP + i18n English support | Merged |
| #31 | Phase 5: Contextual PR monetization | Merged |
| #32 | Phase 6: UGC Admin Enhancement + Multi-Platform | Merged |
| #33 | Critical Bugfix: Feature pages crash + date format | Merged |
| #34 | Phase 7: Chat AI + Content Infrastructure | Merged |
| #35 | Chat prompt optimization (shop recommendations) | Merged |
| #36 | Chat input clear (initial attempt) | Merged |
| #37 | IME composition handling fix (chat input clear v2) | Merged |
| #38 | Design overhaul: floating chat + hero visual | Merged |
| #19 | Admin panel (JSON) - SUPERSEDED by #28 | Open (close) |

## 既知の問題・TODO

1. **Englishボタン**: 全ページから /en/features に遷移してしまう → 各ページ対応の英語版へのルーティング修正が必要
2. **PR #19**: 古いPR。#28で置き換え済み。クローズすべき
3. **PRスポット画像/動画**: 現在テキストのみ → 画像・動画対応を検討
4. **UGC CSVバルクインポート**: 未実装
5. **Analytics/tracking**: 未導入

## DBスキーマ（6テーブル）

- **features**: 特集記事（7レコード）
- **ugc_posts**: UGC投稿（10+レコード）
- **audit_log**: 操作ログ
- **sponsored_spots**: PRスポット（7レコード）
- **original_contents**: オリジナルコンテンツ（将来用）
- **chat_sessions**: チャットセッション

## 特集slug一覧

- omotesando-sophisticated-date
- ginza-luxury-date
- ebisu-night-date
- roppongi-premium-night
- nakameguro-canal-date
- daikanyama-stylish-date
- shibuya-casual-date

## 法的確認事項

- UGC埋め込み: 公式oEmbed API使用（TikTok/Instagram規約準拠）
- Google Places API: データ改変不可（ファクトとして扱う）
- PR広告: コンテクスチュアル広告のみ（バナー広告禁止）
- ユーザー向けテキストに「AI」の文言は使用しない
