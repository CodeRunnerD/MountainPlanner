# Design: Route and Trip Creation

## Technical Approach

Phased delivery aligned with the proposal: Phase 1 secures route creation with GPX parsing, waypoint management, and role-based RLS. Phase 2 polishes trip creation with participant actions, equipment persistence, and missing form fields. Both phases use the existing TanStack Start file-based routing, Supabase client-server pattern, and `@tanstack/react-form` for forms.

## Architecture Decisions

| Decision | Option A | Option B | Choice | Rationale |
|----------|----------|----------|--------|-----------|
| GPX Parser | `fast-xml-parser` (browser+server) | `xml2js` (Node-only) | `fast-xml-parser` | No polyfills needed; works in Vite browser bundle and SSR; smaller footprint; streaming-friendly for large files. |
| GPX Upload | Client → Supabase Storage → client parse | Client parse → Storage → DB | Client parse + Storage | Avoids serverless function latency; immediate waypoint preview; Storage keeps raw file for re-parse. |
| Waypoint Storage | Reuse `route_waypoints` table | New normalized table | Reuse existing | Schema already supports `lat`, `lng`, `elevation`, `order_index`, `type`. No migration needed. |
| Role Enforcement | RLS policies + `beforeLoad` guard | RLS only | RLS + `beforeLoad` | RLS is the security boundary; `beforeLoad` provides UX redirect. Both required per proposal. |
| Approval Check | Add `approval_status` to `beforeLoad` | Separate middleware | Add to `beforeLoad` | Minimal change; existing pattern already fetches profile in `beforeLoad`. |
| File Size Limit | 5MB client validation | 10MB + server validation | 5MB client + 10MB Storage bucket policy | Prevents abuse while allowing complex multi-day tracks. |
| KML Parser | `fast-xml-parser` (reuse) | `@googlemaps/kml-sax` | `fast-xml-parser` | Already in bundle for GPX; KML is XML; consistent API. |
| Map Library | Leaflet + OpenStreetMap | Mapbox GL JS | Leaflet + OSM | Open source, lightweight, no API key required; offline-friendly if tiles are cached. |
| File Download | Client-side direct Storage URL | Server proxy | Client-side direct URL | Storage already serves public/authenticated URLs; no server latency; simple `<a download>`. |
| Draft Persistence | TanStack Store + localStorage | Supabase `drafts` table | TanStack Store | Zero network dependency; instant recovery; avoids migration complexity for transient data. |
| Status Machine | Column enum + RLS + client helpers | Separate `route_status_changes` audit table | Column enum + RLS | Simplest for current scale; audit trail can be added later if needed. |
| Approval UI | Inline action buttons on route detail | Dedicated `/routes/{id}/approve` page | Inline action buttons | Faster UX; organizers see pending routes in their list; consistent with existing detail page pattern. |

## Route Status State Machine

```
                    ┌─────────────┐
                    │   CREATE    │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  DRAFT   │    │ PENDING  │    │ PUBLISHED│
    │(creator  │    │APPROVAL  │    │ (all)    │
    │ only)    │    │(creator+ │    │          │
    │          │    │organizers│    │          │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         │ organizer     │ organizer     │ organizer
         │ publishes     │ approves      │ edits (stays)
         ▼               ▼               │
    ┌──────────┐    ┌──────────┐        │
    │ PUBLISHED│    │ PUBLISHED│        │
    └──────────┘    └──────────┘        │
                                        │
         expedition lead edits          │
         (or organizer changes mind)    │
         ▼                              │
    ┌──────────┐                        │
    │ PENDING  │────────────────────────┘
    │APPROVAL  │  organizer rejects
    └────┬─────┘
         │
         │ organizer rejects
         ▼
    ┌──────────┐
    │  DRAFT   │
    └──────────┘
```

