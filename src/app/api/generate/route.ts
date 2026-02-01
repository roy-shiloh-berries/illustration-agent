import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generationQueue } from "@/lib/queue";
import { getStyleProfileById } from "@/lib/db/queries";

const GenerateSchema = z.object({
  styleProfileId: z.string().uuid(),
  userPrompt: z.string().min(1).max(4000),
  projectId: z.string().uuid().optional().nullable(),
  styleImageUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { styleProfileId, userPrompt, projectId, styleImageUrl } =
    parsed.data;

  const profile = await getStyleProfileById(styleProfileId);
  if (!profile) {
    return NextResponse.json(
      { error: "Style profile not found" },
      { status: 404 }
    );
  }

  try {
    const job = await generationQueue.add(
      "generate",
      {
        styleProfileId,
        userPrompt,
        projectId: projectId ?? null,
        parentId: null,
        styleImageUrl,
      },
      { jobId: undefined }
    );

    return NextResponse.json({
      jobId: job.id,
      message: "Generation queued. Poll job status or use SSE for updates.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to queue generation" },
      { status: 500 }
    );
  }
}
