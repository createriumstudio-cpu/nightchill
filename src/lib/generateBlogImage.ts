/**
 * ブログ記事のheroImage自動生成
 *
 * Gemini の画像生成モデルを使い、記事の内容に合ったビジュアルを生成する。
 * 生成された画像はbase64 data URLとしてDBのheroImageカラムに保存される。
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const IMAGE_MODEL = "gemini-3.1-flash-image-preview";

interface GenerateBlogImageParams {
  title: string;
  category: string;
  excerpt: string;
  city?: string | null;
}

interface GeminiImageResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
}

/**
 * Gemini API で記事に合ったブログ用画像を生成する。
 * 成功時はbase64 data URLを返す。失敗時はnullを返す。
 */
export async function generateBlogImage(
  params: GenerateBlogImageParams,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[blog-image] GEMINI_API_KEY not set");
    return null;
  }

  const { title, category, excerpt, city } = params;

  const cityContext = city ? `場所: ${city}` : "";
  const prompt = `以下のデートメディア記事にぴったりのアイキャッチ画像を生成してください。

記事タイトル: ${title}
カテゴリ: ${category}
概要: ${excerpt}
${cityContext}

要件:
- デートスポットやカップルのムードに合った美しいビジュアル
- テキストや文字は画像に含めないでください
- 明るく温かみのある色調
- 16:9のワイドな構図
- フォトリアリスティックなスタイル`;

  try {
    const url = `${GEMINI_API_BASE}/models/${IMAGE_MODEL}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          responseMimeType: "text/plain",
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[blog-image] Gemini API error ${res.status}:`, errorText);
      return null;
    }

    const data = (await res.json()) as GeminiImageResponse;

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) {
      console.error("[blog-image] No parts in Gemini response");
      return null;
    }

    // inlineData (base64画像) を探す
    for (const part of parts) {
      if (part.inlineData?.data) {
        const { mimeType, data: base64Data } = part.inlineData;
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        console.log(`[blog-image] Generated image (${mimeType}, ${Math.round(base64Data.length / 1024)}KB base64)`);
        return dataUrl;
      }
    }

    console.error("[blog-image] No image data in Gemini response");
    return null;
  } catch (error) {
    console.error("[blog-image] Image generation failed:", error);
    return null;
  }
}
