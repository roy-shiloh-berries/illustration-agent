import OpenAI from "openai";
import type { ReferenceImage } from "@/types/memory";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const ANALYSIS_SYSTEM = `You are an expert at analyzing illustration and art style. For each reference image, extract:
1. colorPalette: array of 5-10 hex or descriptive colors (e.g. "#2d5016", "warm ochre")
2. composition: brief description (layout, balance, focal points)
3. styleDescriptors: 5-15 terms (e.g. "flat design", "line art", "gouache", "minimal")
4. technicalAttributes: line weight, texture, rendering style, medium hints

Respond with valid JSON only, no markdown.`;

export interface StyleAnalysisResult {
  colors: string[];
  composition: string;
  styleDescriptors: string[];
  technicalAttributes: string[];
}

export async function analyzeReferenceImage(imageUrl: string): Promise<StyleAnalysisResult> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this reference image and return the JSON object with colorPalette, composition, styleDescriptors, technicalAttributes.",
          },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty analysis response");

  const parsed = JSON.parse(content) as StyleAnalysisResult & { colorPalette?: string[] };
  return {
    colors: Array.isArray(parsed.colors) ? parsed.colors : parsed.colorPalette ?? [],
    composition: parsed.composition ?? "",
    styleDescriptors: Array.isArray(parsed.styleDescriptors)
      ? parsed.styleDescriptors
      : [],
    technicalAttributes: Array.isArray(parsed.technicalAttributes)
      ? parsed.technicalAttributes
      : [],
  };
}

export async function analyzeReferences(
  references: ReferenceImage[]
): Promise<ReferenceImage[]> {
  const results: ReferenceImage[] = [];
  for (const ref of references) {
    if (ref.analysis) {
      results.push(ref);
      continue;
    }
    const analysis = await analyzeReferenceImage(ref.url);
    results.push({ ...ref, analysis });
  }
  return results;
}
