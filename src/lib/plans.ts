import crypto from "crypto";
import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { plans } from "./schema";
import type { DatePlan } from "./types";

export function generateSlug(): string {
  return crypto.randomBytes(6).toString("base64url");
}

export async function savePlan(
  plan: DatePlan,
  city?: string,
  location?: string,
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  // Retry up to 3 times for slug collision
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = generateSlug();
    try {
      await db.insert(plans).values({
        slug,
        title: plan.title,
        city: city || null,
        location: location || null,
        content: {
          id: plan.id,
          title: plan.title,
          summary: plan.summary,
          timeline: plan.timeline,
          fashionAdvice: plan.fashionAdvice,
          warnings: plan.warnings,
          venues: plan.venues,
          walkingRoute: plan.walkingRoute,
        },
      });
      return slug;
    } catch (e: unknown) {
      const isUniqueViolation =
        e instanceof Error && e.message.includes("unique");
      if (!isUniqueViolation) {
        console.error("Failed to save plan:", e);
        return null;
      }
      // Slug collision — retry with new slug
    }
  }

  console.error("Failed to generate unique slug after 3 attempts");
  return null;
}

export interface SavedPlan {
  slug: string;
  title: string;
  plan: DatePlan;
  city: string | null;
  location: string | null;
  createdAt: Date;
}

export async function getPlanBySlug(
  slug: string,
): Promise<SavedPlan | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const rows = await db
      .select()
      .from(plans)
      .where(eq(plans.slug, slug));

    if (rows.length === 0) return null;

    const row = rows[0];
    const content = row.content as DatePlan;

    return {
      slug: row.slug,
      title: row.title,
      plan: {
        id: content.id,
        title: content.title,
        summary: content.summary,
        timeline: content.timeline,
        fashionAdvice: content.fashionAdvice ?? "",
        warnings: content.warnings ?? [],
        venues: content.venues,
        walkingRoute: content.walkingRoute,
      },
      city: row.city,
      location: row.location,
      createdAt: row.createdAt,
    };
  } catch (e) {
    console.error("Failed to fetch plan by slug:", e);
    return null;
  }
}

export async function updatePlanContent(
  slug: string,
  plan: DatePlan,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db
      .update(plans)
      .set({
        content: {
          id: plan.id,
          title: plan.title,
          summary: plan.summary,
          timeline: plan.timeline,
          fashionAdvice: plan.fashionAdvice,
          warnings: plan.warnings,
          venues: plan.venues,
          walkingRoute: plan.walkingRoute,
        },
      })
      .where(eq(plans.slug, slug));
    return true;
  } catch (e) {
    console.error("Failed to update plan:", e);
    return false;
  }
}

export async function getRecentPlanSlugs(
  limit: number = 100,
): Promise<string[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const rows = await db
      .select({ slug: plans.slug })
      .from(plans)
      .orderBy(desc(plans.createdAt))
      .limit(limit);

    return rows.map((r) => r.slug);
  } catch (e) {
    console.error("Failed to fetch plan slugs:", e);
    return [];
  }
}
