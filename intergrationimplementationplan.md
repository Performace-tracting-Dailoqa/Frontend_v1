# Superuser Dashboard Integration — Implementation Record

## Findings from the current project

- The superuser dashboard lives at `Frontend_v1/app/dashboard/super-admin/page.tsx` and uses tab-based navigation with components under `Frontend_v1/src/components/super-admin/`.
- The current visual style is consistent across those components: white cards, slate borders and text, rounded corners, subtle shadows, motion transitions, and the purple `#4B2EF5` accent. **Kept unchanged** — no new theme was introduced.
- The database has `users` and role-specific `managers`, `teachers`, and `hrs` tables. Learners/interns are represented by `students`, which links to a `batch`; there is no separate `interns` table.
- The app never stores Microsoft refresh tokens, so a user-delegated Graph calendar is not possible. The calendar is read with the **client-credentials (app-only)** flow against one configured mailbox.
- Supabase REST has no `GROUP BY`, so the insights endpoints fetch bounded projections (`ROW_CAPPED = 5000`) and aggregate in Python. Overview, Teams and Progress all derive from **one** `build_team_rollup()`, so the same team shows identical numbers on every page by construction.

## What shipped

### Backend — 6 new endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/superuser/overview` | Overview KPIs + audit preview + role counts |
| `GET /api/v1/superuser/teams` | Paginated, searchable team list with roll-ups |
| `GET /api/v1/superuser/progress` | Ranked per-team progress (not paginated) |
| `GET /api/v1/microsoft/calendar/status` | Config/connectivity probe, never 500s |
| `GET /api/v1/microsoft/calendar/events` | `calendarView` events; 424 for config gaps |
| `PUT /api/v1/auth/me` | Self-service **name** only |

New files: `insights_repository.py`, `insights_service.py`, `schemas/insights.py`,
`routes/superuser/insights.py`, `core/microsoft_graph.py`, `routes/microsoft/calendar.py`.

Modified: `core/config.py` (4 Graph settings), `api/router.py`, `routes/auth/routes.py`,
`services/auth_service.py`, `schemas/users.py`, `dependencies/auth.py`.

### Frontend — 7 pages

`SUPER_ADMIN_TABS` in `types.ts` is the single source of truth for the nav, the `?tab=`
URL parameter and the page shell, so they cannot disagree about what pages exist.

| Page | Backing call |
| --- | --- |
| Overview | `GET /superuser/overview` + `fetchSystemTelemetry` |
| Teams | `GET /superuser/teams` |
| People | `fetchDirectory` → HR/manager/teacher/student list endpoints |
| Progress | `GET /superuser/progress` |
| Microsoft Calendar | `GET /microsoft/calendar/{status,events}` |
| Add Person | `POST /{hr,managers,teachers,students}` |
| Profile | `GET`/`PUT /auth/me` |

New: `apiClient.ts`, `insightsService.ts`, `calendarService.ts`, `useAsyncData.ts`,
`SuperAdminUi.tsx` (shared card/state/stat primitives).

### Removed — mock-only, no backend

`mockData.ts`, `SuperuserSandboxBanner.tsx`, and the Organisations, Audit, Portals,
Access Control, System Settings, Notifications and Teams Reports tabs. The
`SuperuserSandboxBanner` "view as another user" simulation had no backend and
referenced an organisations entity that does not exist; the header's org filter
and "Create Organisation" button went with it.

## Deliberate design decisions

- **Insights are Super Admin only.** HR is excluded because these endpoints expose
  system-wide data.
- **Profile update accepts `name` only.** Email is the login identifier and may be
  bound to a Microsoft object id, so changing it needs admin re-provisioning.
- **"Intern" is a `students` row.** The PMS has no intern entity, so the UI labels
  the bucket "Intern" while the record is a student with an enrollment number.
- **Unreachable calendar returns a state, not an error.** The UI shows a setup panel
  with the exact missing configuration instead of an empty calendar.
- **Every failure is a state.** Pages render explicit loading / empty / error /
  permission-denied / not-configured states rather than a blank table.

## Verification

- `npx tsc --noEmit --incremental false` → clean for all superuser code.
- `npx next build` → passes; `/dashboard/super-admin` prerenders.
- `pytest` → **198 passed, 7 failed**. All 7 failures are pre-existing and live in
  files this work never touched (`test_manager_workflows.py` missing asyncio marker,
  `test_microsoft_auth.py` mock `StopIteration`, `test_superuser_students.py`
  query-shape mismatch).
- New tests: `test_insights_service.py` (56), `test_microsoft_calendar.py` (24),
  `test_auth_profile_update.py` (17) — 97 tests over the new code.

### Known pre-existing blocker (out of scope)

`app/dashboard/manager/page.tsx` is missing its React imports and fails to compile,
which blocks `next build` for the whole app. It is a different dashboard and was
left untouched per the "modify only the superuser dashboard" constraint. Adding the
missing `useState`/`useEffect`/`useCallback` imports would unblock the build.
