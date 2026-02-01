import { NextRequest, NextResponse } from "next/server";
import { getStyleProfileById, updateStyleProfile } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getStyleProfileById(id);
  if (!profile) {
    return NextResponse.json({ error: "Style profile not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getStyleProfileById(id);
  if (!profile) {
    return NextResponse.json({ error: "Style profile not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const updates: Parameters<typeof updateStyleProfile>[1] = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (Array.isArray(body.colorPalette)) updates.colorPalette = body.colorPalette;
  if (Array.isArray(body.characteristics)) updates.characteristics = body.characteristics;
  if (body.generationSettings && typeof body.generationSettings === "object") {
    updates.generationSettings = body.generationSettings;
  }

  const updated = await updateStyleProfile(id, updates);
  return NextResponse.json(updated);
}