**Transition rules (enforced client + RLS)**:
- `draft` → `published`: only `organizer` can trigger
- `draft` → `pending_approval`: `expedition_lead` on create/edit; `organizer` optional
- `pending_approval` → `published`: only `organizer`
- `pending_approval` → `draft`: only `organizer` (rejection)
- `published` → `pending_approval`: `expedition_lead` edits existing published route
- `published` → `draft`: only `organizer` (unpublish)

## Draft Auto-Save Flow

```
User types in route form
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Debounced       │────▶│ TanStack Store   │
│ onChange (3s)   │     │ (localStorage)   │
└─────────────────┘     └──────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│ Form state      │     │ Draft key:       │
│ snapshot        │     │ route-draft-{userId}│
└─────────────────┘     └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ On page load:    │
                        │ read store →     │
                        │ pre-fill form    │
                        │ if no server     │
                        │ data loaded      │
                        └──────────────────┘
```

## Data Flow

```
User selects GPX file
        │
        ▼
┌───────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ File Input    │────▶│ fast-xml-parser  │────▶│ Waypoint array  │
│ (validation)  │     │ (browser parse)  │     │ (preview + edit)│
└───────────────┘     └──────────────────┘     └─────────────────┘
        │                                              │
        │                                              ▼
        │                                       ┌─────────────┐
        │                                       │ User edits  │
        │                                       │ waypoints   │
        │                                       └─────────────┘
        │                                              │
        ▼                                              ▼
┌───────────────┐                              ┌─────────────┐
│ Supabase      │                              │ Supabase    │
│ Storage       │                              │ routes      │
│ (route-gpx)   │                              │ +           │
│ bucket        │                              │ route_waypoints│
└───────────────┘                              └─────────────┘
```

**KML upload and parsing flow** mirrors GPX:
```
User selects KML file
        │
        ▼
┌───────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ File Input    │────▶│ fast-xml-parser  │────▶│ Waypoint array  │
│ (validation)  │     │ (browser parse)  │     │ (preview + edit)│
└───────────────┘     └──────────────────┘     └─────────────────┘
        │                                              │
        │                                              ▼
        │                                       ┌─────────────┐
        │                                       │ User edits  │
        │                                       │ waypoints   │
        │                                       └─────────────┘
        │                                              │
        ▼                                              ▼
┌───────────────┐                              ┌─────────────┐
│ Supabase      │                              │ Supabase    │
│ Storage       │                              │ routes      │
│ (route-gpx)   │                              │ +           │
│ bucket        │                              │ route_waypoints│
└───────────────┘                              └─────────────┘
```

**Map visualization flow**:
```
Parsed waypoints + track points
        │
        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ RouteMap        │────▶│ Leaflet          │────▶│ Polyline +      │
│ Component       │     │ (browser render) │     │ Marker layers   │
│ (lat/lng array) │     │                  │     │ (OSM tiles)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

**File download flow**:
```
User clicks "Download GPX/KML"
        │
        ▼
┌─────────────────┐     ┌──────────────────┐
│ Route detail    │────▶│ Supabase Storage │
│ page            │     │ public URL       │
│ (gpx_file_path) │     │ (route-gpx)      │
└─────────────────┘     └──────────────────┘
        │
        ▼
┌─────────────────┐
│ <a download>    │
│ (browser fetch) │
└─────────────────┘
```

**Trip creation flow** reuses the above route data and adds:
```
Trip form submit
        │
        ▼
┌───────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ trips INSERT  │────▶│ trip_equipment_  │────▶│ trip_participants│
│ (with route_id)│     │ requirements INSERT│    │ (organizer auto-│
└───────────────┘     └──────────────────┘     │ confirms later) │
                                               └─────────────────┘
