import { NextRequest, NextResponse } from "next/server";
import { getCanvasState, saveCanvasState } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const row = await getCanvasState(projectId);
  if (!row) {
    return NextResponse.json({ state: null });
  }
  return NextResponse.json({ state: row.state });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json().catch(() => ({}));
  const state = body.state as Record<string, unknown> | undefined;
  if (!state || typeof state !== "object") {
    return NextResponse.json(
      { error: "state object required" },
      { status: 400 }
    );
  }
  await saveCanvasState(projectId, state);
  return NextResponse.json({ ok: true });
}
