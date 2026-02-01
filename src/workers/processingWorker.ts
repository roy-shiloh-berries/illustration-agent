import { Worker, type Job } from "bullmq";
import { getConnection } from "@/lib/queue";
import { removeBackground } from "@/services/processing/bgRemoval";
import { convertToSvg } from "@/services/processing/svgConversion";

interface ProcessingJobPayload {
  type: "remove-bg" | "to-svg";
  imageUrl: string;
  styleProfileId?: string;
}

async function processJob(job: Job<ProcessingJobPayload>) {
  const { type, imageUrl, styleProfileId } = job.data;
  if (type === "remove-bg") {
    const result = await removeBackground(imageUrl, styleProfileId);
    return { type: "remove-bg", ...result };
  }
  if (type === "to-svg") {
    const result = await convertToSvg(imageUrl);
    return { type: "to-svg", ...result };
  }
  throw new Error(`Unknown job type: ${type}`);
}

function main() {
  const worker = new Worker<ProcessingJobPayload>(
    "processing",
    async (job) => processJob(job),
    { connection: getConnection(), concurrency: 2 }
  );

  worker.on("completed", (job, result) => {
    console.log(`Processing job ${job.id} completed:`, result);
  });
  worker.on("failed", (job, err) => {
    console.error(`Processing job ${job?.id} failed:`, err);
  });
  console.log("Processing worker started");
}

void main();
