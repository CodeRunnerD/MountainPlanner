# Proposal: Route and Trip Creation

## Intent

Make route creation and trip scheduling fully functional for expedition leads and organizers. The UI shell exists, but critical backend and form gaps prevent actual use. We need secure role-based access, GPX-based route import with waypoints, and working trip creation workflows.

## Scope

### In Scope
- Phase 1: Route Creation Foundation
  - GPX file upload to Supabase Storage with parsing
  - Waypoint creation from GPX and manual entry
  - RLS policies enforcing organizer/expedition_lead roles
  - Complete route form fields (story, cover_image, skill requirements)
  - User approval_status validation in route guards
- Phase 2: Trip Creation Polish
  - Participant confirm/reject/cancel actions
  - Equipment checklist persistence
  - Complete trip form fields (meeting_lat/lng, story, cover_image)
  - Trip RLS policies with organizer role validation
- Phase 3: Route Approval Workflow + Draft Mode
  - Route `status` field: `draft`, `pending_approval`, `published`
  - Draft auto-save with TanStack Store local persistence
  - Role-based status transitions (organizer vs expedition_lead)
  - Organizer approval/rejection flow for expedition lead changes
  - Status-based visibility via RLS policies
  - UI indicators and action buttons for each status

### Out of Scope
- Route/trip deletion (soft delete not required yet)
- Public route sharing / marketplace features
- Real-time collaborative editing
- Mobile app support
- GPX editing after upload (re-upload only)
- Server-side draft persistence (TanStack Store local only)
- Email notifications for approval/rejection (in-app only)

## Approach

Phased delivery aligned with exploration recommendation.

Phase 1 secures the foundation: upload, parse, store routes with waypoints, and lock down permissions. Phase 2 builds on top to make trips schedulable with full participant management. Each phase is independently reviewable and testable.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/routes/_app.routes.new.tsx` | Modified | GPX upload, waypoint input, complete fields |
| `src/routes/_app.routes.$routeId.edit.tsx` | Modified | Same enhancements for edit mode |
| `src/routes/_app.trips.new.tsx` | Modified | Participant actions, equipment checklist, fields |
| `src/routes/_app.trips.$tripId.edit.tsx` | Modified | Same polish for edit mode |
| `supabase/migrations/` | Modified | New RLS policies for routes and trips |
| `src/lib/supabase.ts` / `src/lib/supabase.server.ts` | Modified | Storage bucket helpers, GPX parsing utilities |
| `src/utils/beforeLoad.ts` or equivalent | Modified | Add approval_status check alongside role checks |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| GPX parsing edge cases (invalid XML, large files) | Medium | Use robust XML parser, validate schema, limit file size, server-side fallback |
| RLS policy misconfiguration breaking existing reads | Medium | Test all read paths before deploying policies; use dry-run in staging |
| Supabase Storage bucket not configured | Low | Document required bucket and CORS in migration notes |
| Role checks in beforeLoad bypassed via direct API calls | Medium | RLS is the real enforcement; beforeLoad is UX-only |
| TanStack Store localStorage quota exceeded | Low | Limit draft size to 5 MB; warn user if quota is near; allow explicit discard |
| Status transition logic complexity causing inconsistent state | Medium | Centralize transition logic in a utility; unit-test all state machines; enforce via RLS |
| Draft auto-save conflicting with explicit save | Low | Debounce auto-save (3–5s); clear store on successful explicit save; version draft with timestamp |

## Rollback Plan

1. Database: Revert to previous migration via `supabase db reset` or targeted rollback script.
2. RLS: Keep old policies in comments during migration; restore if new policies cause failures.
3. Code: Each phase is a separate PR; revert merged PR via Git revert.
4. Storage: GPX files are versioned by upload timestamp; old parsing logic remains in git history.

## Dependencies

- Supabase Storage bucket `route-gpx` must exist (create via migration or dashboard).
- `xml2js` or `fast-xml-parser` package for GPX parsing (browser + server).

## Success Criteria

- [ ] Expedition leads and organizers can create routes with uploaded GPX files and see waypoints auto-populated.
- [ ] Non-organizer authenticated users cannot create or edit routes (blocked by RLS, not just UI).
- [ ] Trips can be created from routes with full participant management (confirm/reject/cancel).
- [ ] All existing tests pass after each phase (`pnpm test`).
- [ ] Build completes without errors (`pnpm build`).
- [ ] Expedition lead routes enter `pending_approval` and can be approved/rejected by organizers.
- [ ] Draft routes are auto-saved to TanStack Store and restored on return.
- [ ] Status-based visibility is enforced: draft (creator only), pending (creator + organizers), published (all).
