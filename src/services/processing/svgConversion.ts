/**
 * SVG conversion pipeline: try Vectorizer.ai, Recraft, optional vtracer.
 */
const VECTORIZER_API = "https://api.vectorizer.ai/api/v1/vectorize";
const RECRAFT_API = process.env.RECRAFT_VECTORIZE_URL ?? "https://api.recraft.ai/v1/vectorize";

export type SvgProviderName = "vectorizer-ai" | "recraft-vectorizer";

export interface SvgConversionResult {
  svgUrl: string;
  provider: SvgProviderName;
}

async function convertWithVectorizer(pngUrl: string): Promise<string | null> {
  const key = process.env.VECTORIZER_AI_KEY;
  if (!key) return null;
  const response = await fetch(VECTORIZER_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: pngUrl,
      mode: "default",
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { vector_image?: string };
  return data.vector_image ?? null;
}

async function convertWithRecraft(pngUrl: string): Promise<string | null> {
  const key = process.env.RECRAFT_API_KEY;
  if (!key) return null;
  const response = await fetch(RECRAFT_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image_url: pngUrl }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { svg_url?: string };
  return data.svg_url ?? null;
}

const PROVIDER_ORDER: SvgProviderName[] = ["vectorizer-ai", "recraft-vectorizer"];

export async function convertToSvg(pngUrl: string): Promise<SvgConversionResult> {
  for (const provider of PROVIDER_ORDER) {
    try {
      if (provider === "vectorizer-ai") {
        const svg = await convertWithVectorizer(pngUrl);
        if (svg) return { svgUrl: svg, provider: "vectorizer-ai" };
      } else if (provider === "recraft-vectorizer") {
        const svg = await convertWithRecraft(pngUrl);
        if (svg) return { svgUrl: svg, provider: "recraft-vectorizer" };
      }
    } catch (_e) {
      continue;
    }
  }
  throw new Error("All SVG conversion providers failed");
}
