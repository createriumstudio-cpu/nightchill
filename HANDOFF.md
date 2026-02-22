# HANDOFF.md — futatabito プロジェクト引き継ぎドキュメント
最終更新: 2026-02-22 16:35

## プロジェクト概要
- **ブランド名**: futatabito（ふたたびと）
- **コンセプト**: デート視点の東京カルチャーガイド
- **キャッチフレーズ**: ふたりの時間を、もっとおもしろく。
- **本番URL**: https://nightchill-sr5g.vercel.app/
- **リポジトリ**: https://github.com/createriumstudio-cpu/nightchill
- **技術スタック**: Next.js 15 + TypeScript + Tailwind CSS + Neon PostgreSQL + Drizzle ORM

## 重要ルール
- GitHubリポジトリ名・Vercelプロジェクト名は「nightchill」のまま維持
- コード内のユーザー向け表示のみ「futatabito」
- layout.tsxにHeaderやFooterは含まない → 各ページで個別import
- mainブランチは保護 → コード変更はPR経由
- CI uses npm install (not npm ci)
- Google Places APIデータ = 絶対改変不可のファクト
- UGC embedsは公式oEmbed APIのみ使用（法的要件）
- ユーザー向けテキストに「AI」の文言は使わない
- PR/広告はContextual onlyの（CONTEXTUAL_PR_ENABLED env var）、バナー広告禁止

## 完了済みPR一覧
| PR | 内容 | 状態 |
|----|------|------|
| #24-#28 | Phase 0-2: Brand rename + DB + Admin | ✅ Merged |
| #29 | Phase 3: UGC curation system | ✅ Merged |
| #30 | Phase 4: Chat AI concierge | ✅ Merged |
| #31 | Phase 5: Contextual PR monetization | ✅ Merged |
| #32 | Phase 6: Original content system | ✅ Merged |
| #33-#34 | Phase 7: SEO + Performance | ✅ Merged |
| #35-#37 | Chat fixes + UX improvements | ✅ Merged |
| #38 | Floating chat + Hero redesign | ✅ Merged |
| #39 | English button fix + PR images/video | ✅ Merged |
| #40 | Footer + FeaturedPicks + JSON-LD (partial) | ✅ Merged |
| #41 | Fix: render FeaturedPicks + JsonLd in JSX | ✅ Merged |
| #42 | Fix: remove duplicate Footer from layout.tsx | ✅ Merged |
| #43 | Fix: add Footer to pages missing it | ✅ Merged |

## 本番サイト現在の状態
### ホームページ (/)
- ✅ Hero: キャッチフレーズ + CTA
- ✅ シーンバッジ（初デート、記念日、誕生日等）
- ✅ FeaturedPicks: 人気の特集3選
- ✅ FEATURES: futatabitoの特徴
- ✅ 特集一覧グリッド
- ✅ 使い方セクション
- ✅ CTA section
- ✅ Footer
- ✅ JSON-LD構造化データ（WebSite + Organization）
- ✅ フローティング相談ボタン

### 特集ページ (/features)
- ✅ 全7エリア特集一覧
- ✅ Footer追加済み

### 特集詳細 (/features/[slug])
- ✅ スポット情報 + Google Maps
- ✅ UGCセクション
- ✅ Contextual PR（環境変数で制御）
- ✅ Footer追加済み

### 英語版 (/en)
- ✅ トップページ
- ✅ 特集詳細
- ✅ Footer追加済み

### その他ページ
- ✅ /plan - デートプラン作成
- ✅ /chat - コンシェルジュ
- ✅ /about - サイト概要
- ✅ /privacy - プライバシーポリシー
- ✅ /results - 検索結果
- ✅ /admin - 管理画面（UGC/Sponsored/Original Content）

## DB情報
- **Neon PostgreSQL**: ap-southeast-1
- **テーブル**: features, ugc_posts, audit_log, sponsored_spots, original_contents, chat_sessions
- **特集slugs**: omotesando-sophisticated-date, ginza-luxury-date, ebisu-night-date, roppongi-premium-night, nakameguro-canal-date, daikanyama-stylish-date, shibuya-casual-date

## 重要パターン（新規開発時の注意）
### isAuthenticated()
```typescript
const authed = await isAuthenticated();  // NO arguments
if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```
import: `import { isAuthenticated } from "@/lib/admin-auth";`

### getDb()
```typescript
const db = getDb();
if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
```

### Window型宣言
UgcSection.tsxに唯一のWindow型宣言あり。重複させないこと。

## 次のステップ候補
- [ ] UGC CSV一括インポート
- [ ] Vercel Analytics導入
- [ ] NotebookLMソース更新
- [ ] 英語版特集一覧ページ (/en/features)
- [ ] パフォーマンス最適化
- [ ] 画像最適化（Next.js Image component統一）
