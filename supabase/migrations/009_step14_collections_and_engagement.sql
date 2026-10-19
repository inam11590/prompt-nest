-- Migration: 009_step14_collections_and_engagement.sql
-- Description: Step 14 - Pinterest-style Collections (Boards) schema harmonization,
-- atomic engagement counters (views, copies, likes, saves), prompt_likes table,
-- atomic increment RPC functions, and automated counter synchronization triggers.

-- 1. ADD ENGAGEMENT METRICS COLUMNS TO PROMPTS TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN views_count INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'copies_count'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN copies_count INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN likes_count INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'saves_count'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN saves_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_prompts_views_count ON public.prompts(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_copies_count ON public.prompts(copies_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_likes_count ON public.prompts(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_saves_count ON public.prompts(saves_count DESC);

-- 2. CREATE PROMPT_LIKES TABLE & RLS POLICIES
CREATE TABLE IF NOT EXISTS public.prompt_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt_id ON public.prompt_likes(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_user_id ON public.prompt_likes(user_id);

ALTER TABLE public.prompt_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view prompt likes" ON public.prompt_likes;
CREATE POLICY "Public can view prompt likes"
  ON public.prompt_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert own prompt like" ON public.prompt_likes;
CREATE POLICY "Authenticated users can insert own prompt like"
  ON public.prompt_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own prompt like" ON public.prompt_likes;
CREATE POLICY "Users can delete own prompt like"
  ON public.prompt_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 3. HARMONIZE COLLECTIONS TABLE (STEP 9 + STEP 14 PINTEREST BOARDS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.collections ADD COLUMN slug TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.collections ADD COLUMN name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.collections ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'items_count'
  ) THEN
    ALTER TABLE public.collections ADD COLUMN items_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Populate missing column values from Step 9 fields if needed
UPDATE public.collections
SET slug = COALESCE(slug, public_id),
    name = COALESCE(name, title),
    is_public = (visibility = 'PUBLIC')
WHERE slug IS NULL OR name IS NULL;

CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON public.collections(is_public) WHERE is_public = true;

-- 4. AUTOMATIC SYNCHRONIZATION TRIGGERS
-- Trigger: Synchronize prompts.likes_count
CREATE OR REPLACE FUNCTION public.sync_prompt_likes_count()
RETURNS TRIGGER AS $$
DECLARE
  target_prompt_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_prompt_id := OLD.prompt_id;
  ELSE
    target_prompt_id := NEW.prompt_id;
  END IF;

  UPDATE public.prompts
  SET likes_count = (
    SELECT COUNT(*) FROM public.prompt_likes WHERE prompt_id = target_prompt_id
  )
  WHERE id = target_prompt_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_prompt_likes_count ON public.prompt_likes;
CREATE TRIGGER trg_sync_prompt_likes_count
  AFTER INSERT OR DELETE ON public.prompt_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_prompt_likes_count();

-- Trigger: Synchronize prompts.saves_count (from bookmarks)
CREATE OR REPLACE FUNCTION public.sync_prompt_saves_count()
RETURNS TRIGGER AS $$
DECLARE
  target_prompt_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_prompt_id := OLD.prompt_id;
  ELSE
    target_prompt_id := NEW.prompt_id;
  END IF;

  UPDATE public.prompts
  SET saves_count = (
    SELECT COUNT(*) FROM public.bookmarks WHERE prompt_id = target_prompt_id
  )
  WHERE id = target_prompt_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_prompt_saves_count ON public.bookmarks;
CREATE TRIGGER trg_sync_prompt_saves_count
  AFTER INSERT OR DELETE ON public.bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_prompt_saves_count();

-- Trigger: Synchronize collections.items_count
CREATE OR REPLACE FUNCTION public.sync_collection_items_count()
RETURNS TRIGGER AS $$
DECLARE
  target_coll_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_coll_id := OLD.collection_id;
  ELSE
    target_coll_id := NEW.collection_id;
  END IF;

  UPDATE public.collections
  SET items_count = (
    SELECT COUNT(*) FROM public.collection_items WHERE collection_id = target_coll_id
  )
  WHERE id = target_coll_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_collection_items_count ON public.collection_items;
CREATE TRIGGER trg_sync_collection_items_count
  AFTER INSERT OR DELETE ON public.collection_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_collection_items_count();

-- 5. ATOMIC INCREMENT RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.increment_prompt_view(p_prompt_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.prompts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_prompt_id
  RETURNING views_count INTO new_count;

  RETURN COALESCE(new_count, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_prompt_copy(p_prompt_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.prompts
  SET copies_count = COALESCE(copies_count, 0) + 1
  WHERE id = p_prompt_id
  RETURNING copies_count INTO new_count;

  RETURN COALESCE(new_count, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to anon & authenticated roles
GRANT EXECUTE ON FUNCTION public.increment_prompt_view(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_prompt_copy(TEXT) TO anon, authenticated;
