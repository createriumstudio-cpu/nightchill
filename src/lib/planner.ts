import { type PlanRequest, type DatePlan, type TimelineItem } from "./types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

const timelineTemplates: Record<string, TimelineItem[]> = {
  "first-date": [
    {
      time: "18:00",
      activity: "待ち合わせ - カフェで軽くドリンク",
      tip: "少し早めに到着して余裕を見せましょう。最初の5分で相手の服装を褒めると好印象です。",
    },
    {
      time: "19:00",
      activity: "ディナー - 会話しやすい落ち着いたレストラン",
      tip: "カウンター席か隣り合わせの席を選びましょう。正面よりリラックスできます。",
    },
    {
      time: "20:30",
      activity: "夜の散歩 - ライトアップされたスポット",
      tip: "歩きながらの会話は沈黙が自然で緊張が和らぎます。",
    },
    {
      time: "21:30",
      activity: "バーで一杯 - 静かなバーで余韻を楽しむ",
      tip: "「もう少し一緒にいたい」と素直に伝えるのが効果的です。次のデートの約束も忘れずに。",
    },
  ],
  anniversary: [
    {
      time: "16:00",
      activity: "サプライズの準備 - 花束やプレゼントの手配",
      tip: "手書きのメッセージカードを添えると特別感が増します。",
    },
    {
      time: "18:00",
      activity: "特別なレストランでディナー",
      tip: "事前に記念日であることを伝え、デザートプレートにメッセージを入れてもらいましょう。",
    },
    {
      time: "20:00",
      activity: "思い出の場所を巡る",
      tip: "「あの時こうだったね」と思い出を語ることで絆が深まります。",
    },
    {
      time: "21:30",
      activity: "夜景スポットで二人だけの時間",
      tip: "これまでの感謝と、これからの未来について話しましょう。",
    },
  ],
  birthday: [
    {
      time: "12:00",
      activity: "お祝いメッセージを送る",
      tip: "朝一番のメッセージは特別感があります。日中はあえて少し控えめに。",
    },
    {
      time: "17:00",
      activity: "待ち合わせ - プレゼントを渡す",
      tip: "相手の反応を楽しみましょう。プレゼントを選んだ理由も伝えると喜ばれます。",
    },
    {
      time: "18:30",
      activity: "特別なディナー",
      tip: "相手の好きな料理のレストランを予約。バースデーケーキの手配も忘れずに。",
    },
    {
      time: "21:00",
      activity: "二人だけのアフターパーティー",
      tip: "「今日は一日楽しかった？」と相手の気持ちを大切にしましょう。",
    },
  ],
  proposal: [
    {
      time: "15:00",
      activity: "身だしなみと最終準備",
      tip: "指輪の確認、服装のチェック。深呼吸して落ち着きましょう。",
    },
    {
      time: "17:00",
      activity: "二人の思い出の場所へ",
      tip: "プロポーズの前に思い出話をすることで、感動が増します。",
    },
    {
      time: "19:00",
      activity: "特別なディナー - 個室がベスト",
      tip: "食事を楽しんでからプロポーズのタイミングを計りましょう。",
    },
    {
      time: "21:00",
      activity: "プロポーズの瞬間",
      tip: "自分の言葉で気持ちを伝えましょう。完璧でなくても、誠実さが一番大切です。",
    },
  ],
  casual: [
    {
      time: "14:00",
      activity: "カフェでまったりスタート",
      tip: "気張らない雰囲気が大切。自然体でいられる場所を選びましょう。",
    },
    {
      time: "15:30",
      activity: "街ブラ・ショッピング",
      tip: "相手の興味に合わせて歩くルートを決めると好印象です。",
    },
    {
      time: "17:30",
      activity: "気になるお店でアーリーディナー",
      tip: "堅くなりすぎず、お互いの近況を楽しく話しましょう。",
    },
    {
      time: "19:30",
      activity: "映画や公園でリラックス",
      tip: "「また会いたい」と思ってもらえるよう、程よい距離感を保ちましょう。",
    },
  ],
  makeup: [
    {
      time: "17:00",
      activity: "静かなカフェで待ち合わせ",
      tip: "まず自分から謝ることが大切。言い訳ではなく、相手の気持ちに寄り添いましょう。",
    },
    {
      time: "18:30",
      activity: "相手の好きな場所でディナー",
      tip: "相手の話をしっかり聞くこと。遮らずに、気持ちを受け止めましょう。",
    },
    {
      time: "20:00",
      activity: "ゆっくり散歩しながら会話",
      tip: "これからどうしたいか、前向きな話をしましょう。",
    },
    {
      time: "21:00",
      activity: "小さなプレゼントやサプライズ",
      tip: "高価なものより、相手のことを考えて選んだものが心に響きます。",
    },
  ],
};

const fashionAdviceMap: Record<string, Record<string, string>> = {
  romantic: {
    default:
      "ダークトーンのジャケットにきれいめパンツ。アクセサリーは控えめに。清潔感のある香水をほんのり。",
  },
  fun: {
    default:
      "スマートカジュアルがベスト。きれいめデニムにシャツ、足元はスニーカーでもOK。明るめの色を取り入れて。",
  },
  relaxed: {
    default:
      "カジュアルだけど清潔感のある服装。ニットやカーディガンで柔らかい印象を。",
  },
  luxurious: {
    default:
      "スーツまたはジャケット＆スラックス。良い靴と時計がポイント。ポケットチーフで差をつけて。",
  },
  adventurous: {
    default:
      "動きやすいけどおしゃれなアウトドアスタイル。機能性とデザイン性を両立させて。",
  },
};

