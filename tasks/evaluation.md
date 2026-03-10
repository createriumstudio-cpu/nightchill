# futatabito サイト評価ログ

最終評価日: 2026-03-10

## 評価サマリー

| 視点 | スコア | 最優先アクション |
|------|--------|-----------------|
| UX | 8/10 | プラン生成後のLINE共有・保存機能を追加 |
| 管理・運用 | 8/10 | Analytics設定 + APIコストアラートを今週中に |
| マネタイズ | 8/10 | 特集ページへの予約リンク（アフィリエイト）を即設置 |

## 1. マネタイズ視点（8/10）

---

### 現状の問題

* 収益化の仕組みが一切ない。完全無料・登録不要を全面打ち出しながら収益ゼロ
* AI API費用（Anthropic + Gemini）は毎月発生しているのに出口がない
* アフィリエイト・予約リンクがゼロ（店舗が登場するのに予約導線なし）
* 有料プランが存在しない（フリーミアムの上位版がない）
* ログイン機能なし → ユーザーデータが溜まらない → リテンション施策不可

### 改善ロードマップ

* [x] **短期**: ブログ記事に関連アフィリエイト追加（BlogAffiliateコンポーネント稼働中）
* [x] **短期**: プラン結果の店舗にアフィリエイトリンク設置（hotpepper 6店舗投入済み、ReservationAffiliateコンポーネント稼働中）
* [x] **短期**: 特集ページ・プラン結果の店舗にアフィリエイトリンク設置（BlogAffiliate + inferCityFromArea）
* [x] **中期**: GA4アフィリエイトクリックイベント計測（PR #157、affiliate_clickイベント、venue_name/affiliate_url/click_locationパラメータ）
* [ ] **中期**: フリーミアム化（プレミアム月額480〜980円、PDF保存・予約リンク付き）
* [ ] **長期**: 飲食店・ホテルとの直接スポンサー契約

---

## 2. UX視点（8/10）

### 強み

* ダークトーンで統一された高品質なビジュアルデザイン
* Gemini生成のヒーロー画像の質が高い
* 「30秒でプランをつくる」という明確な価値訴求
* シチュエーション別タグ（初デート・記念日・プロポーズ等）が機能している

### 現状の問題

* プラン生成後の体験が弱い（保存・共有・実行動線がない）
* ログインなしでは何も積み上がらず、リピート利用モチベーションが生まれない
* 特集ページのカード画像が暗い（画像なし）ものが残っている
* モバイルでの実用体験が不明

### 改善ロードマップ

* [x] **短期**: 生成プランのLINE共有ボタン追加（results/page.tsxに実装済み）
* [x] **短期**: プラン結果のURL共有機能（buildShareUrl使用で実装済み）
* [x] **中期**: 特集カード画像の補完（/api/og生成画像でフォールバック置換、PR #153 + PR #159で都市LP・WeeklyPicksSectionも対応完了）
* [ ] **中期**: 簡易ログイン機能（Google/LINE OAuth）→ プラン保存履歴
* [ ] **長期**: Google Maps連携のルート表示

---

## 3. 管理・運用視点（8/10）

### 強み

* Vercel + Neon の低コスト構成
* コンテンツ自動生成の仕組みが整っている（毎週月曜自動更新）
* ブログ・画像生成の自動化が進んでいる

### 現状の問題

* Vercel Analytics・Speed Insights が未設定（両方 Not Enabled）
* Google Analytics 4 未設定
* API費用の監視・アラートなし（コスト爆発リスク）
* AIが誤情報を出力しても検知する仕組みがない

### 改善ロードマップ

* [x] **今週**: Vercel Analytics を有効化（Speed Insightsは有料$10/月のためスキップ）
* [x] **今週**: Google Analytics 4 設定（GA4）（測定ID: G-272CBN32K5）
* [x] **今週**: Anthropic/Gemini APIコストアラート設定完了（Anthropic $30/$50、Gemini ¥1,500）
* [x] **短期**: CIバグ修正（TextDecoder polyfill、PR #156、GitHub Actions全通過）
* [ ] **月次**: 週次コンテンツのサンプル品質チェックを運用フロー化

---

## 変更履歴

| 日付 | 対応内容 | スコア変化 |
|------|---------|-----------|
| 2026-03-09 | 初回評価・evaluation.md 作成 | — |
| 2026-03-10 | GA4設定（G-272CBN32K5）、Vercel Analytics有効化、hotpepper partner_venues 6件投入、ReservationAffiliateコンポーネント本番稼働 | 管理・運用 6→7、マネタイズ 3→5 |
| 2026-03-10 | Anthropicコストアラート設定（$30/$50メール通知）、Gemini APIコストアラート設定（¥1,500上限、50%/90%/100%通知）、BlogAffiliateコンポーネント本番稼働 | 管理・運用 7→8 |
| 2026-03-10 | 特集詳細ページ（features/[slug]）にBlogAffiliateコンポーネント追加、エリア→都市ID自動推定（inferCityFromArea）、BlogAffiliate.tsxにcity propを追加 | マネタイズ 5→6 |
| 2026-03-10 | 特集カードの絵文字フォールバックを/api/og生成画像に置換（FeatureCard + weeklyFeatures両方）、LINE共有・URL共有はresults/page.tsxに実装済みと確認 | UX 7→8 |
| 2026-03-10 | CIバグ修正（TextDecoder/TextEncoder polyfill をjest.setup.tsに追加、PR #156） | - |
| 2026-03-10 | GA4アフィリエイトクリックイベントトラッキング実装（trackAffiliateClick関数、BlogAffiliate・ReservationAffiliate両方、PR #157） | マネタイズ 6→7 |
| 2026-03-10 | 都市LP WeeklyPicksSection + [city]/features FeatureCard の絵文字フォールバックを/api/og画像に置換（PR #159） | - |
| 2026-03-10 | メールリード獲得機能追加（PR #163）、Resend futatabito.comドメイン認証DNS設定完了 | マネタイズ 7→8 |
