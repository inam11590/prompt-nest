-- Migration: 006_prompt_types_and_sourcing.sql
-- Description: Non-destructive addition of prompt_type, source_type, import_key,
-- asset_status, and image_provenance columns to public.prompts table.

DO $$
BEGIN
  -- prompt_type ('original' generation prompt vs 'recreation' prompt)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'prompt_type'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN prompt_type TEXT NOT NULL DEFAULT 'recreation';
    ALTER TABLE public.prompts ADD CONSTRAINT chk_prompts_prompt_type CHECK (prompt_type IN ('original', 'recreation'));
  END IF;

  -- source_type ('midjourney', 'unsplash', 'curated', 'user')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN source_type TEXT NOT NULL DEFAULT 'unsplash';
    ALTER TABLE public.prompts ADD CONSTRAINT chk_prompts_source_type CHECK (source_type IN ('midjourney', 'unsplash', 'curated', 'user'));
  END IF;

  -- import_key (stable idempotent import identifier)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'import_key'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN import_key TEXT UNIQUE;
  END IF;

  -- asset_status ('READY', 'DRAFT_PENDING_ASSET')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'asset_status'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN asset_status TEXT NOT NULL DEFAULT 'READY';
    ALTER TABLE public.prompts ADD CONSTRAINT chk_prompts_asset_status CHECK (asset_status IN ('READY', 'DRAFT_PENDING_ASSET'));
  END IF;

  -- image_provenance (provenance, license, and permission records)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'image_provenance'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN image_provenance JSONB NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- Indexes for performance and faceted filtering
CREATE INDEX IF NOT EXISTS idx_prompts_import_key ON public.prompts(import_key) WHERE import_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_source_type ON public.prompts(source_type);
CREATE INDEX IF NOT EXISTS idx_prompts_prompt_type ON public.prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_prompts_asset_status ON public.prompts(asset_status);
