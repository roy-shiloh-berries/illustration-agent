"use client";

import { useState } from "react";

interface StyleCreatorProps {
  onCreated?: (styleId: string) => void;
}

export function StyleCreator({ onCreated }: StyleCreatorProps) {
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || files.length === 0) {
      setError("Name and at least one image are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("name", name.trim());
      files.forEach((f) => formData.append("files", f));
      const res = await fetch("/api/styles", {
        method: "POST",
        headers: { "X-User-Id": "dev-user" },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create style");
      onCreated?.(data.id);
      setName("");
      setFiles([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-gray-200 p-4 dark:border-gray-700">
      <h3 className="font-medium">Create style profile</h3>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
          placeholder="My illustration style"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Reference images</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="mt-1 w-full text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create style"}
      </button>
    </form>
  );
}
