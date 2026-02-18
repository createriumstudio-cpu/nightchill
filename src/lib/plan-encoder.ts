/**
 * plan-encoder.ts
 * プランデータをURL-safeな文字列にエンコード/デコードするユーティリティ
 * 
 * 方式: JSON → UTF-8 bytes → deflate圧縮 → base64url
 * URLハッシュフラグメントに格納するため、サーバーサイドは不要
 */

import { type DatePlan, type Occasion, type Mood } from "./types";

// ============================================================
// キーの短縮マッピング（URL長の削減）
// ============================================================

interface CompactPlan {
  i: string;       // id
  t: string;       // title
  s: string;       // summary
  o: string;       // occasion
  m: string;       // mood
  tl: { t: string; a: string; p: string }[]; // timeline
  f: string;       // fashionAdvice
  c: string[];     // conversationTopics
  w: string[];     // warnings
}

interface ShareableData {
  v: 1;            // version
  p: CompactPlan;  // plan
  l?: string;      // location (optional)
}

function toCompact(plan: DatePlan): CompactPlan {
  return {
    i: plan.id,
    t: plan.title,
    s: plan.summary,
    o: plan.occasion,
    m: plan.mood,
    tl: plan.timeline.map((item) => ({
      t: item.time,
      a: item.activity,
      p: item.tip,
    })),
    f: plan.fashionAdvice,
    c: plan.conversationTopics,
    w: plan.warnings,
  };
}

function fromCompact(compact: CompactPlan): DatePlan {
  return {
    id: compact.i,
    title: compact.t,
    summary: compact.s,
    occasion: compact.o as Occasion,
    mood: compact.m as Mood,
    timeline: compact.tl.map((item) => ({
      time: item.t,
      activity: item.a,
      tip: item.p,
    })),
    fashionAdvice: compact.f,
    conversationTopics: compact.c,
    warnings: compact.w,
  };
}
// ============================================================
// deflate 圧縮 / 解凍（ブラウザ CompressionStream API）
// ============================================================

async function streamToBytes(
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function compressBytes(input: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") {
    return input;
  }
  // ArrayBuffer をBlobPartとして渡すことでTS型互換性を確保
  const buf: ArrayBuffer = input.buffer.slice(
    input.byteOffset,
    input.byteOffset + input.byteLength,
  );
  const blob = new Blob([buf]);
  const compressed = blob
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  return streamToBytes(compressed);
}

async function decompressBytes(input: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    return input;
  }
  const buf: ArrayBuffer = input.buffer.slice(
    input.byteOffset,
    input.byteOffset + input.byteLength,
  );
  const blob = new Blob([buf]);
  const decompressed = blob
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return streamToBytes(decompressed);
}
// ============================================================
// base64url エンコード / デコード
// ============================================================

function toBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ============================================================
// 公開API
// ============================================================

/**
 * プランデータをURL-safeな文字列にエンコード
 */
export async function encodePlan(
  plan: DatePlan,
  location?: string,
): Promise<string> {
  const data: ShareableData = {
    v: 1,
    p: toCompact(plan),
    ...(location ? { l: location } : {}),
  };
  const json = JSON.stringify(data);
  const jsonBytes = new TextEncoder().encode(json);
  const compressed = await compressBytes(jsonBytes);
  return toBase64url(compressed);
}

/**
 * URL-safe文字列からプランデータをデコード
 * @returns { plan, location } or null if invalid
 */
export async function decodePlan(
  encoded: string,
): Promise<{ plan: DatePlan; location: string } | null> {
  try {
    const compressed = fromBase64url(encoded);
    const jsonBytes = await decompressBytes(compressed);
    const json = new TextDecoder().decode(jsonBytes);
    const data = JSON.parse(json) as ShareableData;
    if (data.v !== 1 || !data.p) return null;
    return {
      plan: fromCompact(data.p),
      location: data.l || "",
    };
  } catch {
    return null;
  }
}

/**
 * シェア用の完全なURLを生成
 */
export async function buildShareUrl(
  plan: DatePlan,
  location?: string,
): Promise<string> {
  const encoded = await encodePlan(plan, location);
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://nightchill-sr5g.vercel.app";
  return `${origin}/results#plan=${encoded}`;
}
