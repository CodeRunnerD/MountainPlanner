# Route and Trip Creation Specification

## Purpose
Define secure, role-governed creation flows for routes (with GPX import and waypoints) and trips (with participant management and equipment checklists).

---

## Phase 1: Routes

### Functional Requirements

| ID | Requirement | Strength |
|--|--|--|
| R1 | Only users with role `organizer` or `expedition_lead` SHALL create or edit routes. | SHALL |
| R2 | Users with `approval_status != 'approved'` SHALL NOT create or edit routes, regardless of role. | SHALL NOT |
| R3 | The route form MUST accept `name`, `description`, `story`, `cover_image`, `difficulty`, `duration`, `skill_requirements`, and `equipment_suggestions`. | MUST |
| R4 | The system MUST allow GPX file upload to the `route-gpx` Supabase Storage bucket. | MUST |
| R5 | Uploaded GPX files MUST be parsed to extract track points and waypoints. | MUST |
| R6 | Parsed waypoints MUST auto-populate the route waypoint list; manual waypoint entry MUST remain available. | MUST |
| R7 | Waypoints MUST store `name`, `lat`, `lng`, `elevation`, `type`, and `description`. | MUST |
| R8 | Duplicate waypoint names within the same route SHOULD trigger a client-side warning. | SHOULD |
| R9 | The system MUST allow KML file upload to the `route-gpx` Supabase Storage bucket. | MUST |
| R10 | Uploaded KML files MUST be parsed to extract track points and waypoints (equivalent to GPX). | MUST |
| R11 | The route creation/edit form MUST display an interactive map showing parsed waypoints and track. | MUST |
| R12 | The route detail page MUST provide a download button for the original GPX or KML file if `gpx_file_path` exists. | MUST |
| R13 | The system MUST support `.gpx` and `.kml` file extensions; other extensions MUST be rejected. | MUST |

### Non-Functional Requirements

| ID | Requirement | Strength |
|--|--|--|
| R-NF1 | GPX files MUST NOT exceed 10 MB. | MUST |
| R-NF2 | GPX parsing SHOULD complete within 3 seconds for files up to 5 MB. | SHOULD |
| R-NF3 | Invalid GPX XML MUST return a user-friendly error without crashing the form. | MUST |
| R-NF4 | KML files MUST NOT exceed 10 MB. | MUST |
| R-NF5 | KML parsing SHOULD complete within 3 seconds for files up to 5 MB. | SHOULD |
| R-NF6 | Invalid KML XML MUST return a user-friendly error without crashing the form. | MUST |
| R-NF7 | Map rendering SHOULD complete within 2 seconds for routes with up to 500 waypoints. | SHOULD |
| R-NF8 | Map tiles MUST be loaded over HTTPS. | MUST |

### Scenarios

#### Scenario: Authorized user creates a route with GPX
- GIVEN an authenticated user with role `expedition_lead` and `approval_status = 'approved'`
- WHEN the user uploads a valid GPX file and submits the route form
- THEN the GPX is stored in `route-gpx`, waypoints are parsed and persisted, and the route is saved

#### Scenario: Unapproved organizer is blocked
- GIVEN an authenticated user with role `organizer` and `approval_status = 'pending'`
- WHEN the user navigates to `/routes/new`
- THEN the beforeLoad guard redirects to a forbidden page

#### Scenario: GPX parsing failure
- GIVEN an authenticated approved user on the route creation page
- WHEN the user uploads a malformed GPX file
- THEN the form displays "Invalid GPX file" and no waypoints are added

#### Scenario: Manual waypoint addition
- GIVEN an authenticated approved user creating a route
- WHEN the user adds a waypoint manually with lat/lng/name
- THEN the waypoint appears in the list and is persisted with the route

#### Scenario: Authorized user creates a route with KML
- GIVEN an authenticated user with role `expedition_lead` and `approval_status = 'approved'`
- WHEN the user uploads a valid KML file and submits the route form
- THEN the KML is stored in `route-gpx`, waypoints are parsed and persisted, and the route is saved

#### Scenario: KML parsing failure
- GIVEN an authenticated approved user on the route creation page
- WHEN the user uploads a malformed KML file
- THEN the form displays "Invalid KML file" and no waypoints are added

#### Scenario: Route map visualization on creation
- GIVEN an authenticated approved user uploading a valid GPX file
- WHEN the file is parsed and waypoints are extracted
- THEN an interactive map renders the track polyline and waypoint markers in the form

#### Scenario: Route map visualization on detail
- GIVEN a route with a stored GPX file and parsed waypoints
- WHEN any authenticated user views the route detail page
- THEN an interactive map renders the full track and all waypoints

#### Scenario: Download original GPX file
- GIVEN a route with `gpx_file_path` pointing to a stored GPX file
- WHEN any authenticated user clicks "Download GPX"
- THEN the browser initiates a download of the original file from `route-gpx` bucket

