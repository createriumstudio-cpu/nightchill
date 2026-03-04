#!/bin/bash
# ============================================================
# Gemini生成画像をリネームコピーするスクリプト
# ローカル環境で実行してください
# ============================================================

set -e

DEST="public/images/features"
mkdir -p "$DEST"

# ~/Downloads/ の "Generated Image" PNGを日時順（新しい順）で取得
FILES=($(ls -t ~/Downloads/Generated\ Image*.png 2>/dev/null | head -6))

if [ ${#FILES[@]} -lt 6 ]; then
  echo "Error: 6枚の画像が見つかりません（${#FILES[@]}枚のみ）"
  echo "~/Downloads/ に 'Generated Image*.png' が6枚以上あるか確認してください"
  exit 1
fi

# ファイルの日時順（新しいものから）でマッピング
NAMES=(
  "nagoya-seasonal-menu.png"
  "nagoya-kakuozan.png"
  "fukuoka-sakura.png"
  "fukuoka-tenjin.png"
  "kanazawa-kenrokuen.png"
  "kanazawa-higashi.png"
)

echo "=== コピー対象 ==="
for i in "${!FILES[@]}"; do
  echo "  ${FILES[$i]}"
  echo "    → ${DEST}/${NAMES[$i]}"
done

echo ""
read -p "実行しますか？ (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "キャンセルしました"
  exit 0
fi

for i in "${!FILES[@]}"; do
  cp "${FILES[$i]}" "${DEST}/${NAMES[$i]}"
  echo "✓ ${NAMES[$i]}"
done

echo ""
echo "=== 完了 ==="
echo "次のステップ:"
echo "  1. git add ${DEST}/"
echo "  2. Neonコンソールで scripts/update-hero-images.sql を実行"
