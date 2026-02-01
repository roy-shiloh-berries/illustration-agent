import { NextRequest, NextResponse } from "next/server";
import { generationQueue } from "@/lib/queue";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = await generationQueue.getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const state = await job.getState();
  const result = job.returnvalue;
  return NextResponse.json({
    jobId: job.id,
    state,
    result: state === "completed" ? result : undefined,
    progress: job.progress,
    failedReason: job.failedReason,
  });
}
