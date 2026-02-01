# Illustration Agent

AI-powered illustration agent with style memory, multi-provider generation, feedback-driven learning, BG removal, and SVG conversion.

## Setup

1. **Install dependencies** (from project root):
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Environment**: Copy env vars and set values. Required for core flows:
   - `DATABASE_URL` – PostgreSQL connection string
   - `REDIS_URL` – Redis (default: `redis://localhost:6379`) for BullMQ
   - `OPENAI_API_KEY` – style analysis and embeddings
   - For image generation: `FLUX_API_KEY` or `TOGETHER_API_KEY`, and/or `OPENAI_API_KEY` (DALL-E 3)
   - For S3 uploads (style reference images): `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, optional `S3_ENDPOINT` (e.g. R2)

3. **Database**: Run the initial migration:
   ```bash
   psql "$DATABASE_URL" -f drizzle/0000_init.sql
   ```
   Or use Drizzle: `npm run db:generate` then `npm run db:migrate`.

4. **Run the app**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Use header `X-User-Id: dev-user` for dev (or implement auth).

5. **Workers** (optional, for queued jobs):
   ```bash
   npm run worker:generation   # image generation jobs
   npm run worker:processing   # BG removal / SVG jobs
   npm run worker:learning     # feedback learning jobs
   ```

## Plan summary

- **Phase 1**: Style memory (upload references → analyze → master prompt + embedding, CRUD).
- **Phase 2**: Generation engine (Flux/DALL-E/Replicate, 3 options, BullMQ, tree API).
- **Phase 3**: Feedback + recursive variations (rate, edit-requested → 3 new variations).
- **Phase 4**: TLDraw canvas (style/generation nodes, lineage, canvas API).
- **Phase 5**: Post-processing (BG removal chain, SVG conversion, compare).
- **Phase 6**: Self-improvement (feedback analysis, master prompt refinement, provider preference).
