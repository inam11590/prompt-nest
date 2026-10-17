-- Migration: 005_collections.sql
-- Description: Creates persistent prompt collections and collection_items with private-by-default visibility,
-- optimistic concurrency versioning, atomic reordering, and strict owner/public RLS.

-- 1. CREATE COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'PUBLIC')),
  concurrency_version INTEGER NOT NULL DEFAULT 1 CHECK (concurrency_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enforce explicit field constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_collections_title_length'
  ) THEN
    ALTER TABLE public.collections ADD CONSTRAINT chk_collections_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 120);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_collections_desc_length'
  ) THEN
    ALTER TABLE public.collections ADD CONSTRAINT chk_collections_desc_length CHECK (description IS NULL OR char_length(description) <= 500);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_collections_public_id_format'
  ) THEN
    ALTER TABLE public.collections ADD CONSTRAINT chk_collections_public_id_format CHECK (public_id ~ '^[a-z0-9_-]{8,32}$');
  END IF;
END $$;

-- 2. CREATE COLLECTION_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_collection_prompt UNIQUE (collection_id, prompt_id)
);

-- 3. INDEXES FOR PERFORMANCE, ORDERING, AND PUBLIC LOOKUP
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_public_id ON public.collections(public_id);
CREATE INDEX IF NOT EXISTS idx_collections_visibility ON public.collections(visibility) WHERE visibility = 'PUBLIC';
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_order ON public.collection_items(collection_id, position ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_collection_items_prompt_id ON public.collection_items(prompt_id);

-- 4. PREVENT MUTATING IMMUTABLE PUBLIC IDENTIFIER
CREATE OR REPLACE FUNCTION public.prevent_collection_public_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_id <> OLD.public_id THEN
    RAISE EXCEPTION 'public_id is immutable and cannot be changed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_collection_public_id_change ON public.collections;
CREATE TRIGGER trg_prevent_collection_public_id_change
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_collection_public_id_change();

-- 5. AUTOMATIC CONCURRENCY VERSION BUMP ON MEMBERSHIP CHANGES
CREATE OR REPLACE FUNCTION public.bump_collection_version_on_item_change()
RETURNS TRIGGER AS $$
DECLARE
  target_collection_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_collection_id := OLD.collection_id;
  ELSE
    target_collection_id := NEW.collection_id;
  END IF;

  UPDATE public.collections
  SET concurrency_version = concurrency_version + 1,
      updated_at = timezone('utc'::text, now())
  WHERE id = target_collection_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_collection_version ON public.collection_items;
CREATE TRIGGER trg_bump_collection_version
  AFTER INSERT OR DELETE ON public.collection_items
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_collection_version_on_item_change();

-- 6. ATOMIC REORDERING STORED PROCEDURE
CREATE OR REPLACE FUNCTION public.reorder_collection_items(
  p_collection_id UUID,
  p_expected_version INTEGER,
  p_item_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_id UUID;
  v_current_version INTEGER;
  v_existing_count INTEGER;
  v_matched_count INTEGER;
  v_idx INTEGER;
BEGIN
  -- Verify caller owns the collection
  SELECT user_id, concurrency_version
  INTO v_owner_id, v_current_version
  FROM public.collections
  WHERE id = p_collection_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Collection not found';
  END IF;

  IF v_owner_id <> auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to reorder this collection';
  END IF;

  -- Optimistic concurrency check
  IF v_current_version <> p_expected_version THEN
    RAISE EXCEPTION 'CONFLICT: Collection has been modified by another operation';
  END IF;

  -- Total items in collection
  SELECT COUNT(*) INTO v_existing_count
  FROM public.collection_items
  WHERE collection_id = p_collection_id;

  -- Ensure exact match of item count
  IF array_length(p_item_ids, 1) <> v_existing_count THEN
    RAISE EXCEPTION 'Item IDs array length does not match collection items count';
  END IF;

  -- Validate all IDs in array belong to this collection without duplicates
  SELECT COUNT(DISTINCT id) INTO v_matched_count
  FROM public.collection_items
  WHERE collection_id = p_collection_id
    AND id = ANY(p_item_ids);

  IF v_matched_count <> v_existing_count THEN
    RAISE EXCEPTION 'Item IDs contain foreign, missing, or duplicate items';
  END IF;

  -- Apply 0-based ordering sequentially
  FOR v_idx IN 1 .. array_length(p_item_ids, 1) LOOP
    UPDATE public.collection_items
    SET position = v_idx - 1
    WHERE id = p_item_ids[v_idx] AND collection_id = p_collection_id;
  END LOOP;

  -- Increment version on collection
  UPDATE public.collections
  SET concurrency_version = concurrency_version + 1,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_collection_id
  RETURNING concurrency_version INTO v_current_version;

  RETURN v_current_version;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reorder_collection_items(UUID, INTEGER, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_collection_items(UUID, INTEGER, UUID[]) TO authenticated;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Collections RLS:
-- Owners can read their own private and public collections; non-owners can ONLY read public collections
DROP POLICY IF EXISTS "Users can read own collections or public collections" ON public.collections;
CREATE POLICY "Users can read own collections or public collections"
  ON public.collections FOR SELECT
  USING (user_id = auth.uid() OR visibility = 'PUBLIC');

-- Owners can insert their own collections
DROP POLICY IF EXISTS "Users can insert own collections" ON public.collections;
CREATE POLICY "Users can insert own collections"
  ON public.collections FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Owners can update their own collections
DROP POLICY IF EXISTS "Users can update own collections" ON public.collections;
CREATE POLICY "Users can update own collections"
  ON public.collections FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Owners can delete their own collections
DROP POLICY IF EXISTS "Users can delete own collections" ON public.collections;
CREATE POLICY "Users can delete own collections"
  ON public.collections FOR DELETE
  USING (user_id = auth.uid());

-- Collection Items RLS:
-- SELECT:
-- 1. Owner can select items in their collection
-- 2. Public can select items ONLY if collection is PUBLIC AND prompt is currently PUBLISHED
DROP POLICY IF EXISTS "Users can view collection items" ON public.collection_items;
CREATE POLICY "Users can view collection items"
  ON public.collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_items.collection_id
        AND c.user_id = auth.uid()
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM public.collections c
        WHERE c.id = collection_items.collection_id
          AND c.visibility = 'PUBLIC'
      )
      AND
      EXISTS (
        SELECT 1 FROM public.prompts p
        WHERE p.id = collection_items.prompt_id
          AND p.published = true
      )
    )
  );

-- INSERT:
-- Owner can insert items ONLY if prompt is currently published
DROP POLICY IF EXISTS "Owners can add published prompts to own collection" ON public.collection_items;
CREATE POLICY "Owners can add published prompts to own collection"
  ON public.collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_items.collection_id
        AND c.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM public.prompts p
      WHERE p.id = collection_items.prompt_id
        AND p.published = true
    )
  );

-- UPDATE:
-- Owner can update item positions
DROP POLICY IF EXISTS "Owners can update own collection items" ON public.collection_items;
CREATE POLICY "Owners can update own collection items"
  ON public.collection_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_items.collection_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_items.collection_id
        AND c.user_id = auth.uid()
    )
  );

-- DELETE:
-- Owner can remove items from own collection
DROP POLICY IF EXISTS "Owners can remove items from own collection" ON public.collection_items;
CREATE POLICY "Owners can remove items from own collection"
  ON public.collection_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_items.collection_id
        AND c.user_id = auth.uid()
    )
  );
