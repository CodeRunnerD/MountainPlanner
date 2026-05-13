-- Migration: Add user approval workflow
-- Created: 2026-05-13

-- ─── APPROVAL STATUS ENUM ────────────────────────────────────────────

CREATE TYPE user_approval_status AS ENUM ('pending_email', 'pending_approval', 'approved', 'rejected');

-- ─── ALTER PROFILES TABLE ────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN approval_status user_approval_status NOT NULL DEFAULT 'pending_email';

-- ─── UPDATE EXISTING ORGANIZER ACCOUNTS ──────────────────────────────

UPDATE profiles SET approval_status = 'approved' WHERE role IN ('organizer', 'expedition_lead');

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
    'pending_email'
  );
  RETURN new;
END;
$$;

-- ─── RLS POLICY FOR ORGANIZERS TO MANAGE APPROVALS ───────────────────

CREATE POLICY "Organizers can update user approval status" ON profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('organizer', 'expedition_lead')
  )
);

-- ─── INDEX ───────────────────────────────────────────────────────────

CREATE INDEX idx_profiles_approval_status ON profiles(approval_status);
