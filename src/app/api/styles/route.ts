import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/api/middleware/auth";
import {
  createStyleProfile,
  getStyleProfilesByUserId,
} from "@/lib/db/queries";
import { analyzeReferences } from "@/services/memory/styleAnalyzer";
import { buildMasterPromptFromAnalysis } from "@/services/memory/promptBuilder";
import { embedStyleProfile } from "@/services/memory/embeddingService";
import type { ReferenceImage } from "@/types/memory";

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profiles = await getStyleProfilesByUserId(userId);
  return NextResponse.json(profiles);
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  const formData = await request.formData();
  const name = formData.get("name") as string | null;
  if (!name?.trim()) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const references: ReferenceImage[] = [];
  const files = formData.getAll("files") as File[];
  if (files.length > 0) {
    const { uploadBuffer: upload } = await import("@/lib/storage/s3");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      const buf = Buffer.from(await file.arrayBuffer());
      const key = `styles/${userId ?? "anon"}/${Date.now()}-${i}-${file.name}`;
      const url = await upload(key, buf, file.type);
      references.push({ url });
    }
  }

  const refUrls = formData.get("referenceUrls");
  if (refUrls && typeof refUrls === "string") {
    try {
      const arr = JSON.parse(refUrls) as string[];
      arr.forEach((url) => references.push({ url }));
    } catch {
      // ignore
    }
  }

  if (references.length === 0) {
    return NextResponse.json(
      { error: "At least one reference image (file or URL) is required" },
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

  const profile = await createStyleProfile({
    userId: userId ?? undefined,
    name: name.trim(),
    references: analyzed,
    masterPrompt,
    styleEmbedding,
    colorPalette,
    characteristics,
    generationSettings: {},
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Failed to create style profile" },
      { status: 500 }
    );
  }
  return NextResponse.json(profile);
}
