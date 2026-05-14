-- Migration: Rename approved to active and add suspended status
-- Created: 2026-05-13

-- ─── RENAME ENUM VALUE ───────────────────────────────────────────────
-- PostgreSQL automatically updates existing rows when renaming enum values

ALTER TYPE user_approval_status RENAME VALUE 'approved' TO 'active';

-- ─── ADD NEW ENUM VALUE ──────────────────────────────────────────────

ALTER TYPE user_approval_status ADD VALUE 'suspended';

-- ─── UPDATE TRIGGER FOR NEW USERS ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, role, approval_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'participant'),
    COALESCE(new.raw_user_meta_data->>'approval_status', 'pending_email')
  );
  RETURN new;
END;
$$;
