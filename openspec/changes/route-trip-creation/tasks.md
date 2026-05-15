# Tasks: Route and Trip Creation

## Phase 1: Route Creation Foundation

- [x] 1.1 Add `fast-xml-parser`, `leaflet`, `@types/leaflet`, `react-leaflet` dependencies. — **S**
- [x] 1.2 Create `src/lib/gpx.ts` with `ParsedWaypoint` interface and `parseGpx(xml)` using `fast-xml-parser`; create `src/lib/kml.ts` with `parseKml(xml)` and `ParsedTrack` interface extracting `Placemark`/`Point`/`LineString`/`coordinates`. — **M**
- [x] 1.3 Create `src/lib/storage.ts` with `uploadRouteGpx(file, routeId)` and `getGpxPublicUrl(path)` wrapping Supabase Storage. — **M**
- [x] 1.4 Modify beforeLoad guards in `_app.routes.new.tsx` and `_app.routes.$routeId.edit.tsx` to enforce `approval_status === 'approved'` alongside role checks. — **S**
- [x] 1.5 Modify `src/routes/_app.routes.new.tsx`: add GPX/KML upload input with drag & drop, `story`/`cover_image`/`difficulty` fields, editable waypoint table, and wire `gpx_file_path`. — **L**
- [x] 1.6 Modify `src/routes/_app.routes.$routeId.edit.tsx`: load existing waypoints, allow GPX/KML re-upload (replace), and sync form fields. — **M**
- [x] 1.7 Create `src/components/RouteMap.tsx`: integrate Leaflet + OSM, render track polyline and waypoint markers, support `editable` prop. — **M**
- [x] 1.8 Modify `src/routes/_app.routes.new.tsx` and `_app.routes.$routeId.edit.tsx`: embed `RouteMap` preview below waypoint table; pass parsed waypoints and track points. — **M**
- [x] 1.9 Modify `src/routes/_app.routes.$routeId.tsx`: add `RouteMap` to route detail; add "Download GPX/KML" button. — **M**
- [x] 1.10 Create `supabase/migrations/20260515_route_trip_rls.sql`: route + route_waypoints + route_skill_requirements RLS policies, `route-gpx` Storage bucket and policies. — **M**

## Phase 2: Trip Creation Polish

- [x] 2.1 Modify `src/routes/_app.trips.new.tsx`: add `meeting_lat`/`meeting_lng`, `story`, `cover_image` fields; pre-fill `route_id` and default cover image. — **M**
- [x] 2.2 Add participant confirm/reject/cancel UI to `src/routes/_app.trips.$tripId.tsx` (organizer-only buttons with status badges). — **M**
- [x] 2.3 Add equipment checklist CRUD to `src/routes/_app.trips.$tripId.tsx` and persist to `trip_equipment_requirements` / `participant_equipment`. — **M**
- [x] 2.4 Modify `src/routes/_app.trips.$tripId.edit.tsx`: participant status management, equipment requirements CRUD, and missing fields. — **M**
- [x] 2.5 Extend migration `20260515_route_trip_rls.sql`: trip + trip_participants + trip_equipment_requirements RLS policies. — **M**

## Phase 3: Route Approval Workflow + Draft Mode

- [x] 3.1 Add `status` enum column (`draft`, `pending_approval`, `published`) and `created_by` UUID column to `routes` table; backfill existing routes to `published`. — **S**
- [x] 3.2 Update RLS policies on `routes` for status-based SELECT visibility and role-based UPDATE transitions. — **M**
- [x] 3.3 Create `src/hooks/useRouteDraft.ts`: TanStack Store hook with `saveDraft`, `loadDraft`, `clearDraft`, `hasDraft`; debounce at 3 seconds; cap at 5 MB. — **M**
- [x] 3.4 Create `src/components/DraftBadge.tsx`: status pill badge with color coding for route cards and detail. — **S**
- [x] 3.5 Create `src/components/ApprovalPanel.tsx`: organizer-only panel for `pending_approval` routes with "Publicar" and "Rechazar cambios" actions. — **M**
- [x] 3.6 Create `src/components/DraftActions.tsx`: context-aware action bar for route forms showing "Guardar borrador", "Enviar para aprobación", "Publicar", "Descartar borrador" based on role and status. — **M**
- [x] 3.7 Modify `src/routes/_app.routes.new.tsx` and `_app.routes.$routeId.edit.tsx`: integrate `useRouteDraft` auto-save on form change; restore draft on mount if no server data loaded; wire status on submit. — **L**
- [x] 3.8 Modify `src/routes/_app.routes.$routeId.tsx`: display `DraftBadge`; conditionally render `ApprovalPanel` for organizers when `status = 'pending_approval'`; hide edit button for non-creators on drafts. — **M**
- [x] 3.9 Modify `src/routes/_app.routes.index.tsx` (or route list): filter routes by visibility rules — draft (own only), pending (own + organizer), published (all). — **M**
- [x] 3.10 Create `src/lib/routeStatus.ts`: centralize transition logic `canTransition(currentStatus, userRole, action)` and status metadata. — **S**
- [x] 3.11 Update `beforeLoad` guards: enforce `created_by = auth.uid()` for draft edits; allow organizers to edit any route. — **S**

