import {
  pgTable,
  text,
  timestamp,
  jsonb,
  serial,
  integer,
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
  isAvailable: boolean("is_available").default(true),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  unavailableCount: integer("unavailable_count").default(0),
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
  photoUrl?: string;
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


// Original Contents (team-created: interviews, photography, etc.)
export const originalContents = pgTable("original_contents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(), // "interview" | "photo" | "review" | "guide"
  mediaUrl: text("media_url"), // image or video URL
  mediaType: varchar("media_type", { length: 20 }), // "image" | "video"
  spotName: varchar("spot_name", { length: 200 }),
  area: varchar("area", { length: 100 }),
  featureSlug: varchar("feature_slug", { length: 200 }),
  tags: jsonb("tags").$type<string[]>().default([]),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Blog Posts (SEOメディア記事)
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  city: varchar("city", { length: 50 }),
  heroImage: text("hero_image"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  isPublished: boolean("is_published").notNull().default(false),
});

// Saved Date Plans (shareable via slug URLs)
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 20 }).notNull().unique(),
  title: text("title").notNull(),
  content: jsonb("content").$type<SavedPlanContent>().notNull(),
  city: varchar("city", { length: 50 }),
  location: varchar("location", { length: 200 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Type for plans content JSONB
export interface SavedPlanContent {
  id: string;
  title: string;
  summary: string;
  timeline: { time: string; duration?: string; activity: string; venue: string; description: string; tip: string }[];
  fashionAdvice: string;
  warnings: string[];
  venues?: unknown[];
  walkingRoute?: unknown;
}

// Chat Sessions (conversation history for AI chat)
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  messages: jsonb("messages").$type<{ role: string; content: string }[]>().default([]),
  area: varchar("area", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// SNS Contents (SNSマルチフォーマット変換結果)
export const snsContents = pgTable("sns_contents", {
  id: serial("id").primaryKey(),
  featureSlug: varchar("feature_slug", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 20 }).notNull(), // "instagram" | "x" | "tiktok"
  content: jsonb("content").$type<SnsContentJson>().notNull(),
  status: varchar("status", { length: 20 }).notNull().default("generated"), // "generated" | "scheduled" | "published" | "failed"
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  platformPostId: varchar("platform_post_id", { length: 255 }),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Type for SNS content JSONB
export type SnsPlatform = "instagram" | "x" | "tiktok";

export interface InstagramContent {
  slides: { text: string }[];
  hashtags: string[];
}

export interface XContent {
  tweets: { text: string }[];
}

export interface TikTokContent {
  hook: string;
  body: string;
  cta: string;
}

export type SnsContentJson = InstagramContent | XContent | TikTokContent;

// ── Email Signups (リード獲得) ──

export const emailSignups = pgTable("email_signups", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  planData: jsonb("plan_data"),
  location: varchar("location", { length: 200 }),
  city: varchar("city", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // "pending" | "sent" | "failed"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

// ── Phase 5: リピーター獲得 ──

// Users (匿名ユーザー — Cookie-based)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  anonId: varchar("anon_id", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
});

// Date History (デート履歴)
export const dateHistory = pgTable("date_history", {
  id: serial("id").primaryKey(),
  anonId: varchar("anon_id", { length: 100 }).notNull(),
  city: varchar("city", { length: 50 }).notNull(),
  area: varchar("area", { length: 100 }).notNull(),
  occasion: varchar("occasion", { length: 50 }).notNull(),
  mood: varchar("mood", { length: 50 }).notNull(),
  budget: varchar("budget", { length: 50 }).notNull(),
  planTitle: text("plan_title").notNull(),
  planData: jsonb("plan_data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// User Preferences (ユーザー嗜好 — 履歴から自動計算)
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  anonId: varchar("anon_id", { length: 100 }).notNull().unique(),
  preferences: jsonb("preferences").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Phase 4: マネタイズ基盤 ──

// Products (自社商材: ブレスケア、会話カード等)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  shortDescription: varchar("short_description", { length: 300 }),
  price: integer("price").notNull(), // 円（税込）
  imageUrl: text("image_url"),
  category: varchar("category", { length: 50 }).notNull(), // "breath-care" | "conversation-card" | "gift" | "experience" | "fashion" | "other"
  // コンテキストマッチング用
  targetOccasions: jsonb("target_occasions").$type<string[]>().default([]),
  targetMoods: jsonb("target_moods").$type<string[]>().default([]),
  targetBudgets: jsonb("target_budgets").$type<string[]>().default([]),
  // Stripe連携
  stripeProductId: varchar("stripe_product_id", { length: 255 }),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  // 管理
  isActive: boolean("is_active").default(true),
  stock: integer("stock"), // null = 無制限
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Product type for JSONB references
export interface ProductJson {
  id: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
}

// Orders (注文)
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  totalAmount: integer("total_amount").notNull(), // 円
  status: varchar("status", { length: 30 }).notNull().default("pending"), // "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded"
  // 顧客情報
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 200 }),
  shippingAddress: text("shipping_address"),
  // Stripe連携
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  // 紐づけ（どのプランから購入したか）
  planSlug: varchar("plan_slug", { length: 20 }),
  // タイムスタンプ
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Partner Venues (提携店舗 — 予約対応)
export const partnerVenues = pgTable("partner_venues", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // "restaurant" | "hotel" | "experience" | "other"
  area: varchar("area", { length: 100 }).notNull(),
  city: varchar("city", { length: 50 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 30 }),
  websiteUrl: text("website_url"),
  imageUrl: text("image_url"),
  bookingUrl: text("booking_url"), // 外部予約URL（ホットペッパー等）
  affiliateUrl: text("affiliate_url"), // アフィリエイトリンクURL
  affiliateProvider: varchar("affiliate_provider", { length: 50 }), // "hotpepper" | "ikyu" | "tabelog" | "otonamie" | "other"
  priceRange: varchar("price_range", { length: 50 }), // "3,000〜5,000円"
  targetOccasions: jsonb("target_occasions").$type<string[]>().default([]), // コンテキストマッチング用
  targetMoods: jsonb("target_moods").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Reservations (予約)
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  reservationNumber: varchar("reservation_number", { length: 50 }).notNull().unique(),
  venueId: integer("venue_id").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"), // "pending" | "confirmed" | "cancelled" | "completed"
  // 予約情報
  date: varchar("date", { length: 10 }).notNull(), // "2026-03-15"
  time: varchar("time", { length: 5 }).notNull(), // "18:00"
  partySize: integer("party_size").notNull().default(2),
  // 顧客情報
  customerName: varchar("customer_name", { length: 200 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 30 }),
  specialRequests: text("special_requests"),
  // 紐づけ
  planSlug: varchar("plan_slug", { length: 20 }),
  // タイムスタンプ
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
