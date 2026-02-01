/**
 * Flux Kontext / BFL or Together API for image generation with style reference.
 * Uses env: FLUX_API_KEY or TOGETHER_API_KEY, and provider base URL.
 */
const FLUX_BASE = process.env.FLUX_BASE_URL ?? "https://api.bfl.ml";
const API_KEY = process.env.FLUX_API_KEY ?? process.env.TOGETHER_API_KEY;

export interface FluxGenerateOptions {
  prompt: string;
  negativePrompt?: string;
  styleImageUrl?: string;
  width?: number;
  height?: number;
  numInferenceSteps?: number;
  seed?: number;
}

export async function generateWithFlux(
  options: FluxGenerateOptions
): Promise<{ imageUrl: string; seed?: number }> {
  if (!API_KEY) {
    throw new Error("FLUX_API_KEY or TOGETHER_API_KEY is not set");
  }

  const body = {
    prompt: options.prompt,
    negative_prompt: options.negativePrompt ?? "blurry, low quality",
    image: options.styleImageUrl ?? undefined,
    width: options.width ?? 1024,
    height: options.height ?? 1024,
    num_inference_steps: options.numInferenceSteps ?? 28,
    seed: options.seed ?? Math.floor(Math.random() * 2 ** 32),
  };

  const response = await fetch(`${FLUX_BASE}/v1/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Flux API error: ${response.status} ${err}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };
  const first = data.data?.[0];
  if (!first?.url && !first?.b64_json) {
    throw new Error("Flux API returned no image");
  }

  const imageUrl = first.url ?? `data:image/png;base64,${first.b64_json}`;
  return { imageUrl, seed: body.seed };
}
