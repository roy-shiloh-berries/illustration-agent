import {
  getRecentFeedbackByStyleProfile,
  getStyleProfileById,
  updateStyleProfile,
} from "@/lib/db/queries";
import { analyzeFeedbackPatterns } from "./analyzer";
import { refineMasterPrompt } from "./refineMasterPrompt";

export async function learnFromFeedback(styleProfileId: string): Promise<void> {
  const profile = await getStyleProfileById(styleProfileId);
  if (!profile) return;

  const recent = await getRecentFeedbackByStyleProfile(styleProfileId, 50);
  const accepted = recent.filter((r) => r.feedbackType === "accepted");
  const rejected = recent.filter((r) => r.feedbackType === "rejected");
  if (accepted.length + rejected.length < 5) {
    return;
  }

  const analysis = await analyzeFeedbackPatterns(
    accepted.map((a) => ({
      feedbackType: a.feedbackType,
      editDescription: null,
      rejectionReason: null,
      refinedPrompt: a.refinedPrompt,
      originalPrompt: undefined,
    })),
    rejected.map((r) => ({
      feedbackType: r.feedbackType,
      editDescription: null,
      rejectionReason: r.rejectionReason,
      refinedPrompt: r.refinedPrompt,
      originalPrompt: undefined,
    })),
    profile.masterPrompt ?? ""
  );

  const improvedMasterPrompt = await refineMasterPrompt(
    profile.masterPrompt ?? "",
    analysis.recommendations
  );

  await updateStyleProfile(styleProfileId, {
    masterPrompt: improvedMasterPrompt,
    generationSettings: {
      ...profile.generationSettings,
      ...(analysis.suggestedSettings.temperature != null && {
        temperature: analysis.suggestedSettings.temperature,
      }),
      ...(analysis.suggestedSettings.negativePrompts != null && {
        negativePrompts: analysis.suggestedSettings.negativePrompts,
      }),
    },
  });
}
