import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  urls: z.array(z.string().url()).min(1).max(10),
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

  const { urls } = parsed.data;
  const results: Array<{ url: string; index: number }> = urls.map(
    (url, index) => ({ url, index })
  );

  return NextResponse.json({
    count: results.length,
    results,
  });
}
