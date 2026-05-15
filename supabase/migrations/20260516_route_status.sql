-- Migration: Route status + created_by + status-based RLS
-- Created: 2026-05-15
-- Phase 3: Route Approval Workflow + Draft Mode

-- ─── ADD STATUS COLUMN TO ROUTES ────────────────────────────────────

-- Create route_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'route_status') THEN
    CREATE TYPE route_status AS ENUM ('draft', 'pending_approval', 'published');
  END IF;
END
$$;

-- Add status column to routes
ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS status route_status NOT NULL DEFAULT 'draft';

-- Add created_by column if not exists (should already exist from Phase 1)
ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);

-- Backfill existing routes to published
UPDATE routes SET status = 'published' WHERE status = 'draft' AND created_at < NOW();

-- ─── UPDATE RLS POLICIES FOR ROUTES ─────────────────────────────────

-- Drop old route policies
DROP POLICY IF EXISTS "Only approved organizers can create routes" ON routes;
DROP POLICY IF EXISTS "Only approved organizers can update routes" ON routes;
DROP POLICY IF EXISTS "Routes are visible to authenticated users" ON routes;
DROP POLICY IF EXISTS "Routes visible by status" ON routes;
DROP POLICY IF EXISTS "Routes update by role and status" ON routes;
DROP POLICY IF EXISTS "Only creator or organizer can delete routes" ON routes;

-- SELECT policy with status-based visibility
CREATE POLICY "Routes visible by status"
  ON routes FOR SELECT
  USING (
    status = 'published'
    OR (
      status = 'draft'
      AND created_by = auth.uid()
    )
    OR (
      status = 'pending_approval'
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'organizer'
            AND profiles.approval_status = 'active'
        )
      )
    )
  );

-- INSERT policy (same as before, requires approved organizer/expedition_lead)
CREATE POLICY "Only approved organizers can create routes"
  ON routes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('organizer', 'expedition_lead')
        AND profiles.approval_status = 'active'
    )
  );

-- UPDATE policy with role/status-based rules
CREATE POLICY "Routes update by role and status"
  ON routes FOR UPDATE
  USING (
    -- Organizer can update any route
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'organizer'
        AND profiles.approval_status = 'active'
    )
    OR (
      -- Expedition lead can update their own non-published routes
      created_by = auth.uid()
      AND status IN ('draft', 'pending_approval')
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'expedition_lead'
          AND profiles.approval_status = 'active'
      )
    )
  );

-- DELETE policy
CREATE POLICY "Only creator or organizer can delete routes"
  ON routes FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'organizer'
        AND profiles.approval_status = 'active'
    )
  );

-- ─── UPDATE RLS POLICIES FOR ROUTE_WAYPOINTS ────────────────────────

DROP POLICY IF EXISTS "Approved organizers can manage waypoints" ON route_waypoints;
DROP POLICY IF EXISTS "Waypoints managed by route owner or approved organizer" ON route_waypoints;

CREATE POLICY "Waypoints managed by route owner or approved organizer"
  ON route_waypoints FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM routes
      JOIN profiles ON profiles.id = auth.uid()
      WHERE routes.id = route_waypoints.route_id
        AND (
          routes.created_by = auth.uid()
          OR (
            profiles.role IN ('organizer', 'expedition_lead')
            AND profiles.approval_status = 'active'
          )
        )
    )
  );

-- ─── UPDATE RLS POLICIES FOR ROUTE_SKILL_REQUIREMENTS ───────────────

DROP POLICY IF EXISTS "Approved organizers can manage skills" ON route_skill_requirements;
DROP POLICY IF EXISTS "Skills managed by route owner or approved organizer" ON route_skill_requirements;

CREATE POLICY "Skills managed by route owner or approved organizer"
  ON route_skill_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM routes
      JOIN profiles ON profiles.id = auth.uid()
      WHERE routes.id = route_skill_requirements.route_id
        AND (
          routes.created_by = auth.uid()
          OR (
            profiles.role IN ('organizer', 'expedition_lead')
            AND profiles.approval_status = 'active'
          )
        )
    )
  );
