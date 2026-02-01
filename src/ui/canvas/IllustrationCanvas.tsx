"use client";

import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

interface IllustrationCanvasProps {
  projectId?: string;
  onSave?: (state: Record<string, unknown>) => void;
  /** Initial snapshot from GET /api/canvas/:projectId (document + session) */
  snapshot?: Record<string, unknown>;
}

/**
 * FigJam-style canvas using TLDraw. Custom shapes (illustration node, style profile card, feedback badge)
 * can be added via TLDraw shape APIs and stored with generationId/styleProfileId for sync from API.
 */
export function IllustrationCanvas({
  projectId,
  onSave,
  snapshot,
}: IllustrationCanvasProps) {
  return (
    <div className="h-[600px] w-full rounded border border-gray-200 dark:border-gray-700">
      <Tldraw
        persistenceKey={projectId ?? "illustration-canvas"}
        snapshot={snapshot as never}
        onMount={(editor) => {
          if (onSave) {
            editor.store.listen(() => {
              const snap = editor.store.getSnapshot();
              onSave(snap as unknown as Record<string, unknown>);
            }, { source: "user", scope: "document" });
          }
        }}
      />
    </div>
  );
}
