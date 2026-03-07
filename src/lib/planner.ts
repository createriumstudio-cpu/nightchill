import type { PlanRequest, DatePlan, TimelineItem } from "./types";
import { activityLabels, relationshipLabels } from "./types";
import { getCityById } from "./cities";

// ============================================================
// 都市別デフォルト店舗名
// テンプレートフォールバック時にvenueフィールドに具体的な店名を入れるため
// ============================================================
interface CityVenues {
  cafe: string[];
  restaurant: string[];
  bar: string[];
  spot: string[];
}

const CITY_DEFAULT_VENUES: Record<string, CityVenues> = {
  tokyo: {
    cafe: ["ABOUT LIFE COFFEE BREWERS", "猿田彦珈琲 恵比寿本店", "Blue Bottle Coffee 清澄白河"],
    restaurant: ["AFURI 恵比寿", "bills 表参道", "PIZZA SLICE"],
    bar: ["Bar BenFiddich", "Star Bar Ginza"],
    spot: ["代々木公園", "恵比寿ガーデンプレイス", "東京都庭園美術館"],
  },
  yokohama: {
    cafe: ["CAFE ELLIOTT AVENUE", "LATTE GRAPHIC 横浜中華街"],
    restaurant: ["崎陽軒本店", "スカンディヤ"],
    bar: ["Bar Noble", "Yokohama Bay Sheraton Bar"],
    spot: ["山下公園", "赤レンガ倉庫", "港の見える丘公園"],
  },
  osaka: {
    cafe: ["LiLo Coffee Roasters", "ELEPHANT FACTORY COFFEE"],
    restaurant: ["大阪トンテキ", "美津の お好み焼き"],
    bar: ["Bar K 北新地", "Bar Augusta Tarlogie"],
    spot: ["中之島公園", "天保山大観覧車", "なんばグランド花月"],
  },
  kyoto: {
    cafe: ["% ARABICA Kyoto 東山", "ブルーボトルコーヒー京都カフェ"],
    restaurant: ["京都 瓢亭", "先斗町 いづもや"],
    bar: ["Bar Cordon Noir", "Bar K6"],
    spot: ["哲学の道", "南禅寺", "鴨川沿い"],
  },
  nagoya: {
    cafe: ["TRUNK COFFEE", "コメダ珈琲店 本店"],
    restaurant: ["矢場とん 矢場町本店", "山本屋本店 栄本町通店"],
    bar: ["Bar Dunn", "Bar Main Malt"],
    spot: ["オアシス21", "名古屋城", "大須商店街"],
  },
  fukuoka: {
    cafe: ["REC COFFEE 薬院店", "NO COFFEE"],
    restaurant: ["博多一双 博多駅東本店", "もつ鍋 やま中 赤坂店"],
    bar: ["Bar Higuchi", "Bar Oscar"],
    spot: ["大濠公園", "キャナルシティ博多", "太宰府天満宮"],
  },
  kanazawa: {
    cafe: ["MORON CAFE", "東山ボヌール"],
    restaurant: ["もりもり寿し 近江町店", "いたる 本店"],
    bar: ["Bar 一葉", "More 片町店"],
    spot: ["兼六園", "ひがし茶屋街", "21世紀美術館"],
  },
  kobe: {
    cafe: ["TOOTH TOOTH maison15th", "Cafe Freundlieb"],
    restaurant: ["ステーキランド 神戸館", "元町ドリア"],
    bar: ["Bar Savoy Hommage", "Bar ALBION"],
    spot: ["メリケンパーク", "北野異人館街", "神戸ハーバーランド"],
  },
  sendai: {
    cafe: ["Cafe Mozart Figaro", "SENDAI COFFEE STAND"],
    restaurant: ["牛たん炭焼 利久 一番町本店", "味の牛たん喜助 一番町店"],
    bar: ["Bar Andy", "Bar CIPRIANI"],
    spot: ["定禅寺通", "仙台朝市", "瑞鳳殿"],
  },
  hiroshima: {
    cafe: ["43 Coffee Roasters", "SUZU CAFE 広島"],
    restaurant: ["みっちゃん総本店 八丁堀本店", "かき船 かなわ"],
    bar: ["Bar Renoir", "Bar Alchemist"],
    spot: ["平和記念公園", "縮景園", "おりづるタワー"],
  },
};

