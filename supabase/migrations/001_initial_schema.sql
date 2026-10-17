-- Migration: 001_initial_schema.sql
-- Description: Sets up profiles, prompts, and bookmarks tables with strict RLS and performance indexes

-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to create public.profiles record when new auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PROMPTS TABLE
-- Taxonomy strategy: Categories and models are stored as validated text with check constraints/arrays.
-- This matches the existing client categories/models without unnecessary joins while preserving high performance.
CREATE TABLE IF NOT EXISTS public.prompts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  prompt TEXT NOT NULL,
  category TEXT NOT NULL,
  model TEXT NOT NULL,
  compatible_models TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  width INTEGER NOT NULL DEFAULT 900,
  height INTEGER NOT NULL DEFAULT 1200,
  aspect_ratio TEXT NOT NULL DEFAULT 'portrait',
  aspect_ratio_value TEXT NOT NULL DEFAULT '3/4',
  dominant_color TEXT NOT NULL DEFAULT '#18181b',
  negative_prompt TEXT,
  generation_parameters JSONB,
  source_attribution JSONB NOT NULL DEFAULT '{}',
  published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for public browsing, search, and sorting
CREATE INDEX IF NOT EXISTS idx_prompts_published_slug ON public.prompts(slug) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_prompts_published_category ON public.prompts(category) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_prompts_published_model ON public.prompts(model) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_prompts_published_date ON public.prompts(published_at DESC) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_prompts_published_title ON public.prompts(title ASC) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_prompts_tags_gin ON public.prompts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_prompts_compatible_models_gin ON public.prompts USING gin(compatible_models);

-- 3. BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_prompt_bookmark UNIQUE (user_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON public.bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_prompt_id ON public.bookmarks(prompt_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Prompts Policies (Public and authenticated users can only READ published prompts)
DROP POLICY IF EXISTS "Published prompts are viewable by anyone" ON public.prompts;
CREATE POLICY "Published prompts are viewable by anyone"
  ON public.prompts FOR SELECT
  USING (published = true);

-- Disallow public or authenticated prompt creation/modification in Step 4
-- Only database migrations / seed via service role can insert or update prompts

-- Bookmarks Policies
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own bookmarks on published prompts" ON public.bookmarks;
CREATE POLICY "Users can create their own bookmarks on published prompts"
  ON public.bookmarks FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.prompts
      WHERE prompts.id = bookmarks.prompt_id
      AND prompts.published = true
    )
  );

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);
