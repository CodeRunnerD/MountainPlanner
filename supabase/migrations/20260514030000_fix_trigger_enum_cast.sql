-- Migration: Fix trigger to cast approval_status to enum type
-- Created: 2026-05-14

-- ─── FIX TRIGGER ─────────────────────────────────────────────────────

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
    COALESCE(new.raw_user_meta_data->>'approval_status', 'pending_email')::user_approval_status
  );
  RETURN new;
END;
$$;
