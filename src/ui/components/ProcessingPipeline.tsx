"use client";

import { useState } from "react";

interface ProcessingPipelineProps {
  imageUrl: string;
  styleProfileId?: string;
  onBgRemoved?: (url: string) => void;
  onSvgReady?: (url: string) => void;
}

export function ProcessingPipeline({
  imageUrl,
  styleProfileId,
  onBgRemoved,
  onSvgReady,
}: ProcessingPipelineProps) {
  const [bgResult, setBgResult] = useState<string | null>(null);
  const [svgResult, setSvgResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<"bg" | "svg" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemoveBg = async () => {
    setLoading("bg");
    setError(null);
    try {
      const res = await fetch("/api/process/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, styleProfileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setBgResult(data.imageUrl);
      onBgRemoved?.(data.imageUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "BG removal failed");
    } finally {
      setLoading(null);
    }
  };

  const handleToSvg = async () => {
    const inputUrl = bgResult ?? imageUrl;
    setLoading("svg");
    setError(null);
    try {
      const res = await fetch("/api/process/to-svg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pngUrl: inputUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSvgResult(data.svgUrl);
      onSvgReady?.(data.svgUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "SVG conversion failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4 rounded border border-gray-200 p-4 dark:border-gray-700">
      <h3 className="font-medium">Post-processing</h3>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRemoveBg}
          disabled={loading !== null}
          className="rounded bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          {loading === "bg" ? "Removing…" : "Remove background"}
        </button>
        <button
          type="button"
          onClick={handleToSvg}
          disabled={loading !== null}
          className="rounded bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          {loading === "svg" ? "Converting…" : "Convert to SVG"}
        </button>
      </div>
      {bgResult && (
        <div>
          <p className="text-sm text-gray-500">Background removed</p>
          <img
            src={bgResult}
            alt="No background"
            className="mt-1 max-h-40 rounded border object-contain"
          />
        </div>
      )}
      {svgResult && (
        <div>
          <p className="text-sm text-gray-500">SVG result</p>
          <a
            href={svgResult}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline dark:text-blue-400"
          >
            Open SVG
          </a>
        </div>
      )}
    </div>
  );
}