## Phase 4: Testing & Verification

- [x] 4.1 Write `src/lib/__tests__/gpx.test.ts`: unit test `parseGpx` with valid, invalid, empty, and large GPX fixtures. — **M**
- [x] 4.2 Write `src/lib/__tests__/kml.test.ts`: unit test `parseKml` with valid KML (Placemark + LineString), invalid KML, empty KML, and KML with no coordinates fixtures. — **M**
- [x] 4.3 Write unit tests for `beforeLoad` guards: approved/pending/unapproved roles, redirect behavior. — **S**
- [x] 4.4 Write unit tests for `canTransition` utility: cover all valid and invalid status transitions per role. — **S**
- [x] 4.5 Write unit tests for `useRouteDraft` hook: save, load, clear, size limit, debounce behavior. — **S**
- [x] 4.6 Run `pnpm test` and fix failures; verify no regressions on existing tests. — **S**
- [x] 4.7 Run `pnpm build` and fix build errors across modified routes and libraries. — **S**

## Phase 5: Cleanup & Rollout

- [ ] 5.1 Add rollback comments to migration and document `route-gpx` bucket setup in migration notes. — **S**
- [ ] 5.2 Update `AGENTS.md` if route/trip creation patterns or file structures changed. — **S**
- [ ] 5.3 Run data migration on staging: verify existing routes get `status = 'published'` and `created_by` populated from current context. — **S**

## Dependencies

- **1.2** depends on **1.1** (parser package installed)
- **1.3** depends on **1.2** (parser available for preview)
- **1.5** depends on **1.3** and **1.4** (upload + guards ready)
- **1.6** depends on **1.5** (new route form pattern established)
- **1.7** depends on **1.2** (parser interfaces needed)
- **1.8** depends on **1.5** and **1.7** (form ready + map component ready)
- **1.9** depends on **1.7** and **1.3** (map component + storage URL utility)
- **2.1** depends on **1.10** (trips RLS requires route foundation stable)
- **2.2** and **2.3** depend on **2.1** (trip form base ready)
- **2.4** depends on **2.2** and **2.3** (participant + equipment patterns established)
- **3.1** depends on **1.10** (schema change requires stable route RLS baseline)
- **3.2** depends on **3.1** (new columns exist)
- **3.3** depends on none (pure client hook)
- **3.4** depends on none (presentational component)
- **3.5** depends on **3.2** (RLS must allow organizer updates)
- **3.6** depends on **3.3** and **3.10** (draft hook + transition logic)
- **3.7** depends on **3.3**, **3.6**, and **1.5** (draft hook + action bar + form base)
- **3.8** depends on **3.4**, **3.5**, and **1.9** (badge + panel + detail page)
- **3.9** depends on **3.2** and **3.8** (RLS filtering + list rendering)
- **3.10** depends on none (pure utility)
- **3.11** depends on **3.2** and **3.10** (RLS + transition rules)
- **4.1** depends on **1.2**
- **4.2** depends on **1.2**
- **4.3** depends on **1.4**
- **4.4** depends on **3.10**
- **4.5** depends on **3.3**
- **4.6** depends on all implementation tasks
- **4.7** depends on all implementation tasks
- **5.1** depends on **1.10** and **2.5**
- **5.2** depends on all implementation tasks
- **5.3** depends on **3.1** and **3.2**