```

## Map Component

A reusable `RouteMap` component wraps Leaflet to display route geometry:
- **Props**: `waypoints: ParsedWaypoint[]`, `trackPoints?: [lat, lng][]`, `height?: string`, `editable?: boolean`
- **Layers**: OSM base tiles; polyline for track; circle markers for waypoints colored by `type` (start=green, summit=red, end=blue, waypoint=gray).
- **Interaction**: Pan and zoom enabled; click on waypoint shows popup with `name` + `elevation`; if `editable=true`, dragging a marker updates lat/lng in the parent form.
- **Performance**: For >500 track points, polyline is simplified via point reduction (skip every Nth point) before render.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/gpx.ts` | Create | `parseGpx(xml: string): Waypoint[]` using `fast-xml-parser`; extracts `trkpt`/`rtept`/`wpt` with `lat`, `lon`, `ele`, `name`. |
| `src/lib/kml.ts` | Create | `parseKml(xml: string): Waypoint[]` using `fast-xml-parser`; extracts `Placemark`/`Point`/`LineString`/`coordinates` into waypoint and track arrays. |
| `src/lib/storage.ts` | Create | `uploadRouteGpx(file: File, routeId: string)` and `getGpxPublicUrl(path: string)` wrappers around Supabase Storage. |
| `src/components/RouteMap.tsx` | Create | Leaflet map component rendering OSM tiles, track polyline, and waypoint markers. Accepts `waypoints`, optional `trackPoints`, and `editable` prop. |
| `src/components/RouteMap.css` | Create | Minimal Leaflet overrides for marker colors and popup styling. |
| `src/routes/_app.routes.new.tsx` | Modify | Add GPX/KML upload input with extension validation, `story`/`cover_image`/`difficulty` fields, waypoint table with drag-order, `RouteMap` preview, and wire `gpx_file_path` + `gpx_parsed` insert. |
| `src/routes/_app.routes.$routeId.edit.tsx` | Modify | Same enhancements as new route; load existing waypoints; allow re-upload (replace); show `RouteMap` with stored waypoints. |
| `src/routes/_app.routes.$routeId.tsx` | Modify | Add `RouteMap` to route detail page; add "Download GPX/KML" button if `gpx_file_path` exists. |
| `src/routes/_app.trips.new.tsx` | Modify | Add `meeting_lat`/`meeting_lng` inputs, `story`/`cover_image` fields, participant confirm/reject/cancel UI (organizer-only), equipment checklist persistence. |
| `src/routes/_app.trips.$tripId.edit.tsx` | Modify | Add missing fields; participant status management; equipment requirements CRUD. |
| `src/utils/beforeLoad.ts` | Modify | Add `approval_status === 'approved'` check alongside role check for organizer/expedition_lead routes. |
| `supabase/migrations/20260515_route_trip_rls.sql` | Create | Replace permissive RLS policies on `routes`, `route_waypoints`, `route_skill_requirements`, `trips`, `trip_participants`, `trip_equipment_requirements` with role + approval_status checks. Create `route-gpx` Storage bucket with policies. |

## Interfaces / Contracts

```typescript
// src/lib/gpx.ts
export interface ParsedWaypoint {
  lat: number;
  lng: number;
  elevation?: number;
  name?: string;
  type: 'start' | 'waypoint' | 'summit' | 'end';
}

export function parseGpx(xml: string): ParsedWaypoint[];

// src/lib/kml.ts
export interface ParsedTrack {
  points: [lat: number, lng: number, ele?: number][];
}

export function parseKml(xml: string): { waypoints: ParsedWaypoint[]; track?: ParsedTrack };

// src/lib/storage.ts
export async function uploadRouteGpx(
  file: File,
  routeId: string
): Promise<{ path: string; error: Error | null }>;

export function getGpxPublicUrl(path: string): string;
```

## Database Schema Changes

### New Column
- `routes.status` enum (`draft`, `pending_approval`, `published`) default `'draft'`
- `routes.created_by` UUID (FK to `profiles.id`) — required for draft ownership and visibility

No other new tables required. Existing schema already has:
- `routes.gpx_file_path`, `routes.gpx_parsed`
- `route_waypoints` with all needed columns
- `trips.meeting_lat`, `trips.meeting_lng`, `trips.cover_image`, `trips.story`
- `trip_participants.status` enum
- `trip_equipment_requirements` and `participant_equipment`

**Migration needed**: Add `status` + `created_by` columns; update RLS policies; create Storage bucket.

