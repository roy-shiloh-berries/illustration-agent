import { NextRequest, NextResponse } from "next/server";
import { getStyleProfileById, updateStyleProfile } from "@/lib/db/queries";
import { analyzeReferences } from "@/services/memory/styleAnalyzer";
import { buildMasterPromptFromAnalysis } from "@/services/memory/promptBuilder";
import { embedStyleProfile } from "@/services/memory/embeddingService";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getStyleProfileById(id);
  if (!profile) {
    return NextResponse.json({ error: "Style profile not found" }, { status: 404 });
  }

  const references = profile.references;
  if (references.length === 0) {
    return NextResponse.json(
      { error: "No reference images to analyze" },
      { status: 400 }
    );
  }

  const analyzed = await analyzeReferences(references);
  const colorPalette = Array.from(
    new Set(analyzed.flatMap((r) => r.analysis?.colors ?? []))
  ).slice(0, 15);
  const characteristics = Array.from(
    new Set(analyzed.flatMap((r) => r.analysis?.styleDescriptors ?? []))
  ).slice(0, 20);
  const masterPrompt = buildMasterPromptFromAnalysis(
    analyzed,
    colorPalette,
    characteristics
  );
  const styleEmbedding = await embedStyleProfile(masterPrompt, characteristics);

  const updated = await updateStyleProfile(id, {
    references: analyzed,
    masterPrompt,
    styleEmbedding,
    colorPalette,
    characteristics,
  });

  return NextResponse.json(updated);
}
