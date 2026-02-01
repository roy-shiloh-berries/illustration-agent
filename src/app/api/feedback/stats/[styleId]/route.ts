import { NextRequest, NextResponse } from "next/server";
import { getRecentFeedbackByStyleProfile } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ styleId: string }> }
) {
  const { styleId } = await params;
  const recent = await getRecentFeedbackByStyleProfile(styleId, 50);

  const accepted = recent.filter((r) => r.feedbackType === "accepted").length;
  const rejected = recent.filter((r) => r.feedbackType === "rejected").length;
  const editRequested = recent.filter(
    (r) => r.feedbackType === "edit-requested"
  ).length;

  return NextResponse.json({
    styleId,
    total: recent.length,
    accepted,
    rejected,
    editRequested,
    recent: recent.slice(0, 10).map((r) => ({
      id: r.id,
      generationId: r.generationId,
      feedbackType: r.feedbackType,
      createdAt: r.createdAt,
    })),
  });
}
