import { eq, desc, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  styleProfiles,
  generations,
  feedback as feedbackTable,
  canvasState,
} from "./schema";
import type { StyleProfile } from "@/types/memory";

export async function getStyleProfileById(id: string) {
  const [row] = await db
    .select()
    .from(styleProfiles)
    .where(eq(styleProfiles.id, id))
    .limit(1);
  return row ? mapStyleProfile(row) : null;
}

export async function getStyleProfilesByUserId(userId: string) {
  const rows = await db
    .select()
    .from(styleProfiles)
    .where(eq(styleProfiles.userId, userId))
    .orderBy(desc(styleProfiles.updatedAt));
  return rows.map(mapStyleProfile);
}

export function mapStyleProfile(row: typeof styleProfiles.$inferSelect): StyleProfile {
  return {
    id: row.id,
    name: row.name,
    userId: row.userId,
    references: (row.references as unknown as StyleProfile["references"]) ?? [],
    masterPrompt: row.masterPrompt,
    styleEmbedding: (row.styleEmbedding as unknown as number[]) ?? null,
    colorPalette: (row.colorPalette as unknown as string[]) ?? [],
    keyCharacteristics: (row.characteristics as unknown as string[]) ?? [],
    generationSettings: (row.generationSettings as unknown as StyleProfile["generationSettings"]) ?? {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createStyleProfile(data: {
  userId?: string | null;
  name: string;
  references?: unknown[];
  masterPrompt?: string | null;
  styleEmbedding?: number[] | null;
  colorPalette?: string[];
  characteristics?: string[];
  generationSettings?: unknown;
}) {
  const [row] = await db
    .insert(styleProfiles)
    .values({
      userId: data.userId ?? null,
      name: data.name,
      references: (data.references ?? []) as unknown as typeof styleProfiles.$inferInsert.references,
      masterPrompt: data.masterPrompt ?? null,
      styleEmbedding: data.styleEmbedding as unknown as typeof styleProfiles.$inferInsert.styleEmbedding,
      colorPalette: (data.colorPalette ?? []) as unknown as typeof styleProfiles.$inferInsert.colorPalette,
      characteristics: (data.characteristics ?? []) as unknown as typeof styleProfiles.$inferInsert.characteristics,
      generationSettings: (data.generationSettings ?? {}) as unknown as typeof styleProfiles.$inferInsert.generationSettings,
    })
    .returning();
  return row ? mapStyleProfile(row) : null;
}

export async function updateStyleProfile(
  id: string,
  data: Partial<{
    name: string;
    references: unknown[];
    masterPrompt: string | null;
    styleEmbedding: number[] | null;
    colorPalette: string[];
    characteristics: string[];
    generationSettings: Record<string, unknown>;
  }>
) {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) set.name = data.name;
  if (data.masterPrompt !== undefined) set.masterPrompt = data.masterPrompt;
  if (data.references !== undefined) set.references = data.references;
  if (data.styleEmbedding !== undefined) set.styleEmbedding = data.styleEmbedding;
  if (data.colorPalette !== undefined) set.colorPalette = data.colorPalette;
  if (data.characteristics !== undefined) set.characteristics = data.characteristics;
  if (data.generationSettings !== undefined) set.generationSettings = data.generationSettings;

  const [row] = await db
    .update(styleProfiles)
    .set(set as typeof styleProfiles.$inferInsert)
    .where(eq(styleProfiles.id, id))
    .returning();
  return row ? mapStyleProfile(row) : null;
}

export async function getGenerationById(id: string) {
  const [row] = await db
    .select()
    .from(generations)
    .where(eq(generations.id, id))
    .limit(1);
  return row ?? null;
}

export type GenerationTree = Awaited<ReturnType<typeof getGenerationById>> extends infer R
  ? R extends null
    ? never
    : R & { children: GenerationTree[] }
  : never;

export async function getGenerationTree(id: string): Promise<GenerationTree | null> {
  const root = await getGenerationById(id);
  if (!root) return null;
  const children = await db
    .select()
    .from(generations)
    .where(eq(generations.parentId, id));
  const childTrees = await Promise.all(
    children.map((c) => getGenerationTree(c.id))
  );
  return {
    ...root,
    children: childTrees.filter((t): t is GenerationTree => t !== null),
  };
}

export async function insertGeneration(data: {
  projectId?: string | null;
  parentId?: string | null;
  styleProfileId: string;
  prompt: string;
  imageUrl?: string | null;
  provider?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
}) {
  const rows = await db
    .insert(generations)
    .values({
      projectId: data.projectId ?? null,
      parentId: data.parentId ?? null,
      styleProfileId: data.styleProfileId,
      prompt: data.prompt,
      imageUrl: data.imageUrl ?? null,
      provider: data.provider ?? null,
      status: data.status ?? "pending",
      metadata: (data.metadata ?? {}) as typeof generations.$inferInsert.metadata,
    })
    .returning();
  return Array.isArray(rows) ? rows[0] : null;
}

export async function updateGeneration(
  id: string,
  data: Partial<{
    imageUrl: string;
    provider: string;
    status: string;
    metadata: Record<string, unknown>;
  }>
) {
  const rows = await db
    .update(generations)
    .set(data as Record<string, unknown>)
    .where(eq(generations.id, id))
    .returning();
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

export async function insertFeedback(data: {
  generationId: string;
  feedbackType: string;
  editDescription?: string | null;
  preserveAspects?: string[] | null;
  rejectionReason?: string | null;
  refinedPrompt?: string | null;
}) {
  const [row] = await db.insert(feedbackTable).values(data).returning();
  return row;
}

export async function getCanvasState(projectId: string) {
  const [row] = await db
    .select()
    .from(canvasState)
    .where(eq(canvasState.projectId, projectId))
    .limit(1);
  return row ?? null;
}

export async function saveCanvasState(projectId: string, state: Record<string, unknown>) {
  await db
    .insert(canvasState)
    .values({
      projectId,
      state,
    })
    .onConflictDoUpdate({
      target: canvasState.projectId,
      set: { state, updatedAt: new Date() },
    });
}

export async function getRecentFeedbackByStyleProfile(
  styleProfileId: string,
  limit: number
) {
  const gens = await db
    .select({ id: generations.id })
    .from(generations)
    .where(eq(generations.styleProfileId, styleProfileId))
    .orderBy(desc(generations.createdAt))
    .limit(100);
  const ids = gens.map((g) => g.id);
  if (ids.length === 0) return [];
  return db
    .select()
    .from(feedbackTable)
    .where(inArray(feedbackTable.generationId, ids))
    .orderBy(desc(feedbackTable.createdAt))
    .limit(limit);
}