#### Scenario: Download original KML file
- GIVEN a route with `gpx_file_path` pointing to a stored KML file
- WHEN any authenticated user clicks "Download KML"
- THEN the browser initiates a download of the original file from `route-gpx` bucket

---

## Phase 2: Trips

### Functional Requirements

| ID | Requirement | Strength |
|--|--|--|
| T1 | Only users with role `organizer` or `expedition_lead` SHALL create or edit trips. | SHALL |
| T2 | The trip form MUST accept `route_id`, `start_date`, `end_date`, `meeting_lat`, `meeting_lng`, `story`, and `cover_image`. | MUST |
| T3 | A trip MUST be creatable from an existing route; route waypoints SHALL be linked. | MUST |
| T4 | Organizers MUST be able to confirm, reject, or cancel participants on a trip. | MUST |
| T5 | Participants MUST see their status (`pending`, `confirmed`, `rejected`, `cancelled`) on the trip page. | MUST |
| T6 | The equipment checklist MUST persist per trip and be visible to all participants. | MUST |
| T7 | RLS policies SHALL enforce that only trip organizers can update participant status. | SHALL |

### Non-Functional Requirements

| ID | Requirement | Strength |
|--|--|--|
| T-NF1 | Trip creation SHOULD reuse the selected route's cover image by default. | SHOULD |
| T-NF2 | Participant status updates MUST be reflected in real time if Realtime is enabled. | MUST |

### Scenarios

#### Scenario: Organizer creates a trip from a route
- GIVEN an authenticated approved organizer viewing an existing route
- WHEN the organizer clicks "Create Trip" and fills the trip form
- THEN the trip is saved with the route's waypoints linked and the organizer as owner

#### Scenario: Organizer confirms a participant
- GIVEN an authenticated organizer managing a trip with a `pending` participant
- WHEN the organizer clicks "Confirm"
- THEN the participant's status changes to `confirmed` and the participant is notified

#### Scenario: Non-organizer cannot manage participants
- GIVEN an authenticated user who is not the trip organizer
- WHEN the user attempts to call the update-participant-status API directly
- THEN Supabase RLS rejects the mutation and returns a 403 error

#### Scenario: Equipment checklist persistence
- GIVEN an authenticated organizer editing a trip
- WHEN the organizer adds items to the equipment checklist and saves
- THEN the checklist is persisted and visible to all trip participants

---

## Phase 3: Route Approval Workflow + Draft Mode

### Functional Requirements

| ID | Requirement | Strength |
|--|--|--|
| D1 | Routes SHALL have a `status` column with values `draft`, `pending_approval`, or `published`. | SHALL |
| D2 | Organizers with `approval_status = 'approved'` MAY create or edit routes as `published` or `draft` without additional approval. | MAY |
| D3 | Expedition leads with `approval_status = 'approved'` MAY create or edit routes, but the route status MUST be set to `pending_approval` if changed. | MUST |
| D4 | Only organizers MAY approve or reject a route in `pending_approval` status. | MAY |
| D5 | When an organizer approves a `pending_approval` route, its status MUST change to `published`. | MUST |
| D6 | When an organizer rejects a `pending_approval` route, its status MUST change to `draft` and the route MUST remain editable by the creator. | MUST |
| D7 | Routes with status `draft` SHALL be visible only to the user who created them (`created_by = auth.uid()`). | SHALL |
| D8 | Routes with status `pending_approval` SHALL be visible only to the creator and users with role `organizer`. | SHALL |
| D9 | Routes with status `published` SHALL be visible to all authenticated users. | SHALL |
| D10 | The route creation/edit form MUST provide actions: "Guardar borrador" (save as `draft`), "Enviar para aprobación" (set `pending_approval`), "Publicar" (set `published`, organizer-only), and "Rechazar cambios" (set `draft`, organizer-only). | MUST |
| D11 | While a user is creating or editing a route, the form state MUST be auto-saved to a TanStack Store local persistence layer at regular intervals (e.g., every 5 seconds) and on relevant change events. | MUST |
| D12 | If the browser is closed or the network fails, the TanStack Store persisted draft MUST be restored when the user returns to the route form. | MUST |
| D13 | Users MUST be able to discard the TanStack Store persisted draft explicitly via a "Descartar borrador" action. | MUST |
| D14 | Only the creator of a `draft` route MAY edit it. | MAY |
| D15 | RLS policies MUST enforce status-based visibility and role-based transition rules. | MUST |

### Non-Functional Requirements

