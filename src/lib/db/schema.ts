import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  real,
} from "drizzle-orm/pg-core";

// Style embedding: stored as number[] in jsonb. For vector similarity search, add pgvector extension and vector(1536) column via migration.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const styleProfiles = pgTable("style_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  masterPrompt: text("master_prompt"),
  styleEmbedding: jsonb("style_embedding").$type<number[]>(),
  colorPalette: jsonb("color_palette").$type<string[]>().default([]),
  characteristics: jsonb("characteristics").$type<string[]>().default([]),
  generationSettings: jsonb("generation_settings").$type<{
    preferredModel?: string;
    temperature?: number;
    negativePrompts?: string[];
  }>().default({}),
  references: jsonb("references").$type<ReferenceImageDb[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export interface ReferenceImageDb {
  url: string;
  analysis?: {
    colors: string[];
    composition: string;
    styleDescriptors: string[];
    technicalAttributes: string[];
  };
}

export const generations = pgTable("generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id"),
  parentId: uuid("parent_id"), // FK to generations(id) enforced in migration
  styleProfileId: uuid("style_profile_id").references(() => styleProfiles.id).notNull(),
  prompt: text("prompt").notNull(),
  imageUrl: varchar("image_url", { length: 512 }),
  provider: varchar("provider", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  generationId: uuid("generation_id").references(() => generations.id).notNull(),
  feedbackType: varchar("feedback_type", { length: 20 }).notNull(),
  editDescription: text("edit_description"),
  preserveAspects: jsonb("preserve_aspects").$type<string[]>(),
  rejectionReason: text("rejection_reason"),
  refinedPrompt: text("refined_prompt"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const providerPerformance = pgTable("provider_performance", {
  id: uuid("id").primaryKey().defaultRandom(),
  styleProfileId: uuid("style_profile_id").references(() => styleProfiles.id),
  providerName: varchar("provider_name", { length: 50 }).notNull(),
  taskType: varchar("task_type", { length: 50 }).notNull(),
  successCount: integer("success_count").notNull().default(0),
  failureCount: integer("failure_count").notNull().default(0),
  avgQualityScore: real("avg_quality_score"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const canvasState = pgTable("canvas_state", {
  projectId: uuid("project_id").primaryKey(),
  state: jsonb("state").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
