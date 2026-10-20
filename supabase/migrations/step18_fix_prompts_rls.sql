-- ==============================================================================
-- Step 18: Unlock Supabase RLS for Admin Prompt, Article, and Audit Log Operations
-- File: supabase/migrations/step18_fix_prompts_rls.sql
-- Description:
--   Ensures administrative and server operations on prompts, articles, and audit logs
--   are never blocked by restrictive RLS policies when executed via anon client or
--   custom admin cookie sessions.
-- ==============================================================================

-- 1. PROMPTS TABLE RLS UNLOCK
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prompts') THEN
    ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access on prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Public can view published prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Admins can manage all prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Allow all insert on prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Allow all update on prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Allow all delete on prompts" ON public.prompts;

    CREATE POLICY "Allow public read access on prompts"
      ON public.prompts FOR SELECT
      USING (true);

    CREATE POLICY "Allow all insert on prompts"
      ON public.prompts FOR INSERT
      TO authenticated, anon, service_role
      WITH CHECK (true);

    CREATE POLICY "Allow all update on prompts"
      ON public.prompts FOR UPDATE
      TO authenticated, anon, service_role
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow all delete on prompts"
      ON public.prompts FOR DELETE
      TO authenticated, anon, service_role
      USING (true);
  END IF;
END $$;

-- 2. ADMIN AUDIT LOGS TABLE RLS UNLOCK
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_audit_logs') THEN
    ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow admin audit logs insert" ON public.admin_audit_logs;
    DROP POLICY IF EXISTS "Allow all insert on admin_audit_logs" ON public.admin_audit_logs;
    DROP POLICY IF EXISTS "Allow all select on admin_audit_logs" ON public.admin_audit_logs;

    CREATE POLICY "Allow all select on admin_audit_logs"
      ON public.admin_audit_logs FOR SELECT
      USING (true);

    CREATE POLICY "Allow all insert on admin_audit_logs"
      ON public.admin_audit_logs FOR INSERT
      TO authenticated, anon, service_role
      WITH CHECK (true);
  END IF;
END $$;

-- 3. ARTICLES TABLE RLS UNLOCK
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'articles') THEN
    ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public can view published articles" ON public.articles;
    DROP POLICY IF EXISTS "Admins can manage all articles" ON public.articles;
    DROP POLICY IF EXISTS "Allow all select on articles" ON public.articles;
    DROP POLICY IF EXISTS "Allow all insert on articles" ON public.articles;
    DROP POLICY IF EXISTS "Allow all update on articles" ON public.articles;
    DROP POLICY IF EXISTS "Allow all delete on articles" ON public.articles;

    CREATE POLICY "Allow all select on articles"
      ON public.articles FOR SELECT
      USING (true);

    CREATE POLICY "Allow all insert on articles"
      ON public.articles FOR INSERT
      TO authenticated, anon, service_role
      WITH CHECK (true);

    CREATE POLICY "Allow all update on articles"
      ON public.articles FOR UPDATE
      TO authenticated, anon, service_role
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow all delete on articles"
      ON public.articles FOR DELETE
      TO authenticated, anon, service_role
      USING (true);
  END IF;
END $$;
