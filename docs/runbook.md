# PromptNest Operations & Recovery Runbook

**System**: PromptNest Visual AI Prompt Discovery Engine  
**Repository**: [https://github.com/inam11590/prompt-nest](https://github.com/inam11590/prompt-nest)  
**Production URL**: [https://prompt-nest-pi.vercel.app](https://prompt-nest-pi.vercel.app)  
**Infrastructure**: Vercel (Edge Network & Serverless Next.js 16 App Router) + Supabase (PostgreSQL 15+, Auth, Storage)

---

## 1. Local Setup & Prerequisites

### Prerequisites
- Node.js 20.x or 22.x LTS (`node -v`)
- npm 10.x+ (`npm -v`)
- Git (`git --version`)

### Quickstart
```bash
# 1. Clone repository
git clone https://github.com/inam11590/prompt-nest.git
cd prompt-nest

# 2. Install dependencies (strictly lockfile compliant)
npm ci

# 3. Configure environment
cp .env.example .env.local
# Populate NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local

# 4. Verify test suite & build
npm run verify
npm run lint
npm run build

# 5. Start development server
npm run dev
```

---

## 2. Environment Variables & Secret Handling

| Variable Name | Exposure | Required In | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Local / Vercel | Canonical base URL (e.g. `https://prompt-nest-pi.vercel.app`). Used for OpenGraph, Twitter cards, sitemap, and canonical tags. |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Local / Vercel | Supabase project URL (e.g. `https://<ref>.supabase.co`). Base endpoint for PostgREST, Auth, and Storage. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Local / Vercel | Public client API key for anonymous and authenticated browser requests, scoped by PostgreSQL RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only | Vercel / CLI (optional) | Privileged admin key. **NEVER** expose to `NEXT_PUBLIC_*` or commit to git. Used only for database seeding scripts and server-side administrative tasks. |

> **Security Rule**: In accordance with the security baseline, `.env*` files (except `.env.example`) are git-ignored. If any key is exposed or rotated, update environment variables in the Vercel Project Dashboard under **Settings → Environment Variables** and trigger a redeployment.

---

## 3. Database Migrations Order & Execution

All database changes are non-destructive and tracked under `supabase/migrations/`. Execute them sequentially in the Supabase Dashboard **SQL Editor**:

1. [`supabase/migrations/001_initial_schema.sql`](file:///Users/mac/Documents/Prompt-Nest/supabase/migrations/001_initial_schema.sql):
   - Creates `public.profiles`, `public.prompts`, and `public.bookmarks`.
   - Establishes RLS policies for public prompt reading and user bookmark isolation.
2. [`supabase/migrations/002_admin_roles_and_storage.sql`](file:///Users/mac/Documents/Prompt-Nest/supabase/migrations/002_admin_roles_and_storage.sql):
   - Creates `public.admin_users` private role-membership table.
   - Defines `public.is_admin(user_id UUID)` helper with controlled `search_path`.
   - Creates `public.admin_audit_logs` table for immutable mutation history.
   - Configures storage buckets (`prompt-images`) and admin upload RLS policies.
3. [`supabase/migrations/003_creator_profiles_and_submissions.sql`](file:///Users/mac/Documents/Prompt-Nest/supabase/migrations/003_creator_profiles_and_submissions.sql):
   - Adds username, bio, and public toggle to `public.profiles`.
   - Creates `public.prompt_submissions` and `public.submission_revisions`.
   - Configures `prompt-staging` bucket for creator image uploads.
4. [`supabase/migrations/004_articles_and_guides.sql`](file:///Users/mac/Documents/Prompt-Nest/supabase/migrations/004_articles_and_guides.sql):
   - Creates `public.articles` and `public.article_prompts` tables.
   - Enforces check constraints, optimistic concurrency versioning, and admin RLS.
5. [`supabase/migrations/005_collections.sql`](file:///Users/mac/Documents/Prompt-Nest/supabase/migrations/005_collections.sql):
   - Creates `public.collections` and `public.collection_items` tables.
   - Enforces immutable public identifiers, automatic version bump triggers, atomic stored procedure `reorder_collection_items`, and strict private-by-default RLS.
6. [`supabase/migrations/006_prompt_types_and_sourcing.sql`](file:///Users/mac/Documents/Prompt-Nest/supabase/migrations/006_prompt_types_and_sourcing.sql):
   - Adds `prompt_type` ('original' vs 'recreation'), `source_type` ('midjourney', 'unsplash', 'curated', 'user'), `import_key` (TEXT UNIQUE), `asset_status` ('READY' vs 'DRAFT_PENDING_ASSET'), and `image_provenance` (JSONB) to `public.prompts`.
   - Creates supporting indexes for high-speed catalog filtering and idempotent batch upserts.
7. [`supabase/migrations/007_prompt_transformation_variants.sql`](file:///Users/mac/Documents/Prompt-Nest/supabase/migrations/007_prompt_transformation_variants.sql):
   - Non-destructively adds nullable `prompt_dual TEXT` column to `public.prompts` to support dual-reference "Use my photo + example" transformation modes.
8. [`supabase/migrations/008_style_facets_and_metadata.sql`](file:///Users/mac/Documents/Prompt-Nest/supabase/migrations/008_style_facets_and_metadata.sql):
   - Non-destructively adds nullable `occasion`, `setting`, `lighting`, `framing`, and `workflow` columns to `public.prompts` with check constraints for controlled vocabularies.
   - Creates partial indexes (`idx_prompts_occasion`, `idx_prompts_setting`, `idx_prompts_lighting`, `idx_prompts_framing`, `idx_prompts_workflow`) for sub-millisecond facet filtering.
   - Zero-downtime, fully idempotent (`IF NOT EXISTS`), and maintains dual-storage resilience in `generation_parameters` JSON fallback.

---

## 4. Administrator Bootstrapping Procedure

PromptNest **never** grants administrator rights automatically to the first registered user. To assign the initial administrator:

1. Identify the explicit user UUID from `auth.users` in Supabase:
   ```sql
   SELECT id, email, created_at FROM auth.users WHERE email = 'your-admin-email@example.com';
   ```
2. Insert an entry into `public.admin_users`:
   ```sql
   INSERT INTO public.admin_users (user_id)
   VALUES ('<TARGET-USER-UUID>')
   ON CONFLICT (user_id) DO NOTHING;
   ```
3. Verify membership:
   ```sql
   SELECT public.is_admin('<TARGET-USER-UUID>'); -- returns true
   ```
4. Revocation is instantaneous:
   ```sql
   DELETE FROM public.admin_users WHERE user_id = '<TARGET-USER-UUID>';
   ```

---

## 5. Media Staging Pipeline & Cleanup Strategy

- **Staging vs Published Storage**:
  - `prompt-staging`: Private bucket for creator submission drafts. Images uploaded here use scoped user paths (`staging/<userId>/<timestamp>-<random>.webp`).
  - `prompt-images`: Public CDN bucket for approved prompts and published articles (`articles/<key>.webp` and `prompts/<key>.webp`).
- **Periodic Orphan Cleanup**:
  - Submissions that are rejected or abandoned after 30 days can have their staging files pruned via a Supabase Storage Edge Function or scheduled cron:
    ```sql
    -- Query abandoned staging objects for pruning
    SELECT id, staging_image_url, status, updated_at
    FROM public.prompt_submissions
    WHERE status IN ('REJECTED', 'WITHDRAWN') AND updated_at < NOW() - INTERVAL '30 days';
    ```

---

## 6. Sourcing Policy & Step 10 Content Ingestion Pipeline

### Intellectual Property & Sourcing Standards
PromptNest enforces strict intellectual property and sourcing compliance:
1. **Unsplash Compliance**:
   - 25 photographs sourced under the official Unsplash License via compliant CDN delivery (`images.unsplash.com`).
   - Sourced with direct photographer attribution and profile linking (`Photo by [Photographer] on Unsplash`).
   - Labeled with the creative disclosure: **"Recreation Prompt"** (explicitly stating the photo is real photography and was not generated by an AI model).
2. **Midjourney Authorization Policy**:
   - 25 concepts staged with complete, production-grade prompts, tags, and category taxonomies.
   - Strictly no web scraping, phantom CDN generation, or simulated API outputs.
   - Staged in `status: "draft"` with `assetStatus: "DRAFT_PENDING_ASSET"` and tracked in [`docs/missing-asset-manifest.md`](file:///Users/mac/Documents/Prompt-Nest/docs/missing-asset-manifest.md).
   - Once user-owned or authorized image files are generated, the owner drops the image assets into `public/images/midjourney/` or uploads them via `/admin`.

### Idempotent Batch Importer CLI (`scripts/import-revised-step10.mjs`)
The repository includes a standalone, idempotent CLI script for validating and synchronizing the 50 Step 10 records:

```bash
# 1. Validation Only (Dry-Run - zero database writes)
node scripts/import-revised-step10.mjs --dry-run

# 2. Synchronize to Supabase (Publishes 25 Unsplash, stages 25 Midjourney as drafts)
node scripts/import-revised-step10.mjs --publish

# 3. Synchronize with Live Midjourney Assets (Publishes both Unsplash and Midjourney)
node scripts/import-revised-step10.mjs --publish-mj
```

### Personal Photo Transformations CLI (`scripts/import-personal-transformations.mjs`)
For the 50 personal-photo transformation concepts inspired by owner-confirmed Midjourney artwork:

```bash
# 1. Dry-run contract validation across all 50 concepts
node scripts/import-personal-transformations.mjs --dry-run

# 2. Synchronize 50 drafts to Supabase PostgreSQL (staged as DRAFT_PENDING_ASSET)
node scripts/import-personal-transformations.mjs --publish

# 3. Promote a single verified concept to live published status after asset supply
node scripts/import-personal-transformations.mjs --promote transform-sports-01
```

### Style Facet Classification & Sync CLI (`scripts/classify-style-facets.mjs`)
For classifying and synchronizing controlled style facets (`occasion`, `setting`, `lighting`, `framing`, `workflow`) across personal-photo transformations and portrait prompts:

```bash
# 1. Dry-run classification analysis (inspect counts and facet coverage without writes)
node scripts/classify-style-facets.mjs --dry-run

# 2. Apply classifications to local datasets (src/data/*.json and src/data/personalTransformationPrompts.ts)
node scripts/classify-style-facets.mjs --apply

# 3. Synchronize classified facets to Supabase PostgreSQL (updates both columns & generation_parameters)
node scripts/classify-style-facets.mjs --sync-db
```

---

## 7. Failure Diagnosis & Health Check

### Health Check Endpoints
- **Application Live Check**: `GET /` returns HTTP 200 with server-rendered gallery.
- **Sitemap Indexing Check**: `GET /sitemap.xml` returns dynamic XML listing valid public URLs.
- **Robots Directives**: `GET /robots.txt` disallows `/admin/`, `/dashboard/`, `/settings/`, etc.
- **Database Connection Check**: Run `npm run verify` to test live PostgREST connectivity (`T-4.11`).

### Diagnosis Tree
1. **500 Server Error on Page Load**:
   - Check Vercel Function Logs for unhandled exceptions or missing environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - Confirm `<Suspense>` wrapper boundaries around dynamic data fetches.
2. **Image Not Rendering**:
   - Verify `next.config.ts` has `*.supabase.co` and `images.unsplash.com` in `remotePatterns`.
   - Inspect network tab for 403 (storage RLS violation) or 404 (wrong objectKey).
3. **Admin Actions Failing (403 / Access Denied)**:
   - Check if current user session UUID exists in `public.admin_users`.
   - Verify Supabase JWT cookie is refreshed.

---

## 7. Rollback Protocol & Recovery Boundaries

### What a Vercel Rollback Restores
- **Frontend Code & Serverless Functions**: Instantly reverts the deployed Next.js build artifacts, server actions, client bundles, and routing logic to the selected prior deployment.
- **Speed**: Takes effect within seconds globally without downtime.

### What a Vercel Rollback DOES NOT Restore
- **PostgreSQL Database State**: Data mutations, user accounts, bookmarks, prompt records, and table schemas reside in Supabase, not Vercel. Rolling back Vercel leaves the database untouched.
- **Storage Buckets**: Uploaded files in `prompt-images` and `prompt-staging` remain in Supabase Storage.

### Database Recovery Considerations
- All migrations (`001` through `004`) are designed to be backward-compatible (non-destructive additions: new tables, new nullable columns, additive constraints).
- If an emergency code rollback is required, existing database schemas will not break previous code versions because no columns or tables are dropped.
- **Point-in-Time Recovery (PITR)**: Available on Supabase Pro plans. On Free tier, manual SQL dumps can be generated using `pg_dump` or Supabase CLI:
  ```bash
  supabase db dump -f backup_$(date +%Y%m%d).sql
  ```

---

## 8. Release Verification Checklist

Before deploying any future release:
- [ ] Run `npm run lint` (0 errors, 0 warnings).
- [ ] Run `npm run verify` (all cumulative tests pass).
- [ ] Run `npm run build` (Turbopack production build succeeds with clean page generation).
- [ ] Ensure all database migrations have been executed in target Supabase project.
- [ ] Push to `origin main` to trigger automatic Vercel deployment.
- [ ] Smoke-test homepage (`/`), search/filtering, prompt detail (`/prompts/[slug]`), blog (`/blog`), and `/admin`.
