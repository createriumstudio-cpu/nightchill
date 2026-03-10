import { Resend } from "resend";
import type { DatePlan } from "./types";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@futatabito.com";

function buildPlanEmailHtml(plan: DatePlan, siteUrl: string): string {
  const timelineHtml = plan.timeline
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;vertical-align:top;white-space:nowrap;color:#f97316;font-weight:600;font-size:14px;">${item.time}</td>
          <td style="padding:8px 12px;vertical-align:top;">
            <div style="font-weight:600;font-size:14px;color:#1f2937;">${item.activity}</div>
            ${item.venue ? `<div style="font-size:13px;color:#f97316;margin-top:2px;">📍 ${item.venue}</div>` : ""}
            ${item.tip ? `<div style="font-size:12px;color:#9ca3af;margin-top:2px;">💡 ${item.tip}</div>` : ""}
          </td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#f97316,#fb923c);padding:32px 24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">あなたのデートプランが完成しました 🎉</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">futatabito があなたのためにプランを作りました</p>
      </div>
      <!-- Content -->
      <div style="padding:24px;">
        <h2 style="margin:0 0 8px;font-size:22px;color:#1f2937;">${plan.title}</h2>
        <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;">${plan.summary}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          ${timelineHtml}
        </table>
        <div style="text-align:center;">
          <a href="${siteUrl}/plan" style="display:inline-block;background:#f97316;color:#ffffff;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;">新しいプランを作成する</a>
        </div>
      </div>
      <!-- Footer -->
      <div style="padding:16px 24px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          <a href="${siteUrl}" style="color:#f97316;text-decoration:none;font-weight:600;">futatabito</a> — ふたりが楽しめる場所を、AIが30秒で見つける。
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendPlanEmail(
  email: string,
  plan: DatePlan
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set — skipping email send to:", email);
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.futatabito.com";

  try {
    await resend.emails.send({
      from: `futatabito <${FROM_EMAIL}>`,
      to: email,
      subject: "あなたのデートプランが完成しました🎉",
      html: buildPlanEmailHtml(plan, siteUrl),
    });
    return { success: true };
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return { success: false, error: String(err) };
  }
}
