import type { ReferenceImage } from "@/types/memory";

export function buildMasterPromptFromAnalysis(
  references: ReferenceImage[],
  colorPalette: string[],
  characteristics: string[]
): string {
  const parts: string[] = [];

  const allDescriptors = new Set<string>();
  const allTechnical = new Set<string>();
  const allColors = new Set(colorPalette);

  for (const ref of references) {
    const a = ref.analysis;
    if (!a) continue;
    a.styleDescriptors.forEach((d) => allDescriptors.add(d));
    a.technicalAttributes.forEach((t) => allTechnical.add(t));
    a.colors.forEach((c) => allColors.add(c));
  }

  characteristics.forEach((c) => allDescriptors.add(c));

  if (allColors.size > 0) {
    parts.push(
      `Color palette: ${Array.from(allColors).slice(0, 12).join(", ")}.`
    );
  }
  if (allDescriptors.size > 0) {
    parts.push(
      `Style: ${Array.from(allDescriptors).slice(0, 15).join(", ")}.`
    );
  }
  if (allTechnical.size > 0) {
    parts.push(
      `Technical: ${Array.from(allTechnical).slice(0, 10).join(", ")}.`
    );
  }

  for (const ref of references) {
    if (ref.analysis?.composition) {
      parts.push(`Composition note: ${ref.analysis.composition}.`);
      break;
    }
  }

  return parts.join(" ").trim() || "Consistent illustration style.";
}

export function buildGenerationPrompt(
  masterPrompt: string,
  userRequest: string,
  negativePrompts: string[] = []
): { prompt: string; negativePrompt: string } {
  const prompt = `${masterPrompt} ${userRequest}`.trim();
  const negativePrompt =
    negativePrompts.length > 0
      ? negativePrompts.join(", ")
      : "blurry, low quality, inconsistent style, text, watermark";
  return { prompt, negativePrompt };
}