const conversationTopicsByOccasion: Record<string, string[]> = {
  "first-date": [
    "最近ハマっていることや趣味の話",
    "旅行の思い出や行きたい場所",
    "好きな食べ物やレストランの話",
    "仕事のやりがいや夢の話（深くなりすぎない程度に）",
  ],
  anniversary: [
    "二人が出会った頃の思い出",
    "一緒に過ごした中で一番印象的だったこと",
    "これからやりたいこと・行きたい場所",
    "お互いの成長や感謝していること",
  ],
  birthday: [
    "相手の今年の目標や夢",
    "一緒にやりたい新しいこと",
    "楽しかった思い出",
    "相手の魅力や尊敬しているところ",
  ],
  proposal: [
    "二人の出会いから今日までの物語",
    "相手と一緒にいて幸せだと感じる瞬間",
    "将来の夢や一緒に叶えたいこと",
  ],
  casual: [
    "最近観た映画やドラマ",
    "週末の過ごし方",
    "共通の友人や趣味の話",
    "気になるニュースやトレンド",
  ],
  makeup: [
    "相手の気持ちを聞く（まず聴くことが大切）",
    "自分の反省点を素直に伝える",
    "これからの関係をどうしていきたいか",
    "相手を大切に思っている気持ち",
  ],
};

const warningsByOccasion: Record<string, string[]> = {
  "first-date": [
    "スマートフォンはカバンにしまいましょう",
    "過去の恋愛話は避けましょう",
    "自分の話ばかりにならないように注意",
    "お酒の飲みすぎに注意",
  ],
  anniversary: [
    "記念日を忘れていたふりは絶対にNG",
    "他の異性の話題は避けましょう",
    "当たり前になってしまっている感謝を言葉にしましょう",
  ],
  birthday: [
    "プレゼントの金額を自慢しないこと",
    "相手の好みをリサーチしておくこと",
    "サプライズは相手の性格に合わせて",
  ],
  proposal: [
    "人前でのプロポーズは相手の性格を考慮",
    "緊張しても焦らないこと",
    "相手の返事を急かさないこと",
  ],
  casual: [
    "リラックスしすぎて雑にならないように",
    "相手のペースに合わせることを忘れずに",
  ],
  makeup: [
    "言い訳や責任転嫁は絶対にNG",
    "「でも」「だって」を使わないこと",
    "相手が話し終わるまで待つこと",
    "焦って距離を縮めすぎないこと",
  ],
};

function getTitleForPlan(occasion: string, mood: string): string {
  const titles: Record<string, Record<string, string>> = {
    "first-date": {
      romantic: "ロマンチックな初デートプラン",
      fun: "楽しさ溢れる初デートプラン",
      relaxed: "リラックス初デートプラン",
      luxurious: "特別感のある初デートプラン",
      adventurous: "ワクワク初デートプラン",
    },
    anniversary: {
      romantic: "ロマンチック記念日デートプラン",
      fun: "思い出いっぱい記念日プラン",
      relaxed: "のんびり記念日デートプラン",
      luxurious: "極上の記念日デートプラン",
      adventurous: "アクティブ記念日プラン",
    },
    birthday: {
      romantic: "ロマンチック誕生日デートプラン",
      fun: "サプライズ満載の誕生日プラン",
      relaxed: "まったり誕生日デートプラン",
      luxurious: "贅沢な誕生日デートプラン",
      adventurous: "冒険誕生日プラン",
    },
    proposal: {
      romantic: "感動のプロポーズプラン",
      fun: "二人らしいプロポーズプラン",
      relaxed: "自然体のプロポーズプラン",
      luxurious: "極上のプロポーズプラン",
      adventurous: "サプライズプロポーズプラン",
    },
    casual: {
      romantic: "さりげなくロマンチックなデート",
      fun: "気軽に楽しむデートプラン",
      relaxed: "ゆったりカジュアルデート",
      luxurious: "ちょっと贅沢なカジュアルデート",
      adventurous: "新発見カジュアルデート",
    },
    makeup: {
      romantic: "心を込めた仲直りプラン",
      fun: "笑顔を取り戻す仲直りプラン",
      relaxed: "ゆっくり向き合う仲直りプラン",
      luxurious: "特別な仲直りプラン",
      adventurous: "新しい一歩の仲直りプラン",
    },
  };

  return (
    titles[occasion]?.[mood] ??
    `futatabito デートプラン`
  );
}

export function generateDatePlan(request: PlanRequest): DatePlan {
  const timeline =
    timelineTemplates[request.occasion] ?? timelineTemplates["casual"];

  const fashionAdvice =
    fashionAdviceMap[request.mood]?.default ??
    fashionAdviceMap["relaxed"].default;

  const conversationTopics =
    conversationTopicsByOccasion[request.occasion] ??
    conversationTopicsByOccasion["casual"];

  const warnings =
    warningsByOccasion[request.occasion] ?? warningsByOccasion["casual"];

  return {
    id: generateId(),
    title: getTitleForPlan(request.occasion, request.mood),
    summary: `${request.location}での${request.occasion === "first-date" ? "初デート" : "デート"}プラン。${request.partnerInterests ? `相手の好み（${request.partnerInterests}）を考慮した` : ""}おすすめプランです。`,
    occasion: request.occasion,
    mood: request.mood,
    timeline,
    fashionAdvice,
    conversationTopics,
    warnings,
  };
}
