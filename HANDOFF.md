# futatabito 引き継ぎドキュメント

## プロジェクト概要
- **名前**: futatabito (ふたたびと)
- **コンセプト**: デート視点の東京カルチャーガイド
- **キャッチコピー**: ふたりの時間を、もっとおもしろく。
- **URL**: https://nightchill-sr5g.vercel.app
- **リポジトリ**: https://github.com/createriumstudio-cpu/nightchill
- **Vercelプロジェクト**: nightchill-sr5g
- **管理画面**: /admin (パスワード: taas1111)

## 技術スタック
- Next.js 16 (App Router, Turbopack)
- TypeScript + Tailwind CSS
- Neon Postgres (Drizzle ORM)
- Anthropic Claude API (チャット)
- Google Places API / Maps API
- Vercel (ホスティング)

## PR履歴
| PR# | 内容 | ステータス |
|-----|------|-----------|
| #24 | Phase 0: Brand rename | Merged |
| #25 | Phase 1: E-E-A-T pages | Merged |
| #26 | Homepage copy refinement | Merged |
| #27 | Phase 2a: Neon Postgres DB | Merged |
| #28 | Phase 2b: Admin CRUD | Merged |
| #29 | Phase 3: UGC embed system | Merged |
| #30 | Phase 4: OGP + i18n English | Merged |
| #31 | Phase 5: Contextual PR | Merged |
| #32 | Phase 6: UGC Admin + Multi-Platform | Merged |
| #33 | Critical Bugfix: Feature pages | Merged |
| #34 | Phase 7: Chat AI + Content | Merged |
| #35 | Chat Prompt Fix | Merged |
| #36 | Chat Input Clear Fix | Merged |
| #37 | IME Composition Fix | Merged |
| #38 | Design: Floating Chat + Hero | Merged |
| #39 | English button + PR images | Merged |
| #40 | Homepage SEO + Footer (予定) | In Progress |

## DB スキーマ (6テーブル)
- features, ugc_posts, audit_log, sponsored_spots, original_contents, chat_sessions

## 重要な制約
- layout.tsxにHeaderは含まない (各ページで個別import)
- mainブランチは保護 → コード変更はPR必須
- CI uses npm install (not npm ci)
- Google Places APIデータ = 絶対改変不可のファクト
- UGC embeds must use official platform embed APIs only
- ユーザー向けテキストに「AI」の文言は使わない
- GitHubリポジトリ名・Vercelプロジェクト名は「nightchill」のまま維持

## isAuthenticated() パターン
```typescript
const authed = await isAuthenticated();  // NO arguments
if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

## 環境変数 (Vercel nightchill-sr5g)
DATABASE_POSTGRES_*, CONTEXTUAL_PR_ENABLED=true, ANTHROPIC_API_KEY, GOOGLE_PLACES_API_KEY, GOOGLE_MAPS_API_KEY, ADMIN_PASSWORD

## 未完了タスク
- [ ] UGC CSV一括インポート
- [ ] Analytics/tracking (Vercel Analytics)
- [ ] NotebookLM source update
- [ ] 特集ページ英語版一覧 (/en/features)
- [ ] パフォーマンス最適化 (画像lazy load等)
