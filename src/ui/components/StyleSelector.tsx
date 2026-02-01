"use client";

import { useState, useEffect } from "react";

interface Style {
  id: string;
  name: string;
  createdAt: string;
}

interface StyleSelectorProps {
  selectedStyleId: string | null;
  onSelect: (styleId: string | null) => void;
}

export function StyleSelector({
  selectedStyleId,
  onSelect,
}: StyleSelectorProps) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/styles", {
      headers: { "X-User-Id": "dev-user" },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStyles(Array.isArray(data) ? data : []))
      .catch(() => setStyles([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading styles…</p>;
  if (styles.length === 0) return null;

  return (
    <div className="space-y-2 rounded border border-gray-200 p-4 dark:border-gray-700">
      <h3 className="font-medium">Select style profile</h3>
      <select
        value={selectedStyleId ?? ""}
        onChange={(e) => onSelect(e.target.value || null)}
        className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
      >
        <option value="">— Pick a style —</option>
        {styles.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
