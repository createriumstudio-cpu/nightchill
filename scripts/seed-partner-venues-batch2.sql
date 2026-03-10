-- partner_venues 追加バッチ2: 東京2件・大阪2件・名古屋2件（計6件）
-- 実行方法: Neon SQL Editor (https://console.neon.tech/) に貼り付けて実行

INSERT INTO partner_venues (name, description, category, area, city, affiliate_url, affiliate_provider, price_range, target_occasions, target_moods, is_active)
VALUES
  -- 東京
  (
    '銀座 久兵衛',
    '創業1935年、銀座を代表する老舗寿司店。厳選されたネタと職人技が光るカウンター席は特別な日にぴったり。',
    'restaurant',
    '銀座',
    '東京',
    'https://www.hotpepper.jp/strJ000038620/',
    'hotpepper',
    '15,000〜30,000円',
    '["anniversary", "birthday", "dinner"]',
    '["luxurious", "romantic"]',
    true
  ),
  (
    '表参道 Anniversaire Cafe',
    '表参道のランドマーク的カフェ。開放的なテラス席とフォトジェニックな空間でカジュアルデートに最適。',
    'restaurant',
    '表参道',
    '東京',
    'https://www.hotpepper.jp/strJ001157618/',
    'hotpepper',
    '2,000〜4,000円',
    '["lunch", "casual", "birthday"]',
    '["fun", "relaxed"]',
    true
  ),
  -- 大阪
  (
    '北新地 日本料理 花外楼',
    '明治創業の老舗日本料理店。北新地の静かな佇まいの中で、季節の懐石料理を堪能できる。',
    'restaurant',
    '北新地',
    '大阪',
    'https://www.hotpepper.jp/strJ000006234/',
    'hotpepper',
    '10,000〜20,000円',
    '["anniversary", "dinner", "birthday"]',
    '["luxurious", "romantic"]',
    true
  ),
  (
    '心斎橋 THE ORIENTAL TERRACE',
    '心斎橋の洗練されたダイニング。モダンな空間でイタリアンベースの創作料理が楽しめる。',
    'restaurant',
    '心斎橋',
    '大阪',
    'https://www.hotpepper.jp/strJ001223408/',
    'hotpepper',
    '5,000〜10,000円',
    '["dinner", "casual", "anniversary"]',
    '["romantic", "fun"]',
    true
  ),
  -- 名古屋
  (
    '名古屋 THE COVER NIPPON',
    '日本の伝統工芸とモダンデザインが融合したダイニング。和食をベースにした創作料理が楽しめる。',
    'restaurant',
    '栄',
    '名古屋',
    'https://www.hotpepper.jp/strJ001127898/',
    'hotpepper',
    '5,000〜10,000円',
    '["dinner", "anniversary"]',
    '["luxurious", "relaxed"]',
    true
  ),
  (
    '栄 GARB CASTELLO',
    'イタリアンベースのカジュアルダイニング。名古屋城を望むテラス席が人気。ランチデートにもおすすめ。',
    'restaurant',
    '栄',
    '名古屋',
    'https://www.hotpepper.jp/strJ000873420/',
    'hotpepper',
    '3,000〜6,000円',
    '["lunch", "casual", "dinner"]',
    '["fun", "relaxed"]',
    true
  );
