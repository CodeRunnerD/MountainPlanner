-- MountainPlanner Initial Schema
-- Created: 2026-05-03
-- Uses Supabase Auth (no Drizzle)

-- ─── ENUMS ───────────────────────────────────────────────────────────

CREATE TYPE app_role AS ENUM ('organizer', 'expedition_lead', 'participant');
CREATE TYPE trip_status AS ENUM ('draft', 'open', 'closed', 'completed', 'cancelled');
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled');
CREATE TYPE equipment_status AS ENUM ('owned', 'needs_rental');
CREATE TYPE blood_type_enum AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE expense_category AS ENUM ('fuel', 'rental', 'food', 'other');
CREATE TYPE waypoint_type AS ENUM ('start', 'waypoint', 'summit', 'end');
CREATE TYPE trip_pace AS ENUM ('slow', 'medium', 'sport');

-- ─── EXTENSIONS ──────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLES ──────────────────────────────────────────────────────────

-- Profiles: extends auth.users
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  role app_role NOT NULL DEFAULT 'participant',
  phone text,
  neighborhood text,
  lat double precision,
  lng double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Routes: mountain route definitions
CREATE TABLE routes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  cover_image text,
  story text,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  gpx_file_path text,
  gpx_parsed jsonb DEFAULT '{}',
  source_url text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Route waypoints
CREATE TABLE route_waypoints (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  elevation double precision,
  order_index int NOT NULL DEFAULT 0,
  type waypoint_type NOT NULL DEFAULT 'waypoint'
);

-- Route skill requirements
CREATE TABLE route_skill_requirements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  skill_tag text NOT NULL
);

-- Trips: scheduled outings
CREATE TABLE trips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  meeting_point text,
  meeting_lat double precision,
  meeting_lng double precision,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  pace trip_pace NOT NULL DEFAULT 'medium',
  status trip_status NOT NULL DEFAULT 'draft',
  max_participants int,
  cover_image text,
  story text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trip participants
CREATE TABLE trip_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status registration_status NOT NULL DEFAULT 'pending',
  needs_transport boolean NOT NULL DEFAULT false,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trip_id, profile_id)
);

-- Trip equipment requirements
CREATE TABLE trip_equipment_requirements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  mandatory boolean NOT NULL DEFAULT false
);

-- Participant equipment status
CREATE TABLE participant_equipment (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES trip_equipment_requirements(id) ON DELETE CASCADE,
  status equipment_status NOT NULL DEFAULT 'owned',
  UNIQUE(participant_id, equipment_id)
);

-- Sensitive data vault (encrypted at application layer)
CREATE TABLE sensitive_data_vault (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  encrypted_cedula text,
  encrypted_emergency_phone text,
  encrypted_insurance text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, trip_id)
);

-- Medical info
CREATE TABLE medical_info (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blood_type blood_type_enum,
  allergies text[] DEFAULT '{}',
  medications text,
  notes text,
  UNIQUE(profile_id)
);

-- Vehicles
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  model text,
  capacity int NOT NULL DEFAULT 1,
  tags text[] DEFAULT '{}',
  is_confirmed boolean NOT NULL DEFAULT false
);

-- Transport assignments
CREATE TABLE transport_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(vehicle_id, participant_id)
);

-- Expenses
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  paid_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category expense_category NOT NULL DEFAULT 'other',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  description text,
  split_among uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Summit log
CREATE TABLE summit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  completed_at timestamptz NOT NULL,
  notes text
);

-- ─── INDEXES ─────────────────────────────────────────────────────────

