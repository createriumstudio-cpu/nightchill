import {
  pgTable,
  text,
  timestamp,
  jsonb,
  serial,
  boolean,
  varchar,
} from "drizzle-orm/pg-core";

// Features (特集記事)
export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  description: text("description").notNull(),
  area: varchar("area", { length: 100 }).notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  heroEmoji: varchar("hero_emoji", { length: 10 }).notNull(),
  heroImage: text("hero_image"),
  spots: jsonb("spots").$type<SpotJson[]>().notNull().default([]),
  isPublished: boolean("is_published").notNull().default(true),
});

// UGC Posts
export const ugcPosts = pgTable("ugc_posts", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 20 }).notNull(),
  postUrl: text("post_url").notNull(),
  embedHtml: text("embed_html"),
  caption: text("caption"),
  featureSlug: varchar("feature_slug", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

// Admin Audit Log
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  target: text("target"),
  details: jsonb("details"),
  performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow(),
});

// Type for spots JSONB
export interface SpotJson {
  name: string;
  area: string;
  genre: string;
  description: string;
  tip: string;
  instagramHashtag?: string;
  tiktokHashtag?: string;
  embeds: { platform: string; url: string; caption: string }[];
}

// Sponsored Spots (Contextual PR)
export const sponsoredSpots = pgTable("sponsored_spots", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  category: varchar("category", { length: 50 }).notNull(),
  targetAreas: jsonb("target_areas").$type<string[]>().default([]),
  priority: serial("priority"),
  isActive: boolean("is_active").default(true),
  labelJa: varchar("label_ja", { length: 100 }).default("おすすめ"),
  labelEn: varchar("label_en", { length: 100 }).default("Recommended"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
