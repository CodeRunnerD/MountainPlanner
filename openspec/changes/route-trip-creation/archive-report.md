# Archive Report: route-trip-creation

**Change**: route-trip-creation
**Archived**: 2026-05-15
**Artifact Store Mode**: openspec
**Status**: ARCHIVED

---

## Summary

This change delivered secure, role-governed creation flows for **routes** (with GPX/KML import, waypoints, and interactive maps) and **trips** (with participant management and equipment checklists). It also introduced a **route approval workflow** with draft mode and status transitions (`draft` → `pending_approval` → `published`), enforced by RLS policies and `beforeLoad` guards.

---

## Phases Delivered

### Phase 1: Route Creation Foundation
- GPX and KML file upload to Supabase Storage (`route-gpx` bucket)
- Client-side XML parsing with `fast-xml-parser` (`src/lib/gpx.ts`, `src/lib/kml.ts`)
- Auto-populated waypoint tables + manual waypoint entry
- Interactive Leaflet + OSM map component (`RouteMap.tsx`)
- GPX/KML download from route detail pages
- Role-based `beforeLoad` guards and RLS policies for routes

### Phase 2: Trip Creation Polish
- Trip creation from existing routes with pre-filled fields
- Participant confirm / reject / cancel actions
- Equipment checklist persistence per trip
- Trip RLS policies with organizer role validation

### Phase 3: Route Approval Workflow + Draft Mode
- `routes.status` enum: `draft`, `pending_approval`, `published`
- `routes.created_by` for ownership-based visibility
- Draft auto-save via TanStack Store + `localStorage`
- Role-based status transitions (organizer vs expedition_lead)
- Organizer approval/rejection inline on route detail
- Status-based RLS SELECT visibility

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| `fast-xml-parser` for GPX/KML | Browser + SSR compatible, no polyfills, single dependency |
| Client parse + Storage upload | Immediate waypoint preview, avoids serverless latency |
| Reuse `route_waypoints` table | Schema already supported all needed columns |
| RLS + `beforeLoad` dual enforcement | RLS is the security boundary; `beforeLoad` provides UX redirect |
| TanStack Store for draft persistence | Zero network dependency, instant recovery, no migration complexity |
| Leaflet + OpenStreetMap | Open source, lightweight, no API key |

---

## Files Created / Modified

### New files
- `src/lib/gpx.ts`
- `src/lib/kml.ts`
- `src/lib/storage.ts`
- `src/components/RouteMap.tsx`
- `src/components/RouteMap.css`
- `src/components/DraftBadge.tsx`
- `src/components/ApprovalPanel.tsx`
- `src/components/DraftActions.tsx`
- `src/hooks/useRouteDraft.ts`
- `src/lib/routeStatus.ts`
- `supabase/migrations/20260515_route_trip_rls.sql`
- `src/lib/__tests__/gpx.test.ts`
- `src/lib/__tests__/kml.test.ts`
- `src/lib/__tests__/route-guards.test.ts`
- `src/lib/__tests__/routeStatus.test.ts`

### Modified files
- `src/routes/_app.routes.new.tsx`
- `src/routes/_app.routes.$routeId.edit.tsx`
- `src/routes/_app.routes.$routeId.tsx`
- `src/routes/_app.routes.index.tsx`
- `src/routes/_app.trips.new.tsx`
- `src/routes/_app.trips.$tripId.tsx`
- `src/routes/_app.trips.$tripId.edit.tsx`
- `src/utils/beforeLoad.ts` (or equivalent guard wiring)

### Database migrations
- `20260515_route_trip_rls.sql` — RLS policies for routes, waypoints, skills, trips, participants, equipment; Storage bucket policies
- `20260516_route_status.sql` — `routes.status` enum + `created_by` column; status-based SELECT/UPDATE policies

---

## Verification

- **Tests**: 47/47 passed
- **Build**: Client + SSR production builds successful
- **Verdict**: PASS WITH WARNINGS

### Known issues at archive time
1. **Missing duplicate waypoint warning** (R8): Client-side duplicate waypoint name validation not implemented.
2. **File size limit deviation**: Design specified 5MB client limit; implementation uses 10MB.
3. **Low UI test coverage**: Only 7/25 spec scenarios have automated test coverage; UI flows rely on manual QA.
4. **Stale spec enum references**: `spec.md` still references `approval_status = 'approved'`. The database and implementation correctly use `'active'` (renamed in migration `20260513214016_rename_approved_to_active.sql`).

### Cleanup applied at archive time
- Aligned `'approved'` → `'active'` in `src/lib/route-guards.ts` and `src/lib/__tests__/route-guards.test.ts` to match the database enum.

---

## Rollback Plan

1. Database: Revert to previous migration via `supabase db reset` or targeted rollback script.
2. RLS: Old policies were kept in comments during migration; restore if needed.
3. Code: Each phase was a separate commit; revert via `git revert`.
4. Storage: GPX files are versioned by upload timestamp; old parsing logic remains in git history.

---

## Dependencies

- Supabase Storage bucket `route-gpx` (created via migration)
- `fast-xml-parser` npm package
- `leaflet`, `@types/leaflet`, `react-leaflet` npm packages
- Existing `profiles` table with `role` and `approval_status` columns

---

## Artifacts

- `openspec/changes/route-trip-creation/proposal.md`
- `openspec/changes/route-trip-creation/spec.md`
- `openspec/changes/route-trip-creation/design.md`
- `openspec/changes/route-trip-creation/tasks.md`
- `openspec/changes/route-trip-creation/verify-report.md`
- `openspec/changes/route-trip-creation/archive-report.md` (this file)

---

## State at Archive

All implementation tasks (Phases 1–4) are complete. Phase 5 cleanup tasks (rollback comments, AGENTS.md update, staging data migration) were not fully executed but are non-blocking for archive. The change is considered stable and ready for production.
