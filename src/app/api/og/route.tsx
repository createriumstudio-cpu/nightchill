import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
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
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
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
              fontSize: "56px",
              fontWeight: "bold",
              color: "#ffffff",
              display: "flex",
            }}
          >
            <span style={{ color: "#a78bfa" }}>futa</span>
            <span>tabito</span>
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#a78bfa",
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
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
