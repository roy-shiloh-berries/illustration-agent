import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface FeedbackAnalysisResult {
  recommendations: string[];
  suggestedSettings: {
    temperature?: number;
    negativePrompts?: string[];
  };
}

interface FeedbackItem {
  feedbackType: string;
  editDescription?: string | null;
  rejectionReason?: string | null;
  refinedPrompt?: string | null;
  originalPrompt?: string;
}

export async function analyzeFeedbackPatterns(
  accepted: FeedbackItem[],
  rejected: FeedbackItem[],
  currentMasterPrompt: string
): Promise<FeedbackAnalysisResult> {
  const system = `You analyze feedback on AI-generated illustrations. Given accepted and rejected examples, suggest:
1. recommendations: 3-5 short bullet points on what to change in the master prompt or generation settings.
2. suggestedSettings: optional temperature (0-1) and negativePrompts (array of strings).
Respond with valid JSON only: { "recommendations": string[], "suggestedSettings": { "temperature"?: number, "negativePrompts"?: string[] } }`;

  const acceptedSample = accepted.slice(0, 10).map((a) => ({
    type: a.feedbackType,
    prompt: a.originalPrompt ?? "(none)",
  }));
  const rejectedSample = rejected.slice(0, 10).map((r) => ({
    type: r.feedbackType,
    reason: r.rejectionReason ?? "(none)",
    prompt: r.originalPrompt ?? "(none)",
  }));

  const user = `Current master prompt: ${currentMasterPrompt}

Accepted (${accepted.length} total, sample): ${JSON.stringify(acceptedSample)}
Rejected (${rejected.length} total, sample): ${JSON.stringify(rejectedSample)}

Return JSON with recommendations and suggestedSettings.`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    return { recommendations: [], suggestedSettings: {} };
  }

  try {
    const parsed = JSON.parse(content) as FeedbackAnalysisResult;
    return {
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [],
      suggestedSettings: parsed.suggestedSettings ?? {},
    };
  } catch {
    return { recommendations: [], suggestedSettings: {} };
  }
}
