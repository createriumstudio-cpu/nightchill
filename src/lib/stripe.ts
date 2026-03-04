/**
 * Stripe決済ユーティリティ
 *
 * サーバーサイドのStripeクライアント初期化。
 * STRIPE_SECRET_KEY未設定時はnullを返す（決済機能無効化）。
 */

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("STRIPE_SECRET_KEY not set — payment features disabled");
    return null;
  }

  _stripe = new Stripe(key, {
    apiVersion: "2026-02-25.clover",
  });
  return _stripe;
}

/**
 * 注文番号を生成 (FT-YYYYMMDD-XXXX形式)
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FT-${date}-${random}`;
}

/**
 * 予約番号を生成 (FR-YYYYMMDD-XXXX形式)
 */
export function generateReservationNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FR-${date}-${random}`;
}
