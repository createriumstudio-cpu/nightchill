// ── 都市マスターデータ ──
// 全国10都市の基本情報とエリアプリセット

export interface CityData {
  /** URL/内部キー用スラッグ（英字小文字） */
  id: string;
  /** 表示名（日本語） */
  name: string;
  /** Google Places 検索で使う都市名 */
  searchName: string;
  /** 都市の簡単な説明 */
  description: string;
  /** エリアプリセット一覧 */
  areas: string[];
  /** ヒーロー画像パス */
  heroImage: string;
  /** 季節・気候の補足（monthlyContext で上書きする場合に使う） */
  climateNote?: string;
}

export const CITIES: CityData[] = [
  {
    id: "tokyo",
    name: "東京",
    searchName: "東京",
    description: "トレンドとカルチャーが交差する首都",
    heroImage: "/images/cities/tokyo.png",
    areas: [
      "渋谷", "新宿", "表参道", "銀座", "六本木",
      "恵比寿", "代官山", "中目黒", "下北沢", "浅草",
      "お台場", "池袋", "吉祥寺",
    ],
  },
  {
    id: "yokohama",
    name: "横浜",
    searchName: "横浜",
    description: "港町の開放感とレトロモダンな街並み",
    heroImage: "/images/cities/yokohama.png",
    areas: [
      "みなとみらい", "中華街", "元町", "関内",
      "山下公園", "赤レンガ倉庫", "馬車道", "野毛",
    ],
  },
  {
    id: "osaka",
    name: "大阪",
    searchName: "大阪",
    description: "食い倒れの街、笑いとエネルギーの都市",
    heroImage: "/images/cities/osaka.png",
    areas: [
      "梅田", "なんば", "心斎橋", "天王寺",
      "北新地", "堀江", "中崎町", "天満",
    ],
  },
  {
    id: "kyoto",
    name: "京都",
    searchName: "京都",
    description: "千年の都、和の美意識が息づく古都",
    heroImage: "/images/cities/kyoto.png",
    areas: [
      "河原町", "祇園", "嵐山", "清水",
      "岡崎", "一乗寺", "北山", "伏見",
    ],
  },
  {
    id: "nagoya",
    name: "名古屋",
    searchName: "名古屋",
    description: "独自の食文化と都市力を持つ中部の拠点",
    heroImage: "/images/cities/nagoya.png",
    areas: [
      "栄", "名駅", "大須", "覚王山",
      "金山", "星が丘", "本山", "千種",
    ],
  },
  {
    id: "fukuoka",
    name: "福岡",
    searchName: "福岡",
    description: "食とコンパクトシティの魅力が詰まった九州の玄関口",
    heroImage: "/images/cities/fukuoka.png",
    areas: [
      "天神", "博多", "中洲", "大名",
      "薬院", "西新", "百道浜", "太宰府",
    ],
  },
  {
    id: "kanazawa",
    name: "金沢",
    searchName: "金沢",
    description: "加賀百万石の歴史と現代アートが調和する北陸の美食都市",
    heroImage: "/images/cities/kanazawa.png",
    areas: [
      "ひがし茶屋街", "片町", "香林坊", "近江町",
      "武蔵", "主計町", "にし茶屋街", "兼六園周辺",
    ],
  },
  {
    id: "kobe",
    name: "神戸",
    searchName: "神戸",
    description: "山と海に挟まれたおしゃれな港町",
    heroImage: "/images/cities/kobe.png",
    areas: [
      "三宮", "元町", "北野", "ハーバーランド",
      "南京町", "旧居留地", "岡本", "有馬温泉",
    ],
  },
  {
    id: "sendai",
    name: "仙台",
    searchName: "仙台",
    description: "杜の都、東北の中心都市",
    heroImage: "/images/cities/sendai.png",
    areas: [
      "国分町", "一番町", "仙台駅前", "定禅寺通",
      "青葉通", "長町", "泉中央", "秋保温泉",
    ],
  },
  {
    id: "hiroshima",
    name: "広島",
    searchName: "広島",
    description: "平和と食の文化が息づく瀬戸内の中心都市",
    heroImage: "/images/cities/hiroshima.png",
    areas: [
      "本通り", "流川", "八丁堀", "紙屋町",
      "袋町", "並木通り", "宮島", "尾道",
    ],
  },
];

/** スラッグ→都市データ のルックアップ */
export function getCityById(id: string): CityData | undefined {
  return CITIES.find((c) => c.id === id);
}

/** 都市名→都市データ のルックアップ */
export function getCityByName(name: string): CityData | undefined {
  return CITIES.find((c) => c.name === name);
}

/** 全都市IDの一覧 */
export const CITY_IDS = CITIES.map((c) => c.id);
