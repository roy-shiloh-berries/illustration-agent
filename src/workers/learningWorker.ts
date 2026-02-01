import { Worker, type Job } from "bullmq";
import { getConnection } from "@/lib/queue";
import { learnFromFeedback } from "@/services/feedback/learner";

interface LearningJobPayload {
  styleProfileId: string;
}

async function processLearning(job: Job<LearningJobPayload>) {
  const { styleProfileId } = job.data;
  await learnFromFeedback(styleProfileId);
  return { styleProfileId };
}

function main() {
  const worker = new Worker<LearningJobPayload>(
    "learning",
    async (job) => processLearning(job),
    { connection: getConnection(), concurrency: 1 }
  );

  worker.on("completed", (job, result) => {
    console.log(`Learning job ${job.id} completed:`, result);
  });
  worker.on("failed", (job, err) => {
    console.error(`Learning job ${job?.id} failed:`, err);
  });
  console.log("Learning worker started");
}

void main();
