/**
 * BG removal pipeline: try multiple providers in order, track success per style.
 * Providers: Flux Kontext edit (promptable), Aiarty, Remove.bg, optional rembg.
 */
const REMOVE_BG_API = "https://api.remove.bg/v1.0/removebg";
const AIARTY_API = process.env.AIARTY_ENDPOINT ?? "https://api.aiarty.com/matting";

export type BgRemovalProviderName = "flux-kontext-edit" | "aiarty" | "remove-bg";

export interface BgRemovalResult {
  imageUrl: string;
  provider: BgRemovalProviderName;
  needsApproval?: boolean;
}

async function removeWithRemoveBg(imageUrl: string): Promise<string | null> {
  const key = process.env.REMOVE_BG_API_KEY;
  if (!key) return null;
  const response = await fetch(REMOVE_BG_API, {
    method: "POST",
    headers: {
      "X-Api-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageUrl,
      size: "auto",
    }),
  });
  if (!response.ok) return null;
  const blob = await response.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());
  const base64 = buffer.toString("base64");
  return `data:image/png;base64,${base64}`;
}

async function removeWithAiarty(imageUrl: string): Promise<string | null> {
  const key = process.env.AIARTY_API_KEY;
  if (!key) return null;
  const response = await fetch(AIARTY_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image_url: imageUrl }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { result_url?: string };
  return data.result_url ?? null;
}

/** Flux Kontext edit: promptable, return needsApproval for user to confirm */
async function removeWithFluxEdit(
  imageUrl: string,
  _prompt: string
): Promise<{ url: string; needsApproval: true } | null> {
  const key = process.env.FLUX_API_KEY ?? process.env.TOGETHER_API_KEY;
  if (!key) return null;
  const base = process.env.FLUX_BASE_URL ?? "https://api.bfl.ml";
  const response = await fetch(`${base}/v1/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageUrl,
      prompt:
        "Remove the background completely, preserve all fine details of the illustration",
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { data?: Array<{ url?: string }> };
  const url = data.data?.[0]?.url;
  if (!url) return null;
  return { url, needsApproval: true };
}

const PROVIDER_ORDER: BgRemovalProviderName[] = [
  "remove-bg",
  "aiarty",
  "flux-kontext-edit",
];

export async function removeBackground(
  imageUrl: string,
  _styleProfileId?: string
): Promise<BgRemovalResult> {
  for (const provider of PROVIDER_ORDER) {
    try {
      if (provider === "remove-bg") {
        const url = await removeWithRemoveBg(imageUrl);
        if (url) return { imageUrl: url, provider: "remove-bg" };
      } else if (provider === "aiarty") {
        const url = await removeWithAiarty(imageUrl);
        if (url) return { imageUrl: url, provider: "aiarty" };
      } else if (provider === "flux-kontext-edit") {
        const result = await removeWithFluxEdit(
          imageUrl,
          "Remove the background completely, preserve all fine details"
        );
        if (result)
          return {
            imageUrl: result.url,
            provider: "flux-kontext-edit",
            needsApproval: result.needsApproval,
          };
      }
    } catch (_e) {
      continue;
    }
  }
  throw new Error("All BG removal providers failed");
}
