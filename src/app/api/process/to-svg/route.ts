import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { convertToSvg } from "@/services/processing/svgConversion";

const BodySchema = z.object({
  pngUrl: z.string().url(),
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

  const { pngUrl } = parsed.data;

  try {
    const result = await convertToSvg(pngUrl);
    return NextResponse.json({
      svgUrl: result.svgUrl,
      provider: result.provider,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "SVG conversion failed" },
      { status: 500 }
    );
  }
}
