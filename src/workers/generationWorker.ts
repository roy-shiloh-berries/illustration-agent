import { Worker, type Job } from "bullmq";
import { getConnection } from "@/lib/queue";
import { generateThree } from "@/services/generation/orchestrator";
import {
  insertGeneration,
  updateGeneration,
  getStyleProfileById,
} from "@/lib/db/queries";

interface GenerationJobPayload {
  styleProfileId: string;
  userPrompt: string;
  projectId?: string | null;
  parentId?: string | null;
  styleImageUrl?: string;
}

async function processGeneration(job: Job<GenerationJobPayload>) {
  const { styleProfileId, userPrompt, projectId, parentId, styleImageUrl } =
    job.data;

  const profile = await getStyleProfileById(styleProfileId);
  if (!profile) {
    throw new Error("Style profile not found");
  }
  const refUrl = profile.references[0]?.url;

  const results = await generateThree(
    styleProfileId,
    userPrompt,
    styleImageUrl ?? refUrl
  );

  const ids: string[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const masterPrompt = profile.masterPrompt ?? "";
    const prompt = `${masterPrompt} ${userPrompt}`.trim();
    const row = await insertGeneration({
      projectId: projectId ?? null,
      parentId: parentId ?? null,
      styleProfileId,
      prompt: r.prompt,
      imageUrl: r.imageUrl,
      provider: r.provider,
      status: "pending",
      metadata: { seed: r.seed, index: i },
    });
    if (row) ids.push(row.id);
  }
  return { generationIds: ids, count: results.length };
}

function main() {
  const worker = new Worker<GenerationJobPayload>(
    "generation",
    async (job) => {
      return processGeneration(job);
    },
    { connection: getConnection(), concurrency: 2 }
  );

  worker.on("completed", (job, result) => {
    console.log(`Job ${job.id} completed:`, result);
  });
  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
  console.log("Generation worker started");
}

void main();
