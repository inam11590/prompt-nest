-- Migration: 008_style_facets_and_metadata.sql
-- Description: Non-destructive addition of portrait style facet columns to public.prompts table
-- to support granular personal-photo style discovery (occasion, setting, lighting, framing, workflow).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'occasion'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN occasion TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'setting'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN setting TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'lighting'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN lighting TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'framing'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN framing TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'workflow'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN workflow TEXT;
  END IF;
END $$;

-- Indexes for high-speed faceted gallery filtering
CREATE INDEX IF NOT EXISTS idx_prompts_occasion ON public.prompts(occasion) WHERE occasion IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_setting ON public.prompts(setting) WHERE setting IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_lighting ON public.prompts(lighting) WHERE lighting IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_framing ON public.prompts(framing) WHERE framing IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_workflow ON public.prompts(workflow) WHERE workflow IS NOT NULL;
