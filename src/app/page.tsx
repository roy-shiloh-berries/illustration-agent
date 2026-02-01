"use client";

import { useState } from "react";
import { StyleCreator } from "@/ui/components/StyleCreator";
import { StyleSelector } from "@/ui/components/StyleSelector";
import { GenerationPanel } from "@/ui/components/GenerationPanel";
import { IllustrationCanvas } from "@/ui/canvas/IllustrationCanvas";
import { ProcessingPipeline } from "@/ui/components/ProcessingPipeline";

export default function Home() {
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [processImageUrl, setProcessImageUrl] = useState("");

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Illustration Agent</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        AI-powered illustration agent with style memory, multi-provider generation, and feedback-driven learning.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <StyleSelector
            selectedStyleId={selectedStyleId}
            onSelect={setSelectedStyleId}
          />
          <StyleCreator onCreated={setSelectedStyleId} />
          <GenerationPanel styleProfileId={selectedStyleId} />
          <div className="rounded border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="font-medium">Post-process an image</h3>
            <input
              type="url"
              value={processImageUrl}
              onChange={(e) => setProcessImageUrl(e.target.value)}
              placeholder="Paste image URL"
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
            />
            {processImageUrl && (
              <div className="mt-4">
                <ProcessingPipeline
                  imageUrl={processImageUrl}
                  styleProfileId={selectedStyleId ?? undefined}
                />
              </div>
            )}
          </div>
        </div>
        <div>
          <IllustrationCanvas projectId={selectedStyleId ?? undefined} />
        </div>
      </div>
    </main>
  );
}
