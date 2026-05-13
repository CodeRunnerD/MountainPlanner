export type AppRole = 'organizer' | 'expedition_lead' | 'participant'
export type TripStatus = 'draft' | 'open' | 'closed' | 'completed' | 'cancelled'
export type RegistrationStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'
export type EquipmentStatus = 'owned' | 'needs_rental'
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type WaypointType = 'start' | 'waypoint' | 'summit' | 'end'
export type TripPace = 'slow' | 'medium' | 'sport'

export interface Profile {
  id: string
  display_name: string
  avatar_url?: string
  role: AppRole
  phone?: string
  neighborhood?: string
  lat?: number
  lng?: number
  created_at: string
}

export interface Route {
  id: string
  name: string
  description?: string
  cover_image?: string
  story?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  gpx_file_path?: string
  gpx_parsed?: {
    distance?: number
    elevation_gain?: number
    elevation_loss?: number
  }
  source_url?: string
  created_by?: string
  created_at: string
}

export interface RouteWaypoint {
  id: string
  route_id: string
  name: string
  lat: number
  lng: number
  elevation?: number
  order_index: number
  type: WaypointType
}

export interface RouteSkillRequirement {
  id: string
  route_id: string
  skill_tag: string
}

export interface Trip {
  id: string
  route_id: string
  organizer_id: string
  title: string
  meeting_point?: string
  meeting_lat?: number
  meeting_lng?: number
  start_date: string
  end_date?: string
  pace: TripPace
  status: TripStatus
  max_participants?: number
  cover_image?: string
  story?: string
  created_at: string
}

export interface TripParticipant {
  id: string
  trip_id: string
  profile_id: string
  status: RegistrationStatus
  needs_transport: boolean
  registered_at: string
}

export interface TripEquipmentRequirement {
  id: string
  trip_id: string
  item_name: string
  mandatory: boolean
}

export interface ParticipantEquipment {
  id: string
  participant_id: string
  equipment_id: string
  status: EquipmentStatus
}

export interface SensitiveDataVault {
  id: string
  profile_id: string
  trip_id: string
  encrypted_cedula?: string
  encrypted_emergency_phone?: string
  encrypted_insurance?: string
  created_at: string
}

export interface MedicalInfo {
  id: string
  profile_id: string
  blood_type?: BloodType
  allergies?: string[]
  medications?: string
  notes?: string
}

export interface Vehicle {
  id: string
  owner_id: string
  trip_id: string
  model?: string
  capacity: number
  tags?: string[]
  is_confirmed: boolean
}

export interface TransportAssignment {
  id: string
  vehicle_id: string
  participant_id: string
  assigned_by?: string
}

export interface SummitLog {
  id: string
  profile_id: string
  trip_id?: string
  route_id?: string
  completed_at: string
  notes?: string
}