| ID | Requirement | Strength |
|--|--|--|
| D-NF1 | TanStack Store draft persistence MUST use `localStorage` or `IndexedDB` and MUST NOT exceed 5 MB per draft. | MUST |
| D-NF2 | Auto-save debounce SHOULD be 3–5 seconds to balance UX and performance. | SHOULD |
| D-NF3 | Draft restoration SHOULD complete within 500 ms on form load. | SHOULD |
| D-NF4 | Status transition mutations MUST complete within 1 second under normal network conditions. | MUST |
| D-NF5 | Rejected route notifications SHOULD be delivered to the creator via the existing notification system or in-app badge. | SHOULD |

### Scenarios

#### Scenario: Organizer creates a route and publishes immediately
- GIVEN an authenticated approved organizer on the route creation page
- WHEN the organizer fills the form and clicks "Publicar"
- THEN the route is saved with `status = 'published'` and is visible to all authenticated users

#### Scenario: Organizer saves a route as draft
- GIVEN an authenticated approved organizer on the route creation page
- WHEN the organizer fills the form and clicks "Guardar borrador"
- THEN the route is saved with `status = 'draft'` and is visible only to the organizer

#### Scenario: Expedition lead creates a route and sends for approval
- GIVEN an authenticated approved expedition lead on the route creation page
- WHEN the user fills the form and clicks "Enviar para aprobación"
- THEN the route is saved with `status = 'pending_approval'` and is visible to the creator and all organizers

#### Scenario: Organizer approves a pending route
- GIVEN an authenticated approved organizer viewing a `pending_approval` route created by an expedition lead
- WHEN the organizer clicks "Publicar" (approve)
- THEN the route status changes to `published` and becomes visible to all authenticated users
- AND the creator receives a notification that the route was approved

#### Scenario: Organizer rejects a pending route
- GIVEN an authenticated approved organizer viewing a `pending_approval` route created by an expedition lead
- WHEN the organizer clicks "Rechazar cambios"
- THEN the route status changes to `draft` and remains visible only to the creator
- AND the creator receives a notification that the route was rejected

#### Scenario: Expedition lead edits an existing published route
- GIVEN an authenticated approved expedition lead viewing a `published` route they created
- WHEN the user edits the route and submits
- THEN the route status changes to `pending_approval` (if changed) and awaits organizer approval

#### Scenario: Draft visibility isolation
- GIVEN a route with `status = 'draft'` created by user A
- WHEN user B (authenticated, any role) queries the routes list
- THEN the draft route is excluded from results via RLS

#### Scenario: Pending approval visibility for organizers
- GIVEN a route with `status = 'pending_approval'` created by an expedition lead
- WHEN an organizer views the routes list
- THEN the pending route appears in the list with a `pending_approval` badge

#### Scenario: Auto-save recovery after browser close
- GIVEN an authenticated approved user editing a route form
- WHEN the browser is closed before explicit save
- THEN the TanStack Store persisted draft is restored on next visit to `/routes/new` or the edit page

#### Scenario: Manual draft discard
- GIVEN an authenticated approved user with a restored TanStack Store draft
- WHEN the user clicks "Descartar borrador"
- THEN the store is cleared and the form resets to empty or loaded server state

#### Scenario: Non-creator cannot edit draft
- GIVEN a route with `status = 'draft'` created by user A
- WHEN user B attempts to navigate to `/routes/{id}/edit`
- THEN the beforeLoad guard or RLS policy blocks access and returns 403/forbidden

---

## Role Validation Matrix

| Action | Role Required | approval_status Required | Enforced By |
|--|--|--|--|
| Create/Edit Route | organizer, expedition_lead | approved | beforeLoad + RLS |
| Create/Edit Trip | organizer, expedition_lead | approved | beforeLoad + RLS |
| Update Participant Status | trip organizer | approved | RLS |
| View Route (published) | any authenticated | any | RLS (read access) |
| View Route (draft) | creator only | approved | RLS (created_by = auth.uid()) |
| View Route (pending_approval) | creator + organizers | approved | RLS (created_by = auth.uid() OR role = 'organizer') |
| Approve/Reject Route | organizer | approved | beforeLoad + RLS |
| Publish Route (direct) | organizer | approved | beforeLoad + RLS |

---

## GPX Upload and Parsing Flow

1. User selects GPX file in route form.
2. Client validates file size (< 10 MB) and extension (.gpx).
3. Client uploads to `route-gpx` bucket via Supabase Storage.
4. Client receives public URL and passes it to the parser.
5. Parser extracts `<wpt>` and `<trkpt>` elements into waypoint objects.
6. Waypoints are rendered in the form; user may edit or add more.
7. On route save, waypoints are inserted into the `waypoints` table with `route_id`.

## Trip Creation from Route Flow

1. User clicks "Create Trip" on a route page.
2. Form is pre-filled with `route_id` and default `cover_image`.
3. User sets dates, meeting point, story, and equipment checklist.
4. On save, the trip is inserted; linked waypoints are copied or referenced.
5. Organizer is set as owner; participants table is initialized empty.
