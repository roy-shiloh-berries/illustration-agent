/**
 * Replicate API for Stable Diffusion XL fallback.
 * Uses env: REPLICATE_API_KEY
 */
const REPLICATE_API = "https://api.replicate.com/v1";
const API_KEY = process.env.REPLICATE_API_KEY;
const SDXL_MODEL = "stability-ai/sdxl:39a7a83a4a7b2a7a4a7b2a7a4a7b2a7a";

export interface ReplicateGenerateOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}

export async function generateWithReplicate(
  options: ReplicateGenerateOptions
): Promise<{ imageUrl: string }> {
  if (!API_KEY) {
    throw new Error("REPLICATE_API_KEY is not set");
  }

  const response = await fetch(`${REPLICATE_API}/predictions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      version: SDXL_MODEL.split(":")[1] ?? "latest",
      input: {
        prompt: options.prompt,
        negative_prompt: options.negativePrompt ?? "blurry, low quality",
        width: options.width ?? 1024,
        height: options.height ?? 1024,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Replicate API error: ${response.status} ${err}`);
  }

  const pred = (await response.json()) as { id: string; urls: { get: string } };
  type ReplicatePrediction = { output?: string | string[]; status?: string };
  let result: ReplicatePrediction | null = null;
  const getUrl = pred.urls?.get;
  if (!getUrl) {
    throw new Error("Replicate returned no get URL");
  }

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    result = (await poll.json()) as ReplicatePrediction;
    if (result.status === "succeeded" && result.output) {
      const url = Array.isArray(result.output) ? result.output[0] : result.output;
      return { imageUrl: url };
    }
    if (result.status === "failed") {
      throw new Error("Replicate prediction failed");
    }
  }

  throw new Error("Replicate prediction timed out");
}
