export interface ReferenceImage {
  url: string;
  analysis?: {
    colors: string[];
    composition: string;
    styleDescriptors: string[];
    technicalAttributes: string[];
  };
}

export interface StyleProfile {
  id: string;
  name: string;
  userId: string | null;
  references: ReferenceImage[];
  masterPrompt: string | null;
  styleEmbedding: number[] | null;
  colorPalette: string[];
  keyCharacteristics: string[];
  generationSettings: {
    preferredModel?: "flux-kontext" | "dalle3" | "midjourney";
    temperature?: number;
    negativePrompts?: string[];
  };
  feedbackHistory?: FeedbackEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackEntry {
  generationId: string;
  imageIndex: number;
  feedback: FeedbackType;
  originalPrompt: string;
  refinedPrompt?: string;
  timestamp: Date;
}

export type FeedbackType =
  | { type: "accepted"; notes?: string }
  | { type: "edit-requested"; editDescription: string; preserveAspects: string[] }
  | { type: "rejected"; reason?: string };