CREATE INDEX idx_routes_created_by ON routes(created_by);
CREATE INDEX idx_route_waypoints_route_id ON route_waypoints(route_id);
CREATE INDEX idx_route_skills_route_id ON route_skill_requirements(route_id);
CREATE INDEX idx_trips_route_id ON trips(route_id);
CREATE INDEX idx_trips_organizer_id ON trips(organizer_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trip_participants_trip_id ON trip_participants(trip_id);
CREATE INDEX idx_trip_participants_profile_id ON trip_participants(profile_id);
CREATE INDEX idx_trip_equipment_trip_id ON trip_equipment_requirements(trip_id);
CREATE INDEX idx_participant_equipment_participant_id ON participant_equipment(participant_id);
CREATE INDEX idx_sensitive_data_profile_id ON sensitive_data_vault(profile_id);
CREATE INDEX idx_sensitive_data_trip_id ON sensitive_data_vault(trip_id);
CREATE INDEX idx_medical_info_profile_id ON medical_info(profile_id);
CREATE INDEX idx_vehicles_trip_id ON vehicles(trip_id);
CREATE INDEX idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX idx_transport_assignments_vehicle_id ON transport_assignments(vehicle_id);
CREATE INDEX idx_transport_assignments_participant_id ON transport_assignments(participant_id);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_summit_log_profile_id ON summit_log(profile_id);
CREATE INDEX idx_summit_log_trip_id ON summit_log(trip_id);

-- ─── RLS POLICIES ────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_skill_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_equipment_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitive_data_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE summit_log ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Routes: viewable by all, create/edit by authenticated
CREATE POLICY "Routes are viewable by everyone" ON routes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create routes" ON routes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own routes" ON routes FOR UPDATE USING (auth.uid() = created_by);

-- Route waypoints: viewable by all, manage by route owner
CREATE POLICY "Waypoints are viewable by everyone" ON route_waypoints FOR SELECT USING (true);
CREATE POLICY "Route owners can manage waypoints" ON route_waypoints FOR ALL USING (
  EXISTS (SELECT 1 FROM routes WHERE routes.id = route_waypoints.route_id AND routes.created_by = auth.uid())
);

-- Route skills: viewable by all, manage by route owner
CREATE POLICY "Skills are viewable by everyone" ON route_skill_requirements FOR SELECT USING (true);
CREATE POLICY "Route owners can manage skills" ON route_skill_requirements FOR ALL USING (
  EXISTS (SELECT 1 FROM routes WHERE routes.id = route_skill_requirements.route_id AND routes.created_by = auth.uid())
);

-- Trips: viewable by all, create/edit by organizer
CREATE POLICY "Trips are viewable by everyone" ON trips FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create trips" ON trips FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Organizers can update own trips" ON trips FOR UPDATE USING (auth.uid() = organizer_id);

-- Trip participants: viewable by trip members, insert by self
CREATE POLICY "Participants viewable by trip members" ON trip_participants FOR SELECT USING (true);
CREATE POLICY "Users can join trips" ON trip_participants FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Organizers can manage participants" ON trip_participants FOR UPDATE USING (
  EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_participants.trip_id AND trips.organizer_id = auth.uid())
);

-- Equipment requirements: viewable by all, manage by organizer
CREATE POLICY "Equipment viewable by everyone" ON trip_equipment_requirements FOR SELECT USING (true);
CREATE POLICY "Organizers can manage equipment" ON trip_equipment_requirements FOR ALL USING (
  EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_equipment_requirements.trip_id AND trips.organizer_id = auth.uid())
);

-- Participant equipment: viewable by all, update own
CREATE POLICY "Participant equipment viewable by everyone" ON participant_equipment FOR SELECT USING (true);
CREATE POLICY "Users can update own equipment" ON participant_equipment FOR UPDATE USING (
  EXISTS (SELECT 1 FROM trip_participants WHERE trip_participants.id = participant_equipment.participant_id AND trip_participants.profile_id = auth.uid())
);

-- Sensitive data: only organizers of the trip can view
CREATE POLICY "Only organizers can view sensitive data" ON sensitive_data_vault FOR SELECT USING (
  EXISTS (SELECT 1 FROM trips WHERE trips.id = sensitive_data_vault.trip_id AND trips.organizer_id = auth.uid())
  OR auth.uid() = profile_id
);
CREATE POLICY "Users can insert own sensitive data" ON sensitive_data_vault FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Medical info: view own + organizers of trips you're in
CREATE POLICY "Users can view own medical info" ON medical_info FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Organizers can view participant medical info" ON medical_info FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM trip_participants
    JOIN trips ON trips.id = trip_participants.trip_id
    WHERE trip_participants.profile_id = medical_info.profile_id
    AND trips.organizer_id = auth.uid()
  )
);
CREATE POLICY "Users can update own medical info" ON medical_info FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own medical info" ON medical_info FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Vehicles: viewable by all, manage by owner or organizer
CREATE POLICY "Vehicles viewable by everyone" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Users can register own vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Organizers can manage trip vehicles" ON vehicles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM trips WHERE trips.id = vehicles.trip_id AND trips.organizer_id = auth.uid())
  OR auth.uid() = owner_id
);

-- Transport assignments: viewable by all, manage by organizer
CREATE POLICY "Transport assignments viewable by everyone" ON transport_assignments FOR SELECT USING (true);
CREATE POLICY "Organizers can manage assignments" ON transport_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM trips
    JOIN vehicles ON vehicles.trip_id = trips.id
    WHERE vehicles.id = transport_assignments.vehicle_id
    AND trips.organizer_id = auth.uid()
  )
);

-- Expenses: viewable by trip members, manage by payer or organizer
CREATE POLICY "Expenses viewable by everyone" ON expenses FOR SELECT USING (true);
CREATE POLICY "Users can add expenses" ON expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Payer or organizer can update expenses" ON expenses FOR UPDATE USING (
  auth.uid() = paid_by
  OR EXISTS (SELECT 1 FROM trips WHERE trips.id = expenses.trip_id AND trips.organizer_id = auth.uid())
);

-- Summit log: viewable by all, manage own
CREATE POLICY "Summit logs viewable by everyone" ON summit_log FOR SELECT USING (true);
CREATE POLICY "Users can manage own summit logs" ON summit_log FOR ALL USING (auth.uid() = profile_id);

-- ─── AUTO-CREATE PROFILE TRIGGER ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'participant')
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
