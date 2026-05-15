# Exploration: Route and Trip Creation

## Current State
MountainPlanner already has UI for route and trip creation:
- Route list, create, edit, detail pages exist
- Trip list, create (3-step wizard with route selection), edit, detail pages exist
- Frontend role protection via beforeLoad for organizer/expedition_lead
- Complete database schema with routes, route_waypoints, route_skill_requirements, trips, trip_participants, etc.

### Affected Areas
- `src/routes/_app.routes.new.tsx` — Route creation form (GPX upload is placeholder)
- `src/routes/_app.routes.$routeId.edit.tsx` — Route edit form
- `src/routes/_app.trips.new.tsx` — Trip creation wizard
- `src/routes/_app.trips.$tripId.edit.tsx` — Trip edit form
- `supabase/migrations/` — RLS policies need role validation
- `src/lib/supabase.ts` / `src/lib/supabase.server.ts` — Storage uploads

## Gaps Identified

### Routes
1. **GPX upload is placeholder** — No actual upload to Supabase Storage, no parsing
2. **No waypoint creation UI** — Routes created without waypoints
3. **RLS policies don't validate roles** — Any authenticated user can create routes
4. **Missing fields in forms** — story, cover_image not editable
5. **No validation of user approval_status** — beforeLoad checks roles but not active status

### Trips
1. **Participant management actions missing** — No confirm/reject/cancel UI
2. **Equipment checklist not functional** — Checkboxes not connected to database
3. **Missing fields** — meeting_lat/lng, story, cover_image
4. **RLS policies don't validate organizer role** — Any authenticated user can create trips

## Approaches

### Approach A: Fix Everything at Once
Implement all gaps in routes and trips simultaneously.
- Pros: Complete feature in one go
- Cons: Large PR, harder to review, higher risk
- Effort: High

### Approach B: Phase 1 - Routes Foundation, Phase 2 - Trip Creation Polish
Phase 1: Fix route creation (GPX upload, waypoints, RLS, fields)
Phase 2: Polish trip creation (participant management, equipment, fields)
- Pros: Incremental delivery, easier to review and test
- Cons: Two phases instead of one
- Effort: Medium (split into two)

### Approach C: Minimum Viable Fix
Fix only the critical blockers: RLS policies + GPX upload + waypoint creation.
Leave UI polish (equipment checklist, participant management) for later.
- Pros: Fast delivery, core functionality works
- Cons: Some UI remains non-functional
- Effort: Low-Medium

## Recommendation
**Approach B (Phased)** — Start with Phase 1: Route Creation Foundation. This unblocks the core differentiator (GPX-based routes with waypoints) and secures the backend. Phase 2 can follow for trip polish.

## Risks
- GPX parsing complexity (XML parsing in browser vs server)
- Supabase Storage setup and permissions
- RLS policy changes could break existing functionality if not tested
