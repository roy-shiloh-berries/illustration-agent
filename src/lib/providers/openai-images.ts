import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface DalleGenerateOptions {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
}

export async function generateWithDalle(
  options: DalleGenerateOptions
): Promise<{ imageUrl: string }> {
  const response = await getOpenAI().images.generate({
    model: "dall-e-3",
    prompt: options.prompt.slice(0, 4000),
    n: 1,
    size: options.size ?? "1024x1024",
    quality: options.quality ?? "standard",
    response_format: "url",
  });

  const url = response.data?.[0]?.url;
  if (!url) {
    throw new Error("DALL-E returned no image");
  }
  return { imageUrl: url };
}
