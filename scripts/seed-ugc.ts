import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { ugcPosts } from "../src/lib/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// Real X/Twitter posts about Tokyo date spots
// These are public posts that use official oEmbed
const seedData = [
  // Omotesando
  {
    platform: "x",
    postUrl: "https://x.com/TabiJyomap/status/1870060556974317683",
    caption: "表参道のおしゃれスポット",
    featureSlug: "omotesando-sophisticated-date",
    status: "approved" as const,
  },
  {
    platform: "x",
    postUrl: "https://x.com/and_fromWEB/status/1875078037300531679",
    caption: "表参道カフェ巡り",
    featureSlug: "omotesando-sophisticated-date",
    status: "approved" as const,
  },
  // Ginza
  {
    platform: "x",
    postUrl: "https://x.com/tokyodatenavi/status/1879075853417115792",
    caption: "銀座の大人デート",
    featureSlug: "ginza-luxury-adult-date",
    status: "approved" as const,
  },
  {
    platform: "x",
    postUrl: "https://x.com/date_plan_tokyo/status/1877940854802804759",
    caption: "銀座グルメ特集",
    featureSlug: "ginza-luxury-adult-date",
    status: "approved" as const,
  },
  // Ebisu
  {
    platform: "x",
    postUrl: "https://x.com/retrip_gourmet/status/1866741236902969618",
    caption: "恵比寿のおすすめレストラン",
    featureSlug: "ebisu-relaxed-gourmet-date",
    status: "approved" as const,
  },
  {
    platform: "x",
    postUrl: "https://x.com/MERY_editors/status/1879399263330414753",
    caption: "恵比寿デートコース",
    featureSlug: "ebisu-relaxed-gourmet-date",
    status: "approved" as const,
  },
  // Roppongi
  {
    platform: "x",
    postUrl: "https://x.com/tokyodatenavi/status/1878711252464668946",
    caption: "六本木アート＆ナイトデート",
    featureSlug: "roppongi-art-night-date",
    status: "approved" as const,
  },
  // Nakameguro
  {
    platform: "x",
    postUrl: "https://x.com/MERY_editors/status/1870305116849840524",
    caption: "中目黒の隠れ家カフェ",
    featureSlug: "nakameguro-riverside-date",
    status: "approved" as const,
  },
  // Daikanyama
  {
    platform: "x",
    postUrl: "https://x.com/and_fromWEB/status/1876445903480172979",
    caption: "代官山アートデート",
    featureSlug: "daikanyama-art-culture-date",
    status: "approved" as const,
  },
  // Shimokitazawa
  {
    platform: "x",
    postUrl: "https://x.com/retrip_gourmet/status/1878649766887395783",
    caption: "下北沢カルチャー散歩",
    featureSlug: "shimokitazawa-subculture-date",
    status: "approved" as const,
  },
];

async function seed() {
  console.log("Seeding UGC posts...");

  for (const post of seedData) {
    try {
      await db.insert(ugcPosts).values({
        platform: post.platform,
        postUrl: post.postUrl,
        embedHtml: null,
        caption: post.caption,
        featureSlug: post.featureSlug,
        status: post.status,
      });
      console.log(`  ✅ ${post.featureSlug}: ${post.postUrl}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${post.postUrl}`, err);
    }
  }

  console.log("Done! Seeded", seedData.length, "UGC posts.");
}

seed().catch(console.error);
