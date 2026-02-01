import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function refineMasterPrompt(
  currentMasterPrompt: string,
  recommendations: string[]
): Promise<string> {
  if (recommendations.length === 0) return currentMasterPrompt;

  const system = `You refine an illustration style "master prompt" based on feedback recommendations. Keep the prompt concise (2-4 sentences). Output only the refined prompt, no JSON or markdown.`;

  const user = `Current master prompt: ${currentMasterPrompt}

Recommendations to incorporate:
${recommendations.map((r) => `- ${r}`).join("\n")}

Return the refined master prompt only.`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: 512,
  });

  const content = response.choices[0]?.message?.content?.trim();
  return content ?? currentMasterPrompt;
}
