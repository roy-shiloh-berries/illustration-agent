"use client";

import { useState } from "react";

interface GenerationPanelProps {
  styleProfileId: string | null;
  onJobStarted?: (jobId: string) => void;
}

export function GenerationPanel({
  styleProfileId,
  onJobStarted,
}: GenerationPanelProps) {
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleProfileId || !userPrompt.trim()) {
      setError("Select a style and enter a prompt");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          styleProfileId,
          userPrompt: userPrompt.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start generation");
      setJobId(data.jobId);
      onJobStarted?.(data.jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded border border-gray-200 p-4 dark:border-gray-700">
      <h3 className="font-medium">Generate illustrations</h3>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {!styleProfileId && (
        <p className="text-sm text-gray-500">
          Create or select a style profile first.
        </p>
      )}
      <form onSubmit={handleGenerate} className="space-y-2">
        <div>
          <label className="block text-sm font-medium">Prompt</label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
            rows={2}
            placeholder="A cat sitting on a windowsill, morning light"
            disabled={!styleProfileId}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !styleProfileId}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Queuing…" : "Generate 3 options"}
        </button>
      </form>
      {jobId && (
        <p className="text-sm text-gray-500">
          Job {jobId} queued. Poll GET /api/generate/job/{jobId} for result.
        </p>
      )}
    </div>
  );
}
