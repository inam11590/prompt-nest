-- Migration: 004_articles_and_guides.sql
-- Description: Creates articles and article_prompts tables for database-backed blog/guides with editorial lifecycle, concurrency versioning, and strict admin RLS.

-- 1. CREATE ARTICLES TABLE
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  cover_image_width INTEGER DEFAULT 1200,
  cover_image_height INTEGER DEFAULT 630,
  cover_image_dominant_color TEXT DEFAULT '#18181c',
  category TEXT NOT NULL DEFAULT 'guide',
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  published_at TIMESTAMPTZ,
  last_edited_at TIMESTAMPTZ,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  concurrency_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enforce explicit field constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_articles_title_length'
  ) THEN
    ALTER TABLE public.articles ADD CONSTRAINT chk_articles_title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 150);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_articles_excerpt_length'
  ) THEN
    ALTER TABLE public.articles ADD CONSTRAINT chk_articles_excerpt_length CHECK (char_length(excerpt) >= 10 AND char_length(excerpt) <= 300);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_articles_content_length'
  ) THEN
    ALTER TABLE public.articles ADD CONSTRAINT chk_articles_content_length CHECK (char_length(content) >= 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_articles_slug_format'
  ) THEN
    ALTER TABLE public.articles ADD CONSTRAINT chk_articles_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_articles_cover_alt'
  ) THEN
    ALTER TABLE public.articles ADD CONSTRAINT chk_articles_cover_alt CHECK (
      cover_image_url IS NULL OR (cover_image_alt IS NOT NULL AND char_length(cover_image_alt) > 0)
    );
  END IF;
END $$;

-- 2. CREATE ARTICLE_PROMPTS JOIN TABLE
CREATE TABLE IF NOT EXISTS public.article_prompts (
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (article_id, prompt_id)
);

-- 3. INDEXES FOR PERFORMANCE AND PUBLIC LISTINGS
CREATE INDEX IF NOT EXISTS idx_articles_status_published_at ON public.articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles(author_id) WHERE author_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_article_prompts_prompt_id ON public.article_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS idx_article_prompts_article_sort ON public.article_prompts(article_id, sort_order ASC);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_prompts ENABLE ROW LEVEL SECURITY;

-- Articles RLS:
-- Public can view ONLY PUBLISHED articles. Admins can view all.
DROP POLICY IF EXISTS "Public can view published articles" ON public.articles;
CREATE POLICY "Public can view published articles"
  ON public.articles FOR SELECT
  USING (status = 'PUBLISHED' OR public.is_admin(auth.uid()));

-- Only verified administrators can insert articles
DROP POLICY IF EXISTS "Admins can insert articles" ON public.articles;
CREATE POLICY "Admins can insert articles"
  ON public.articles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Only verified administrators can update articles
DROP POLICY IF EXISTS "Admins can update articles" ON public.articles;
CREATE POLICY "Admins can update articles"
  ON public.articles FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Only verified administrators can delete articles
DROP POLICY IF EXISTS "Admins can delete articles" ON public.articles;
CREATE POLICY "Admins can delete articles"
  ON public.articles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Article Prompts Join Table RLS:
-- Public can view article prompt associations only if article is published and prompt is published
DROP POLICY IF EXISTS "Public can view article prompts for published articles" ON public.article_prompts;
CREATE POLICY "Public can view article prompts for published articles"
  ON public.article_prompts FOR SELECT
  USING (
    public.is_admin(auth.uid()) OR (
      EXISTS (
        SELECT 1 FROM public.articles a
        WHERE a.id = article_prompts.article_id AND a.status = 'PUBLISHED'
      ) AND EXISTS (
        SELECT 1 FROM public.prompts p
        WHERE p.id = article_prompts.prompt_id AND p.published = true
      )
    )
  );

DROP POLICY IF EXISTS "Admins can manage article prompts" ON public.article_prompts;
CREATE POLICY "Admins can manage article prompts"
  ON public.article_prompts FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
