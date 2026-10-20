-- Step 17: Supabase Storage Configuration for Admin Image Uploads
-- Idempotently sets up 'prompt-images' bucket and grants read/write policies

-- 1. Create prompt-images bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prompt-images',
  'prompt-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing policies to prevent duplicate policy errors
DROP POLICY IF EXISTS "Allow public read access to prompt-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated and service role uploads to prompt-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates in prompt-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes in prompt-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 3. Policy: Public Read Access (anyone can view prompt images)
CREATE POLICY "Allow public read access to prompt-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'prompt-images');

-- 4. Policy: Allow uploads (Authenticated users, admins, and service role)
CREATE POLICY "Allow authenticated and service role uploads to prompt-images"
ON storage.objects FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (bucket_id = 'prompt-images');

-- 5. Policy: Allow updates/overwrites in prompt-images
CREATE POLICY "Allow authenticated updates in prompt-images"
ON storage.objects FOR UPDATE
TO authenticated, anon, service_role
USING (bucket_id = 'prompt-images');

-- 6. Policy: Allow deletes in prompt-images
CREATE POLICY "Allow authenticated deletes in prompt-images"
ON storage.objects FOR DELETE
TO authenticated, anon, service_role
USING (bucket_id = 'prompt-images');
