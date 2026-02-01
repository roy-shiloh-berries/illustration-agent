-- Illustration Agent: initial schema
-- Run against your PostgreSQL database (e.g. psql $DATABASE_URL -f drizzle/0000_init.sql)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  master_prompt TEXT,
  style_embedding JSONB,
  color_palette JSONB DEFAULT '[]',
  characteristics JSONB DEFAULT '[]',
  generation_settings JSONB DEFAULT '{}',
  references JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  parent_id UUID REFERENCES generations(id),
  style_profile_id UUID NOT NULL REFERENCES style_profiles(id),
  prompt TEXT NOT NULL,
  image_url VARCHAR(512),
  provider VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES generations(id),
  feedback_type VARCHAR(20) NOT NULL,
  edit_description TEXT,
  preserve_aspects JSONB,
  rejection_reason TEXT,
  refined_prompt TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  style_profile_id UUID REFERENCES style_profiles(id),
  provider_name VARCHAR(50) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  avg_quality_score REAL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canvas_state (
  project_id UUID PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
