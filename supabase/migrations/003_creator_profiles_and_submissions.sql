-- Migration: 003_creator_profiles_and_submissions.sql
-- Description: Extends profiles for opt-in creator identities, creates prompt_submissions and submission_revisions tables, adds creator attribution to prompts, and configures granular RLS and storage policies.

-- 1. EXTEND PROFILES TABLE FOR CREATOR IDENTITIES
DO $$
BEGIN
  -- username
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT;
  END IF;

  -- bio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;

  -- avatar_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- website_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN website_url TEXT;
  END IF;

  -- is_public (opt-in public profile flag)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Enforce constraints on profile fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_bio_length'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 500);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_display_name_length'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_display_name_length CHECK (display_name IS NULL OR char_length(display_name) <= 50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_username_format'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_username_format CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,30}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_website_url'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_website_url CHECK (
      website_url IS NULL OR (
        website_url ~* '^https://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$' AND char_length(website_url) <= 200
      )
    );
  END IF;
END $$;

-- Case-insensitive unique index for usernames
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(LOWER(username)) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON public.profiles(is_public) WHERE is_public = true;

-- Update Profiles RLS policies:
-- Public can ONLY see profiles where is_public = true.
-- Authenticated users can view and update their own profile.
-- Admins can view all profiles.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. EXTEND PROMPTS TABLE WITH CREATOR ATTRIBUTION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'submission_id'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN submission_id UUID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_prompts_author_id ON public.prompts(author_id) WHERE author_id IS NOT NULL;

-- 3. PROMPT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.prompt_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  generation_parameters JSONB,
  category TEXT NOT NULL,
  model TEXT NOT NULL,
  compatible_models TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  staged_image_path TEXT NOT NULL,
  staged_image_bucket TEXT NOT NULL DEFAULT 'prompt-staging',
  image_alt TEXT NOT NULL,
  width INTEGER NOT NULL DEFAULT 1200,
  height INTEGER NOT NULL DEFAULT 800,
  aspect_ratio TEXT NOT NULL DEFAULT 'landscape',
  aspect_ratio_value TEXT NOT NULL DEFAULT '3/2',
  dominant_color TEXT NOT NULL DEFAULT '#18181c',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'REJECTED', 'APPROVED')),
  review_feedback TEXT,
  internal_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  published_prompt_id TEXT REFERENCES public.prompts(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_submission_published_prompt UNIQUE (published_prompt_id)
);

ALTER TABLE public.prompt_submissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_submissions_author ON public.prompt_submissions(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.prompt_submissions(status, created_at DESC);

-- 4. SUBMISSION REVISIONS TABLE (IMMUTABLE AUDIT SNAPSHOTS)
CREATE TABLE IF NOT EXISTS public.submission_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES public.prompt_submissions(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_submission_revision UNIQUE (submission_id, revision)
);

ALTER TABLE public.submission_revisions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_submission_revisions_lookup ON public.submission_revisions(submission_id, revision DESC);

-- Add foreign key from prompts.submission_id to prompt_submissions(id) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_prompts_submission'
  ) THEN
    ALTER TABLE public.prompts ADD CONSTRAINT fk_prompts_submission FOREIGN KEY (submission_id) REFERENCES public.prompt_submissions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. SUBMISSION ROW LEVEL SECURITY POLICIES
-- Authors can view their own submissions. Admins can view all submissions.
DROP POLICY IF EXISTS "Authors can view own submissions" ON public.prompt_submissions;
CREATE POLICY "Authors can view own submissions"
  ON public.prompt_submissions FOR SELECT
  USING (auth.uid() = author_id OR public.is_admin(auth.uid()));

-- Authors can insert their own draft submissions (enforces quota max 10 active drafts/pending)
DROP POLICY IF EXISTS "Authors can insert own submissions" ON public.prompt_submissions;
CREATE POLICY "Authors can insert own submissions"
  ON public.prompt_submissions FOR INSERT
  WITH CHECK (
    auth.uid() = author_id 
    AND status IN ('DRAFT', 'PENDING_REVIEW')
  );

-- Authors can update their own submissions when in DRAFT or CHANGES_REQUESTED or withdrawing from PENDING_REVIEW
DROP POLICY IF EXISTS "Authors can update own editable submissions" ON public.prompt_submissions;
CREATE POLICY "Authors can update own editable submissions"
  ON public.prompt_submissions FOR UPDATE
  USING (
    (auth.uid() = author_id AND status IN ('DRAFT', 'CHANGES_REQUESTED', 'PENDING_REVIEW'))
    OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    (auth.uid() = author_id AND status IN ('DRAFT', 'PENDING_REVIEW'))
    OR public.is_admin(auth.uid())
  );

-- Authors can delete only their own DRAFT submissions. Admins can delete any.
DROP POLICY IF EXISTS "Authors can delete own draft submissions" ON public.prompt_submissions;
CREATE POLICY "Authors can delete own draft submissions"
  ON public.prompt_submissions FOR DELETE
  USING (
    (auth.uid() = author_id AND status = 'DRAFT')
    OR public.is_admin(auth.uid())
  );

-- Revisions RLS: Authors can view snapshots of their submissions; admins can view all
DROP POLICY IF EXISTS "Authors and admins can view revisions" ON public.submission_revisions;
CREATE POLICY "Authors and admins can view revisions"
  ON public.submission_revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.prompt_submissions s
      WHERE s.id = submission_revisions.submission_id
        AND (s.author_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Server can insert revisions" ON public.submission_revisions;
CREATE POLICY "Server can insert revisions"
  ON public.submission_revisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prompt_submissions s
      WHERE s.id = submission_revisions.submission_id
        AND (s.author_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- 6. STORAGE POLICIES FOR CREATOR STAGING (prompt-staging)
-- Authenticated creators can upload and read only within their user ID namespace: `auth.uid()/*`
DROP POLICY IF EXISTS "Creators can upload to their own staging folder" ON storage.objects;
CREATE POLICY "Creators can upload to their own staging folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'prompt-staging' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Creators can view their own staged objects" ON storage.objects;
CREATE POLICY "Creators can view their own staged objects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'prompt-staging' 
    AND (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Creators can delete their own staged objects" ON storage.objects;
CREATE POLICY "Creators can delete their own staged objects"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'prompt-staging' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
