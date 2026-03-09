/**
 * GA4 イベント送信ユーティリティ
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
