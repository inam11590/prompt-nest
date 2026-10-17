-- Migration: 006_cricket_prompt_variants.sql
-- Description: Non-destructive addition of prompt_match_example, style_inspiration,
-- is_cricket_identity, and image_provenance columns to public.prompts table.

DO $$
BEGIN
  -- prompt_match_example (Mode B "Match this example" prompt)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'prompt_match_example'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN prompt_match_example TEXT;
  END IF;

  -- style_inspiration (e.g. "Inspired by Virat Kohli's cover drive posture")
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'style_inspiration'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN style_inspiration TEXT;
  END IF;

  -- is_cricket_identity flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'is_cricket_identity'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN is_cricket_identity BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- image_provenance JSONB metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'image_provenance'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN image_provenance JSONB NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- Index for searching cricket concepts and inspirations
CREATE INDEX IF NOT EXISTS idx_prompts_style_inspiration ON public.prompts(style_inspiration) WHERE style_inspiration IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_is_cricket_identity ON public.prompts(is_cricket_identity) WHERE is_cricket_identity = true;
CREATE INDEX IF NOT EXISTS idx_prompts_category_cricket ON public.prompts(category) WHERE category = 'cricket';

