import { NextRequest, NextResponse } from "next/server";
import { getGenerationTree } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tree = await getGenerationTree(id);
  if (!tree) {
    return NextResponse.json(
      { error: "Generation not found" },
      { status: 404 }
    );
  }
  return NextResponse.json(tree);
}
