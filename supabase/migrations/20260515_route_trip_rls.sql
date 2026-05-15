-- Migration: Route and Trip RLS Policies + Storage Bucket
-- Created: 2026-05-15
-- Phase 1: Route Creation Foundation

-- ─── UPDATE RLS POLICIES FOR ROUTES ─────────────────────────────────

-- Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated users can create routes" ON routes;
DROP POLICY IF EXISTS "Users can update own routes" ON routes;
DROP POLICY IF EXISTS "Only approved organizers can create routes" ON routes;
DROP POLICY IF EXISTS "Only approved organizers can update routes" ON routes;

-- New strict policies: only approved organizers/expedition_leads can create/update
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

CREATE POLICY "Only approved organizers can update routes"
  ON routes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('organizer', 'expedition_lead')
        AND profiles.approval_status = 'active'
    )
  );

-- ─── UPDATE RLS POLICIES FOR ROUTE_WAYPOINTS ────────────────────────

DROP POLICY IF EXISTS "Route owners can manage waypoints" ON route_waypoints;
DROP POLICY IF EXISTS "Approved organizers can manage waypoints" ON route_waypoints;

CREATE POLICY "Approved organizers can manage waypoints"
  ON route_waypoints FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM routes
      JOIN profiles ON profiles.id = auth.uid()
      WHERE routes.id = route_waypoints.route_id
        AND (
          routes.created_by = auth.uid()
          OR (profiles.role IN ('organizer', 'expedition_lead') AND profiles.approval_status = 'active')
        )
    )
  );

-- ─── UPDATE RLS POLICIES FOR ROUTE_SKILL_REQUIREMENTS ───────────────

DROP POLICY IF EXISTS "Route owners can manage skills" ON route_skill_requirements;
DROP POLICY IF EXISTS "Approved organizers can manage skills" ON route_skill_requirements;

CREATE POLICY "Approved organizers can manage skills"
  ON route_skill_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM routes
      JOIN profiles ON profiles.id = auth.uid()
      WHERE routes.id = route_skill_requirements.route_id
        AND (
          routes.created_by = auth.uid()
          OR (profiles.role IN ('organizer', 'expedition_lead') AND profiles.approval_status = 'active')
        )
    )
  );

-- ─── STORAGE BUCKET FOR GPX/KML FILES ───────────────────────────────

-- Create bucket if not exists (idempotent via insert on conflict)
INSERT INTO storage.buckets (id, name, public)
VALUES ('route-gpx', 'route-gpx', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for route-gpx bucket
DROP POLICY IF EXISTS "Authenticated users can read route-gpx" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can upload route-gpx" ON storage.objects;
DROP POLICY IF EXISTS "Approved organizers can upload route-gpx" ON storage.objects;
DROP POLICY IF EXISTS "Approved organizers can update route-gpx" ON storage.objects;
DROP POLICY IF EXISTS "Approved organizers can delete route-gpx" ON storage.objects;

CREATE POLICY "Authenticated users can read route-gpx"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'route-gpx' AND auth.role() = 'authenticated');

CREATE POLICY "Approved organizers can upload route-gpx"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'route-gpx'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('organizer', 'expedition_lead')
        AND profiles.approval_status = 'active'
    )
  );

CREATE POLICY "Approved organizers can update route-gpx"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'route-gpx'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('organizer', 'expedition_lead')
        AND profiles.approval_status = 'active'
    )
  );

CREATE POLICY "Approved organizers can delete route-gpx"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'route-gpx'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('organizer', 'expedition_lead')
        AND profiles.approval_status = 'active'
    )
  );

-- ─── UPDATE RLS POLICIES FOR TRIPS ──────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can create trips" ON trips;
DROP POLICY IF EXISTS "Users can update own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON trips;
DROP POLICY IF EXISTS "Only approved organizers can create trips" ON trips;
DROP POLICY IF EXISTS "Organizer or approved organizers can update trips" ON trips;
DROP POLICY IF EXISTS "Only organizer can delete trips" ON trips;

CREATE POLICY "Only approved organizers can create trips"
  ON trips FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('organizer', 'expedition_lead')
        AND profiles.approval_status = 'active'
    )
  );

CREATE POLICY "Organizer or approved organizers can update trips"
  ON trips FOR UPDATE
  USING (
    organizer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('organizer', 'expedition_lead')
        AND profiles.approval_status = 'active'
    )
  );

CREATE POLICY "Only organizer can delete trips"
  ON trips FOR DELETE
  USING (organizer_id = auth.uid());

-- ─── UPDATE RLS POLICIES FOR TRIP_PARTICIPANTS ──────────────────────

DROP POLICY IF EXISTS "Authenticated users can register for trips" ON trip_participants;
DROP POLICY IF EXISTS "Trip organizers can manage participants" ON trip_participants;
DROP POLICY IF EXISTS "Authenticated users can register themselves" ON trip_participants;
DROP POLICY IF EXISTS "Only trip organizer can update participant status" ON trip_participants;
DROP POLICY IF EXISTS "Only trip organizer can delete participants" ON trip_participants;

CREATE POLICY "Authenticated users can register themselves"
  ON trip_participants FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
  );

CREATE POLICY "Only trip organizer can update participant status"
  ON trip_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_participants.trip_id
        AND trips.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Only trip organizer can delete participants"
  ON trip_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_participants.trip_id
        AND trips.organizer_id = auth.uid()
    )
  );

