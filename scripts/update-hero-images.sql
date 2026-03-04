-- ============================================================
-- 週次記事のhero_image更新スクリプト
-- Neonコンソール (https://console.neon.tech/) で実行してください
-- ============================================================

-- まず現在の週次記事を確認（名古屋・福岡・金沢）
SELECT id, slug, title, area, hero_image, published_at
FROM features
WHERE slug LIKE 'nagoya-%'
   OR slug LIKE 'fukuoka-%'
   OR slug LIKE 'kanazawa-%'
ORDER BY published_at DESC;

-- ============================================================
-- hero_image 更新
-- ============================================================

-- 名古屋: seasonal-menu系 → nagoya-seasonal-menu.png
UPDATE features
SET hero_image = '/images/features/nagoya-seasonal-menu.png',
    updated_at = NOW()
WHERE slug LIKE 'nagoya-seasonal-menu-%';

-- 名古屋: kakuozan系（classic-date or new-spots で覚王山エリア）→ nagoya-kakuozan.png
-- ※ slugがnagoya-で始まり、seasonal-menuでないもの
UPDATE features
SET hero_image = '/images/features/nagoya-kakuozan.png',
    updated_at = NOW()
WHERE slug LIKE 'nagoya-%'
  AND slug NOT LIKE 'nagoya-seasonal-menu-%'
  AND hero_image IS NULL;

-- 福岡: sakura系（seasonal-menu = 桜・春限定）→ fukuoka-sakura.png
UPDATE features
SET hero_image = '/images/features/fukuoka-sakura.png',
    updated_at = NOW()
WHERE slug LIKE 'fukuoka-seasonal-menu-%';

-- 福岡: tenjin系（天神エリア = new-spots or classic-date）→ fukuoka-tenjin.png
UPDATE features
SET hero_image = '/images/features/fukuoka-tenjin.png',
    updated_at = NOW()
WHERE slug LIKE 'fukuoka-%'
  AND slug NOT LIKE 'fukuoka-seasonal-menu-%'
  AND hero_image IS NULL;

-- 金沢: kenrokuen/gourmet系（兼六園周辺）→ kanazawa-kenrokuen.png
UPDATE features
SET hero_image = '/images/features/kanazawa-kenrokuen.png',
    updated_at = NOW()
WHERE slug LIKE 'kanazawa-new-spots-%'
   OR slug LIKE 'kanazawa-seasonal-menu-%';

-- 金沢: 残り（ひがし茶屋街など）→ kanazawa-higashi.png
UPDATE features
SET hero_image = '/images/features/kanazawa-higashi.png',
    updated_at = NOW()
WHERE slug LIKE 'kanazawa-%'
  AND hero_image IS NULL;

-- ============================================================
-- 更新結果確認
-- ============================================================
SELECT id, slug, title, hero_image, updated_at
FROM features
WHERE slug LIKE 'nagoya-%'
   OR slug LIKE 'fukuoka-%'
   OR slug LIKE 'kanazawa-%'
ORDER BY published_at DESC;
