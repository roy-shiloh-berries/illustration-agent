"use client";

import { useState } from "react";

export type FeedbackType =
  | { type: "accepted"; notes?: string }
  | {
      type: "edit-requested";
      editDescription: string;
      preserveAspects: string[];
    }
  | { type: "rejected"; reason?: string };

interface FeedbackDialogProps {
  generationId: string;
  imageIndex?: number;
  onClose: () => void;
  onSubmit: (feedback: FeedbackType) => Promise<void>;
}

export function FeedbackDialog({
  generationId,
  imageIndex = 0,
  onClose,
  onSubmit,
}: FeedbackDialogProps) {
  const [type, setType] = useState<"accepted" | "edit-requested" | "rejected">(
    "accepted"
  );
  const [notes, setNotes] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [preserveAspects, setPreserveAspects] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (type === "accepted") {
        await onSubmit({ type: "accepted", notes: notes || undefined });
      } else if (type === "edit-requested") {
        await onSubmit({
          type: "edit-requested",
          editDescription,
          preserveAspects: preserveAspects
            ? preserveAspects.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        });
      } else {
        await onSubmit({ type: "rejected", reason: reason || undefined });
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Rate this illustration</h2>
        <p className="mt-1 text-sm text-gray-500">
          Generation {generationId.slice(0, 8)} — option {imageIndex + 1}
        </p>

        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium">Feedback type</label>
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as "accepted" | "edit-requested" | "rejected")
            }
            className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="accepted">Accepted</option>
            <option value="edit-requested">Edit requested</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {type === "accepted" && (
          <div className="mt-4">
            <label className="block text-sm font-medium">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
              placeholder="Optional notes"
            />
          </div>
        )}

        {type === "edit-requested" && (
          <>
            <div className="mt-4">
              <label className="block text-sm font-medium">
                Edit description *
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                rows={2}
                required
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium">
                Preserve aspects (comma-separated)
              </label>
              <input
                type="text"
                value={preserveAspects}
                onChange={(e) => setPreserveAspects(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                placeholder="e.g. colors, composition"
              />
            </div>
          </>
        )}

        {type === "rejected" && (
          <div className="mt-4">
            <label className="block text-sm font-medium">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
              placeholder="Why was it rejected?"
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              loading || (type === "edit-requested" && !editDescription.trim())
            }
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