/** 都市IDまたはエリア名からデフォルト店舗を取得 */
function getVenues(cityId: string): CityVenues {
  return CITY_DEFAULT_VENUES[cityId] || CITY_DEFAULT_VENUES.tokyo;
}

/** 配列からランダムに1つ取得（重複回避） */
function pickRandom(arr: string[], used: Set<string>): string {
  const available = arr.filter(v => !used.has(v));
  if (available.length === 0) return arr[0];
  const picked = available[Math.floor(Math.random() * available.length)];
  used.add(picked);
  return picked;
}

// Template-based fallback planner (used when ANTHROPIC_API_KEY is not set)
export function generateDatePlan(request: PlanRequest): DatePlan {
  const cityData = getCityById(request.city || "tokyo");
  const cityName = cityData?.name || "東京";
  const area = request.location || cityName;
  const activitiesText = request.activities.map(a => activityLabels[a]).join("・");
  const relationText = relationshipLabels[request.relationship];

  const venues = getVenues(request.city || "tokyo");
  const used = new Set<string>();

  const timeline: TimelineItem[] = [];

  // Build timeline based on activities
  if (request.startTime && request.endTime) {
    const [sh] = request.startTime.split(":").map(Number);
    const [eh] = request.endTime.split(":").map(Number);
    const hours = eh - sh;

    if (hours <= 3) {
      timeline.push(
        { time: request.startTime, activity: `${area}でカフェタイム`, venue: pickRandom(venues.cafe, used), description: "カフェ", tip: "予約しておくとスムーズ", duration: "60分" },
        { time: `${sh + 1}:30`, activity: `${area}周辺を散策`, venue: pickRandom(venues.spot, used), description: "散歩・散策", tip: "写真スポットをチェック", duration: "60分" },
      );
    } else {
      timeline.push(
        { time: request.startTime, activity: `${area}エリアで合流・ランチ`, venue: pickRandom(venues.restaurant, used), description: "ランチ", tip: "人気店は予約がベター", duration: "60分" },
        { time: `${sh + 2}:00`, activity: `${area}周辺を散策`, venue: pickRandom(venues.spot, used), description: "散歩・散策", tip: "写真スポットをチェック", duration: "60分" },
        { time: `${sh + 3}:00`, activity: "カフェで休憩", venue: pickRandom(venues.cafe, used), description: "カフェ", tip: "疲れたら無理せず休もう", duration: "45分" },
      );
      if (hours >= 6) {
        timeline.push(
          { time: `${eh - 2}:00`, activity: `${area}のレストランでディナー`, venue: pickRandom(venues.restaurant, used), description: "ディナー", tip: "予約は必須", duration: "90分" },
        );
      }
    }
  } else {
    // Default 4-spot plan
    timeline.push(
      { time: "12:00", activity: `${area}でランチ`, venue: pickRandom(venues.restaurant, used), description: "ランチ", tip: "人気店は予約がベター", duration: "60分" },
      { time: "14:00", activity: `${area}エリアを散策`, venue: pickRandom(venues.spot, used), description: "散歩・散策", tip: "天気をチェックして", duration: "60分" },
      { time: "16:00", activity: "カフェでまったり", venue: pickRandom(venues.cafe, used), description: "カフェ", tip: "会話を楽しむ時間に", duration: "45分" },
      { time: "18:30", activity: `${area}のレストランでディナー`, venue: pickRandom(venues.restaurant, used), description: "ディナー", tip: "予約しておくと安心", duration: "90分" },
    );
  }

  return {
    id: `plan-${Date.now()}`,
    title: `${area}${activitiesText}デート`,
    summary: `${relationText}と${area}で${activitiesText}を楽しむプランです。`,
    timeline,
    fashionAdvice: "きれいめカジュアルがおすすめ。歩きやすい靴を忘れずに。",
    warnings: request.ageGroup === "under-20"
      ? ["20歳未満のためアルコール提供店は含まれていません"]
      : [],
  };
}
