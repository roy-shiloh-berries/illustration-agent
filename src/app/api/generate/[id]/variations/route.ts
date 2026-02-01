import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGenerationById, insertGeneration } from "@/lib/db/queries";
import { generateOne } from "@/services/generation/orchestrator";
import { buildEditPrompt, getEditVariants } from "@/services/variations/buildEditPrompt";

const BodySchema = z.object({
  editDescription: z.string().min(1),
  preserveAspects: z.array(z.string()).default([]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: parentId } = await params;
  const parent = await getGenerationById(parentId);
  if (!parent) {
    return NextResponse.json(
      { error: "Generation not found" },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { editDescription, preserveAspects } = parsed.data;
  const basePrompt = buildEditPrompt(
    parent.prompt,
    editDescription,
    preserveAspects
  );
  const variants = getEditVariants(basePrompt);
  const styleImageUrl = parent.imageUrl ?? undefined;

  const ids: string[] = [];
  const order: ("conservative" | "moderate" | "bold")[] = [
    "conservative",
    "moderate",
    "bold",
  ];
  for (const key of order) {
    try {
      const result = await generateOne(
        parent.styleProfileId,
        variants[key],
        styleImageUrl
      );
      const row = await insertGeneration({
        projectId: parent.projectId,
        parentId: parent.id,
        styleProfileId: parent.styleProfileId,
        prompt: result.prompt,
        imageUrl: result.imageUrl,
        provider: result.provider,
        status: "pending",
        metadata: { editFrom: parentId, variant: key },
      });
      if (row) ids.push(row.id);
    } catch (_e) {
      // continue with next variant
    }
  }

  return NextResponse.json({ variationIds: ids, parentId });
}
