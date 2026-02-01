import { NextRequest, NextResponse } from "next/server";
import { getStyleProfileById } from "@/lib/db/queries";
import { learnFromFeedback } from "@/services/feedback/learner";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: styleProfileId } = await params;
  const profile = await getStyleProfileById(styleProfileId);
  if (!profile) {
    return NextResponse.json(
      { error: "Style profile not found" },
      { status: 404 }
    );
  }

  await learnFromFeedback(styleProfileId);
  const updated = await getStyleProfileById(styleProfileId);
  return NextResponse.json({
    ok: true,
    masterPrompt: updated?.masterPrompt,
    generationSettings: updated?.generationSettings,
  });
}
