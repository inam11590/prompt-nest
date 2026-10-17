-- Migration: 007_prompt_transformation_variants.sql
-- Description: Non-destructive addition of prompt_dual column to public.prompts table
-- to support dual-reference "Use my photo + example" transformation modes.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'prompt_dual'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN prompt_dual TEXT;
  END IF;
END $$;
