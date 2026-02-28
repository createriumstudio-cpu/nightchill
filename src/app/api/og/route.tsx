import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title");
  const area = searchParams.get("area");
  const subtitle = searchParams.get("subtitle");

  // エリア指定ありの場合: 特集ページ用画像
  if (title || area) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)",
            fontFamily: "system-ui, sans-serif",
            position: "relative",
          }}
        >
          {/* 装飾: 上部アクセントライン */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "6px",
              background: "linear-gradient(90deg, #c9a96e, #c9485b, #c9a96e)",
              display: "flex",
            }}
          />

          {/* メインコンテンツ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              padding: "0 60px",
            }}
          >
            {/* エリア名バッジ */}
            {area && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(201, 169, 110, 0.15)",
                  border: "1px solid rgba(201, 169, 110, 0.4)",
                  borderRadius: "9999px",
                  padding: "8px 24px",
                }}
              >
                <span
                  style={{ fontSize: "20px", color: "#c9a96e", display: "flex" }}
                >
                  📍
                </span>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#c9a96e",
                    display: "flex",
                  }}
                >
                  {area}エリア
                </span>
              </div>
            )}

            {/* タイトル */}
            <div
              style={{
                fontSize: title && title.length > 20 ? "44px" : "52px",
                fontWeight: "bold",
                color: "#ffffff",
                textAlign: "center",
                lineHeight: 1.3,
                display: "flex",
                maxWidth: "900px",
              }}
            >
              {title || `${area}デートガイド`}
            </div>

            {/* サブタイトル */}
            {subtitle && (
              <div
                style={{
                  fontSize: "22px",
                  color: "#94a3b8",
                  textAlign: "center",
                  lineHeight: 1.5,
                  maxWidth: "800px",
                  display: "flex",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {/* 下部: ロゴ + サブタイトル */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#ffffff",
                display: "flex",
              }}
            >
              <span style={{ color: "#c9a96e" }}>futa</span>
              <span>tabito</span>
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                display: "flex",
              }}
            >
              デート視点の東京カルチャーガイド
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  }

  // デフォルト: トップページ用画像（現在のグラデーションデザイン）
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* 装飾: 上部アクセントライン */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #c9a96e, #c9485b, #c9a96e)",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              color: "#ffffff",
              display: "flex",
            }}
          >
            <span style={{ color: "#c9a96e" }}>futa</span>
            <span>tabito</span>
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#c9a96e",
              display: "flex",
            }}
          >
            デート視点の東京カルチャーガイド
          </div>
          <div
            style={{
              fontSize: "36px",
              color: "#e2e8f0",
              marginTop: "24px",
              display: "flex",
            }}
          >
            ふたりの時間を、もっとおもしろく。
          </div>
        </div>

        {/* 下部装飾 */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #c9a96e, #c9485b, #c9a96e)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
