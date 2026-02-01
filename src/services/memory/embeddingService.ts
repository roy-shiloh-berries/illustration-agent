import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIM = 1536;

export async function embedText(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  const vec = response.data[0]?.embedding;
  if (!vec || vec.length !== EMBEDDING_DIM) {
    throw new Error("Invalid embedding response");
  }
  return vec;
}

export async function embedStyleProfile(
  masterPrompt: string,
  characteristics: string[]
): Promise<number[]> {
  const combined = [masterPrompt, ...characteristics].filter(Boolean).join(" ");
  return embedText(combined || "illustration style");
}