Key policy changes:
- `routes` INSERT: require `auth.uid()` profile has `role IN ('organizer', 'expedition_lead') AND approval_status = 'approved'`; set `created_by = auth.uid()`
- `routes` SELECT:
  - `status = 'published'`: any authenticated user
  - `status = 'draft'`: `created_by = auth.uid()`
  - `status = 'pending_approval'`: `created_by = auth.uid()` OR requesting user has `role = 'organizer'`
- `routes` UPDATE:
  - Creator can update their own `draft` or `pending_approval` route
  - Organizer can update any route (to enforce status transitions)
  - Status transitions are additionally validated in application logic
- `trips` INSERT/UPDATE: same role/approval check; UPDATE also allows `organizer_id = auth.uid()`
- `trip_participants` UPDATE: organizer can change status; user can insert own (register)
- `route_waypoints` / `route_skill_requirements`: route owner or organizer with approved status
- Storage bucket `route-gpx`: authenticated read; organizer/expedition_lead write

## UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DraftBadge` | `src/components/DraftBadge.tsx` | Displays `draft`, `pending_approval`, or `published` pill badge on route cards and detail page. Color-coded: gray (draft), yellow (pending), green (published). |
| `ApprovalPanel` | `src/components/ApprovalPanel.tsx` | Organizer-only panel on route detail for `pending_approval` routes. Shows "Publicar" (approve) and "Rechazar cambios" (reject) buttons with confirmation dialogs. |
| `DraftActions` | `src/components/DraftActions.tsx` | Action bar on route create/edit forms. Renders context-aware buttons: "Guardar borrador", "Enviar para aprobación", "Publicar", "Descartar borrador". Visibility depends on user role and current status. |
| `RouteStatusGuard` | `src/components/RouteStatusGuard.tsx` | Wrapper component that conditionally renders children based on route status and user role (e.g., hide edit button for non-creators on drafts). |
| `useRouteDraft` | `src/hooks/useRouteDraft.ts` | TanStack Store hook managing localStorage draft: `saveDraft(formData)`, `loadDraft()`, `clearDraft()`, `hasDraft()`. Keyed by user ID. |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `parseGpx` with sample GPX files (valid, invalid, large, empty) | Vitest + jsdom; fixtures in `src/lib/__tests__/gpx.test.ts` |
| Unit | `beforeLoad` guards | Mock `getUserWithProfile` return values |
| Unit | Status transition utility (`canTransition(status, userRole, action)`) | Vitest; cover all valid and invalid transitions |
| Unit | `useRouteDraft` hook | Mock `localStorage`; test save, load, clear, size limit |
| Integration | Route create with GPX upload | Mock Supabase Storage + DB client; test form submission flow |
| Integration | Trip create with equipment | Test multi-step wizard state transitions |
| Integration | Draft auto-save and restore | Simulate form changes, trigger debounce, reload page, assert restoration |
| E2E | Organizer creates route, uploads GPX, sees waypoints | Playwright or manual QA (no existing E2E framework) |
| E2E | Expedition lead sends for approval, organizer approves | Manual QA flow through UI |

## Migration / Rollout

1. Deploy migration `20260515_route_trip_rls.sql` to staging first.
2. Run existing test suite to ensure no RLS regressions on read paths.
3. Create `route-gpx` bucket manually or via CLI if migration doesn't cover it.
4. Deploy Phase 1 (route changes) to production.
5. Verify organizer users with `approved` status can create routes; pending users are blocked.
6. Deploy Phase 2 (trip changes) after Phase 1 is stable.
7. Rollback: revert migration (keep old policies in comments); revert PR via git.

## Open Questions

- [ ] Should we support TCX files in addition to GPX? (Proposal says ".tcx (próximamente)")
- [ ] Do we need a server-side GPX parse fallback for very large files (>10MB) or malformed XML that crashes the browser?
- [ ] Should `route-gpx` bucket files be auto-deleted when a route is updated with a new file? (Storage cleanup policy)
