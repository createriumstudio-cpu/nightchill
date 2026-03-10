/**
 * GA4 イベント送信ユーティリティ
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * アフィリエイトリンクのクリックをGA4に送信する
 */
export function trackAffiliateClick(
  venueName: string,
  url: string,
  location: string
): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "affiliate_click", {
      venue_name: venueName,
      affiliate_url: url,
      click_location: location,
    });
  }
}
