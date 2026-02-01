import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { insertFeedback } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { generations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const FeedbackSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("accepted"), notes: z.string().optional() }),
  z.object({
    type: z.literal("edit-requested"),
    editDescription: z.string().min(1),
    preserveAspects: z.array(z.string()).default([]),
  }),
  z.object({ type: z.literal("rejected"), reason: z.string().optional() }),
]);

const BodySchema = z.object({
  generationId: z.string().uuid(),
  imageIndex: z.number().int().min(0).max(2).optional(),
  feedback: FeedbackSchema,
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { generationId, imageIndex = 0, feedback: fb } = parsed.data;

  const [gen] = await db
    .select()
    .from(generations)
    .where(eq(generations.id, generationId))
    .limit(1);
  if (!gen) {
    return NextResponse.json(
      { error: "Generation not found" },
      { status: 404 }
    );
  }

  const feedbackType =
    fb.type === "accepted"
      ? "accepted"
      : fb.type === "edit-requested"
        ? "edit-requested"
        : "rejected";

  const row = await insertFeedback({
    generationId,
    feedbackType,
    editDescription:
      fb.type === "edit-requested" ? fb.editDescription : null,
    preserveAspects:
      fb.type === "edit-requested" ? fb.preserveAspects : null,
    rejectionReason: fb.type === "rejected" ? fb.reason ?? null : null,
  });

  const status =
    fb.type === "accepted"
      ? "accepted"
      : fb.type === "rejected"
        ? "rejected"
        : "rated";
  await db
    .update(generations)
    .set({ status })
    .where(eq(generations.id, generationId));

  return NextResponse.json({
    id: row?.id,
    generationId,
    feedbackType,
    imageIndex,
  });
}
