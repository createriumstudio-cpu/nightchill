# AI_HANDOFF.md — futatabito AIエージェント引き継ぎドキュメント
最終更新: 2026-02-26

## このドキュメントの目的

AIエージェント（Claude Code等）がこのリポジトリで作業する際に知っておくべき情報をまとめたもの。
人間向けの詳細は HANDOFF.md、開発ルールは CLAUDE.md を参照。

## プロジェクト概要

- **ブランド名**: futatabito（ふたたびと）
- **コンセプト**: デート視点の東京カルチャーガイド
- **技術スタック**: Next.js 15 + TypeScript + Tailwind CSS + Neon PostgreSQL + Drizzle ORM
- **本番URL**: https://nightchill-sr5g.vercel.app/
- **リポジトリ名**: nightchill（変更禁止）

## 直近の変更履歴（PR #56相当）

### 削除されたもの
1. **服装アドバイス（fashionAdvice）**: results/page.tsxの表示セクション削除、planToTextから削除
2. **注意ポイント（warnings）**: results/page.tsxの表示セクション削除、planToTextから削除
3. **AIプロンプトのスリム化**: SYSTEM_PROMPTから服装アドバイス指示・注意ポイント指示・conversationTopics関連を削除。JSON出力定義からfashionAdvice, warningsフィールドを削除
4. **事前検索（preSearch）**: ai-planner.tsのStep1を廃止。Post-search（タイムライン店舗名でのGoogle Places検索）は維持
5. **営業時間フィールド**: google-places.tsのSEARCH_FIELD_MASKからplaces.regularOpeningHoursを削除。VenueCardから営業時間details/summaryを削除

### 改善されたもの
6. **LINE共有**: handleShareLineにタイムラインの店舗名と時間を含めるように改善（例: "13:00 Fuglen Tokyo → 14:30 ワタリウム美術館"）
7. **max_tokens**: 1024 → 768 に削減

### 維持されているもの
- 写真表示（VenueCard内のphotoUrl）
- Google Maps埋め込み（VenueEmbed）
- 俯瞰マップ（OverviewMap）
- Post-search（AI生成後のGoogle Places検索によるファクトデータ付与）
- テンプレートフォールバック（planner.ts）

## 現在のAI生成フロー

```
generateAIPlan(request)
  ├── Step 1: Contextual PR取得
  ├── Step 2: Claude API呼び出し (max_tokens: 768)
  │   └── buildUserPrompt() で条件・季節・関係性を構築
  ├── Step 3: タイムライン店舗名 → Google Places並列検索
  └── Step 4: 徒歩ルート取得（最初と2番目の店舗間）
```

## AI出力JSONスキーマ（現在）

```json
{
  "title": "プランのタイトル（20文字以内）",
  "summary": "プランの概要（1文、50文字以内）",
  "timeline": [
    {
      "time": "HH:MM",
      "activity": "アクティビティの内容",
      "venue": "実在する店舗名（必須・空禁止）",
      "description": "店の特徴やおすすめポイント",
      "tip": "成功のためのコツ"
    }
  ]
}
```

注意: fashionAdvice, warnings, conversationTopicsはAIに生成させない。
DatePlanインターフェースにはまだこれらのフィールドが存在するが、AIからは返されない（デフォルト値が使用される）。

## 重要な型定義

```typescript
// src/lib/types.ts
interface DatePlan {
  id: string;
  title: string;
  summary: string;
  timeline: TimelineItem[];
  fashionAdvice: string;        // AI出力から削除済み。デフォルト""
  conversationTopics?: string[]; // AI出力から削除済み
  warnings: string[];            // AI出力から削除済み。デフォルト[]
  venues?: VenueFactData[];
  walkingRoute?: WalkingRoute;
}
```

## 作業時の注意事項

1. **SYSTEM_PROMPTを変更する場合**: robustJsonParse の4段階フォールバックに影響しないか確認
2. **型を変更する場合**: `grep -rn 'InterfaceName' src/` で全参照を確認し、テストのmockも更新
3. **CIでは `npm install` を使用**（npm ciではない）
4. **mainブランチ直接pushは禁止** → PR経由のみ
5. **GitHub Web UIでのTSX編集は禁止** → CodeMirrorがタグを破壊する

## テスト

```bash
npm run lint       # 0 errors必須
npx tsc --noEmit   # 型チェック
npm test           # Jest (16テスト)
npm run build      # Next.jsビルド
```

## ファイル変更時のチェックリスト

- [ ] `npx tsc --noEmit` が通るか
- [ ] `npm run lint` でエラーが0か
- [ ] `npm test` で全テストがパスするか
- [ ] ユーザー向けテキストに「AI」が含まれていないか
- [ ] ブランド名が「futatabito」になっているか
