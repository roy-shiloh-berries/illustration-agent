import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { removeBackground } from "@/services/processing/bgRemoval";

const BodySchema = z.object({
  imageUrl: z.string().url(),
  styleProfileId: z.string().uuid().optional(),
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

  const { imageUrl, styleProfileId } = parsed.data;

  try {
    const result = await removeBackground(imageUrl, styleProfileId);
    return NextResponse.json({
      imageUrl: result.imageUrl,
      provider: result.provider,
      needsApproval: result.needsApproval ?? false,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "BG removal failed" },
      { status: 500 }
    );
  }
}
