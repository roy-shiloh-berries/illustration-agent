import { getStyleProfileById } from "@/lib/db/queries";
import { buildGenerationPrompt } from "@/services/memory/promptBuilder";
import { generateWithFlux } from "@/lib/providers/flux";
import { generateWithDalle } from "@/lib/providers/openai-images";
import { generateWithReplicate } from "@/lib/providers/replicate";

export type ProviderName = "flux" | "dalle" | "replicate";

export interface GenerationResult {
  imageUrl: string;
  provider: ProviderName;
  prompt: string;
  seed?: number;
}

const PROVIDER_ORDER: ProviderName[] = ["flux", "dalle", "replicate"];

async function tryProvider(
  provider: ProviderName,
  prompt: string,
  negativePrompt: string,
  styleImageUrl?: string
): Promise<GenerationResult | null> {
  try {
    if (provider === "flux") {
      const result = await generateWithFlux({
        prompt,
        negativePrompt,
        styleImageUrl,
        width: 1024,
        height: 1024,
      });
      return { imageUrl: result.imageUrl, provider: "flux", prompt, seed: result.seed };
    }
    if (provider === "dalle") {
      const result = await generateWithDalle({ prompt });
      return { imageUrl: result.imageUrl, provider: "dalle", prompt };
    }
    if (provider === "replicate") {
      const result = await generateWithReplicate({
        prompt,
        negativePrompt,
      });
      return { imageUrl: result.imageUrl, provider: "replicate", prompt };
    }
  } catch (_e) {
    // fall through to next provider
  }
  return null;
}

export async function generateOne(
  styleProfileId: string,
  userPrompt: string,
  styleImageUrl?: string
): Promise<GenerationResult> {
  const profile = await getStyleProfileById(styleProfileId);
  if (!profile) {
    throw new Error("Style profile not found");
  }
  const masterPrompt = profile.masterPrompt ?? "";
  const neg = profile.generationSettings?.negativePrompts ?? [];
  const { prompt, negativePrompt } = buildGenerationPrompt(
    masterPrompt,
    userPrompt,
    neg
  );

  for (const provider of PROVIDER_ORDER) {
    const result = await tryProvider(
      provider,
      prompt,
      negativePrompt,
      styleImageUrl
    );
    if (result) return result;
  }
  throw new Error("All image providers failed");
}

export async function generateThree(
  styleProfileId: string,
  userPrompt: string,
  styleImageUrl?: string
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < 3; i++) {
    const result = await generateOne(styleProfileId, userPrompt, styleImageUrl);
    if (!seen.has(result.imageUrl)) {
      seen.add(result.imageUrl);
      results.push(result);
    } else {
      results.push(result);
    }
  }
  return results;
}
