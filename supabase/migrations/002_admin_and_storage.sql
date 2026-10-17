-- Migration: 002_admin_and_storage.sql
-- Description: Sets up admin_users role table, is_admin helper, prompt publication lifecycle (draft/published/archived), audit logs, and storage security policies

-- 1. ADMIN USERS ROLE-MEMBERSHIP TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. SECURITY DEFINER AUTHORIZATION HELPER
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE admin_users.user_id = $1
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;

-- Admin Users Policies:
-- Clients CANNOT insert, update, or delete admin roles. Only server migrations or existing admins can view admin membership.
DROP POLICY IF EXISTS "Admins can view admin membership" ON public.admin_users;
CREATE POLICY "Admins can view admin membership"
  ON public.admin_users FOR SELECT
  USING (public.is_admin(auth.uid()));

-- 3. EXTEND PROMPTS TABLE WITH PUBLICATION LIFECYCLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.prompts ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));
  END IF;
END $$;

-- Synchronize status for existing prompts
UPDATE public.prompts
SET status = CASE WHEN published = true THEN 'published' ELSE 'draft' END
WHERE status IS NULL OR status = 'draft';

-- Synchronization trigger to guarantee `published = (status = 'published')`
CREATE OR REPLACE FUNCTION public.sync_prompt_publication_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' THEN
    NEW.published := true;
    IF OLD.published_at IS NULL AND NEW.published_at IS NULL THEN
      NEW.published_at := timezone('utc'::text, now());
    END IF;
  ELSE
    NEW.published := false;
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_prompt_publication_status ON public.prompts;
CREATE TRIGGER trg_sync_prompt_publication_status
  BEFORE INSERT OR UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.sync_prompt_publication_status();

-- Update Prompts RLS policies
-- Public can read published prompts. Administrators can read all prompts (draft, published, archived).
DROP POLICY IF EXISTS "Published prompts are viewable by anyone" ON public.prompts;
CREATE POLICY "Published prompts are viewable by anyone"
  ON public.prompts FOR SELECT
  USING (published = true OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert prompts" ON public.prompts;
CREATE POLICY "Admins can insert prompts"
  ON public.prompts FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update prompts" ON public.prompts;
CREATE POLICY "Admins can update prompts"
  ON public.prompts FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  prompt_id TEXT REFERENCES public.prompts(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  changed_fields TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.admin_audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_prompt ON public.admin_audit_logs(prompt_id, created_at DESC);

-- Audit log policies: Only admins can view logs. Only admins can insert logs via server operations. Modification and deletion are disabled.
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. STORAGE BUCKETS AND ACCESS POLICIES
-- Create storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('prompt-images', 'prompt-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('prompt-staging', 'prompt-staging', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for prompt-images (Public read, admin write)
DROP POLICY IF EXISTS "Public prompt-images are viewable by anyone" ON storage.objects;
CREATE POLICY "Public prompt-images are viewable by anyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prompt-images');

DROP POLICY IF EXISTS "Admins can upload to prompt-images" ON storage.objects;
CREATE POLICY "Admins can upload to prompt-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'prompt-images' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update objects in prompt-images" ON storage.objects;
CREATE POLICY "Admins can update objects in prompt-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'prompt-images' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'prompt-images' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete objects in prompt-images" ON storage.objects;
CREATE POLICY "Admins can delete objects in prompt-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'prompt-images' AND public.is_admin(auth.uid()));

-- Storage Policies for prompt-staging (Private, admin only)
DROP POLICY IF EXISTS "Admins can view prompt-staging objects" ON storage.objects;
CREATE POLICY "Admins can view prompt-staging objects"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prompt-staging' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can upload to prompt-staging" ON storage.objects;
CREATE POLICY "Admins can upload to prompt-staging"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'prompt-staging' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update prompt-staging objects" ON storage.objects;
CREATE POLICY "Admins can update prompt-staging objects"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'prompt-staging' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'prompt-staging' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete prompt-staging objects" ON storage.objects;
CREATE POLICY "Admins can delete prompt-staging objects"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'prompt-staging' AND public.is_admin(auth.uid()));
