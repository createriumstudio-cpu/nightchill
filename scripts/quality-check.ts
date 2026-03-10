/**
 * Content quality check script
 * Usage: npx tsx scripts/quality-check.ts
 *
 * Checks features.json for data quality issues and sends a report via Resend.
 */
import { Resend } from "resend";
import featuresData from "../src/data/features.json";

interface QualityIssue {
  slug: string;
  title: string;
  problems: string[];
}

interface QualityReport {
  date: string;
  totalChecked: number;
  passed: number;
  failed: number;
  issues: QualityIssue[];
}

function checkFeatures(): QualityReport {
  const date = new Date().toISOString().split("T")[0];
  const issues: QualityIssue[] = [];

  for (const feature of featuresData) {
    const problems: string[] = [];
    const f = feature as Record<string, unknown>;

    // title exists
    if (!f.title || typeof f.title !== "string" || f.title.trim() === "") {
      problems.push("title が未設定です");
    }

    // description exists and is 100+ chars
    if (!f.description || typeof f.description !== "string" || f.description.trim() === "") {
      problems.push("description が未設定です");
    } else if (f.description.length < 100) {
      problems.push(`description が短すぎます（${f.description.length}文字 / 最低100文字）`);
    }

    // imageUrl or heroImage validation
    const imageUrl = (f.imageUrl || f.heroImage) as string | undefined;
    if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
      problems.push("imageUrl / heroImage が未設定です");
    } else if (!imageUrl.startsWith("/api/og") && !imageUrl.startsWith("https://")) {
      problems.push(`imageUrl の形式が不正です: ${imageUrl}（/api/og または https:// で始まる必要があります）`);
    }

    // spots has 1+ items
    const spots = f.spots as unknown[] | undefined;
    if (!Array.isArray(spots) || spots.length === 0) {
      problems.push("spots が0件です（1件以上必要）");
    }

    if (problems.length > 0) {
      issues.push({
        slug: (f.slug as string) || "unknown",
        title: (f.title as string) || "(タイトルなし)",
        problems,
      });
    }
  }

  return {
    date,
    totalChecked: featuresData.length,
    passed: featuresData.length - issues.length,
    failed: issues.length,
    issues,
  };
}

function buildReportHtml(report: QualityReport): string {
  const statusColor = report.failed === 0 ? "#22c55e" : "#ef4444";
  const statusText = report.failed === 0 ? "ALL PASSED ✅" : `${report.failed}件の問題あり ⚠️`;

  const issuesHtml = report.issues
    .map(
      (issue) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#1f2937;">${issue.title}<br><span style="font-size:12px;color:#9ca3af;">${issue.slug}</span></td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">
          <ul style="margin:0;padding-left:16px;">
            ${issue.problems.map((p) => `<li style="font-size:13px;color:#ef4444;">${p}</li>`).join("")}
          </ul>
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:18px;">futatabito コンテンツ品質レポート</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">${report.date}</p>
      </div>
      <div style="padding:24px;">
        <div style="display:flex;gap:16px;margin-bottom:24px;text-align:center;">
          <div style="flex:1;padding:12px;background:#f9fafb;border-radius:8px;">
            <div style="font-size:24px;font-weight:700;color:#1f2937;">${report.totalChecked}</div>
            <div style="font-size:12px;color:#6b7280;">チェック件数</div>
          </div>
          <div style="flex:1;padding:12px;background:#f0fdf4;border-radius:8px;">
            <div style="font-size:24px;font-weight:700;color:#22c55e;">${report.passed}</div>
            <div style="font-size:12px;color:#6b7280;">合格</div>
          </div>
          <div style="flex:1;padding:12px;background:${report.failed > 0 ? "#fef2f2" : "#f9fafb"};border-radius:8px;">
            <div style="font-size:24px;font-weight:700;color:${statusColor};">${report.failed}</div>
            <div style="font-size:12px;color:#6b7280;">不合格</div>
          </div>
        </div>
        <p style="text-align:center;font-size:16px;font-weight:600;color:${statusColor};margin-bottom:24px;">${statusText}</p>
        ${
          report.issues.length > 0
            ? `<table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280;">記事</th>
                    <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280;">問題</th>
                  </tr>
                </thead>
                <tbody>${issuesHtml}</tbody>
              </table>`
            : '<p style="text-align:center;color:#22c55e;">すべての記事が品質基準を満たしています。</p>'
        }
      </div>
      <div style="padding:16px 24px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">futatabito 自動品質チェックシステム</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendReport(report: QualityReport): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[quality-check] RESEND_API_KEY not set — skipping email");
    console.log("[quality-check] Report:", JSON.stringify(report, null, 2));
    return;
  }

  const resend = new Resend(apiKey);
  const subject = `[futatabito] 週次コンテンツ品質レポート ${report.date}`;

  await resend.emails.send({
    from: "futatabito <noreply@futatabito.com>",
    to: "createriumstudio@gmail.com",
    subject,
    html: buildReportHtml(report),
  });

  console.log(`[quality-check] Report sent to createriumstudio@gmail.com`);
}

async function main() {
  console.log("[quality-check] Starting content quality check...");

  const report = checkFeatures();

  console.log(`[quality-check] Checked: ${report.totalChecked}, Passed: ${report.passed}, Failed: ${report.failed}`);

  if (report.issues.length > 0) {
    for (const issue of report.issues) {
      console.log(`  ❌ ${issue.slug}: ${issue.problems.join(", ")}`);
    }
  } else {
    console.log("  ✅ All features passed quality checks");
  }

  await sendReport(report);

  // Exit with non-zero if there are failures
  if (report.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[quality-check] Fatal error:", err);
  process.exit(1);
});
