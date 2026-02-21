/**
 * Seed script: JSON → Neon Postgres
 * Usage: npx tsx scripts/seed.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { features } from "../src/lib/schema";
import featuresData from "../src/data/features.json";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql);

  console.log(`Seeding ${featuresData.length} features...`);

  for (const f of featuresData as any[]) {
    await db.insert(features).values({
      slug: f.slug,
      title: f.title,
      subtitle: f.subtitle,
      description: f.description,
      area: f.area,
      tags: f.tags,
      publishedAt: new Date(f.publishedAt),
      updatedAt: new Date(f.updatedAt),
      heroEmoji: f.heroEmoji,
      heroImage: f.heroImage || null,
      spots: f.spots,
      isPublished: true,
    }).onConflictDoNothing();
    console.log(`  ✓ ${f.slug}`);
  }

  console.log("Seed complete!");
}

main().catch(console.error);