-- ─── UPDATE RLS POLICIES FOR TRIP_EQUIPMENT_REQUIREMENTS ────────────

DROP POLICY IF EXISTS "Trip organizers can manage equipment" ON trip_equipment_requirements;
DROP POLICY IF EXISTS "Only trip organizer can manage equipment requirements" ON trip_equipment_requirements;

CREATE POLICY "Only trip organizer can manage equipment requirements"
  ON trip_equipment_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_equipment_requirements.trip_id
        AND trips.organizer_id = auth.uid()
    )
  );

-- ─── UPDATE RLS POLICIES FOR PARTICIPANT_EQUIPMENT ──────────────────

DROP POLICY IF EXISTS "Participants can manage own equipment" ON participant_equipment;
DROP POLICY IF EXISTS "Participant owner or trip organizer can manage participant equipment" ON participant_equipment;

CREATE POLICY "Participant owner or trip organizer can manage participant equipment"
  ON participant_equipment FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trip_participants
      JOIN trips ON trips.id = trip_participants.trip_id
      WHERE trip_participants.id = participant_equipment.participant_id
        AND (
          trip_participants.profile_id = auth.uid()
          OR trips.organizer_id = auth.uid()
        )
    )
  );

-- ─── ROLLBACK COMMENTS ──────────────────────────────────────────────
/*
ROLLBACK INSTRUCTIONS:
  Execute these steps in order to safely revert this migration.

  1. DROP NEW TABLE POLICIES (route-related):
     DROP POLICY IF EXISTS "Only approved organizers can create routes" ON routes;
     DROP POLICY IF EXISTS "Only approved organizers can update routes" ON routes;
     DROP POLICY IF EXISTS "Approved organizers can manage waypoints" ON route_waypoints;
     DROP POLICY IF EXISTS "Approved organizers can manage skills" ON route_skill_requirements;

  2. RESTORE OLD TABLE POLICIES (route-related):
     CREATE POLICY "Authenticated users can create routes" ON routes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
     CREATE POLICY "Users can update own routes" ON routes FOR UPDATE USING (auth.uid() = created_by);
     CREATE POLICY "Route owners can manage waypoints" ON route_waypoints FOR ALL USING (EXISTS (SELECT 1 FROM routes WHERE routes.id = route_waypoints.route_id AND routes.created_by = auth.uid()));
     CREATE POLICY "Route owners can manage skills" ON route_skill_requirements FOR ALL USING (EXISTS (SELECT 1 FROM routes WHERE routes.id = route_skill_requirements.route_id AND routes.created_by = auth.uid()));

  3. DROP NEW TABLE POLICIES (trip-related):
     DROP POLICY IF EXISTS "Only approved organizers can create trips" ON trips;
     DROP POLICY IF EXISTS "Organizer or approved organizers can update trips" ON trips;
     DROP POLICY IF EXISTS "Only organizer can delete trips" ON trips;
     DROP POLICY IF EXISTS "Authenticated users can register themselves" ON trip_participants;
     DROP POLICY IF EXISTS "Only trip organizer can update participant status" ON trip_participants;
     DROP POLICY IF EXISTS "Only trip organizer can delete participants" ON trip_participants;
     DROP POLICY IF EXISTS "Only trip organizer can manage equipment requirements" ON trip_equipment_requirements;
     DROP POLICY IF EXISTS "Participant owner or trip organizer can manage participant equipment" ON participant_equipment;

  4. RESTORE OLD TABLE POLICIES (trip-related):
     CREATE POLICY "Authenticated users can create trips" ON trips FOR INSERT WITH CHECK (auth.role() = 'authenticated');
     CREATE POLICY "Users can update own trips" ON trips FOR UPDATE USING (auth.uid() = organizer_id);
     CREATE POLICY "Users can delete own trips" ON trips FOR DELETE USING (auth.uid() = organizer_id);
     CREATE POLICY "Authenticated users can register for trips" ON trip_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
     CREATE POLICY "Trip organizers can manage participants" ON trip_participants FOR ALL USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_participants.trip_id AND trips.organizer_id = auth.uid()));
     CREATE POLICY "Trip organizers can manage equipment" ON trip_equipment_requirements FOR ALL USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_equipment_requirements.trip_id AND trips.organizer_id = auth.uid()));
     CREATE POLICY "Participants can manage own equipment" ON participant_equipment FOR ALL USING (EXISTS (SELECT 1 FROM trip_participants WHERE trip_participants.id = participant_equipment.participant_id AND trip_participants.profile_id = auth.uid()));

  5. STORAGE BUCKET ROLLBACK (route-gpx):
     -- Drop new storage policies
     DROP POLICY IF EXISTS "Authenticated users can read route-gpx" ON storage.objects;
     DROP POLICY IF EXISTS "Approved organizers can upload route-gpx" ON storage.objects;
     DROP POLICY IF EXISTS "Approved organizers can update route-gpx" ON storage.objects;
     DROP POLICY IF EXISTS "Approved organizers can delete route-gpx" ON storage.objects;

     -- Optional: remove bucket (WARNING: this permanently deletes all files stored in the bucket)
     -- DELETE FROM storage.objects WHERE bucket_id = 'route-gpx';
     -- DELETE FROM storage.buckets WHERE id = 'route-gpx';

     -- If you had previous storage policies, restore them here.
*/
