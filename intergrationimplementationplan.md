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
| `GET /api/v1/batches` | Every batch, for the Add Person batch picker |
| `POST /api/v1/batches` | Create a batch from the picker's inline "New batch" |

New files: `insights_repository.py`, `insights_service.py`, `schemas/insights.py`,
`routes/superuser/insights.py`, `core/microsoft_graph.py`, `routes/microsoft/calendar.py`,
`routes/superuser/batchap.py`, `migrations/versions/0003_profile_batch_id.py`.

Modified: `core/config.py` (4 Graph settings), `api/router.py`, `routes/auth/routes.py`,
`services/auth_service.py`, `schemas/users.py`, `dependencies/auth.py`.

### Frontend — 7 pages

`SUPER_ADMIN_TABS` in `types.ts` is the single source of truth for the nav, the `?tab=`
URL parameter and the page shell, so they cannot disagree about what pages exist.

| Page | Backing call |
| --- | --- |
| Overview | `GET /superuser/overview` + `fetchSystemTelemetry` |
| Teams | `GET /superuser/teams`; the per-batch roster is `GET /students?batch_id=…` |
| People | `fetchDirectory` → HR/manager/teacher/student list endpoints |
| Progress | `GET /superuser/progress` + `GET /superuser/progress/trend` |
| Microsoft Calendar | `GET /microsoft/calendar/{status,events}` |
| Add Person | `POST /{hr,managers,teachers,students}`, plus `GET`/`POST /batches` for the batch picker |
| Profile | `GET`/`PUT /auth/me` |

New: `apiClient.ts`, `insightsService.ts`, `calendarService.ts`, `batchService.ts`,
`useAsyncData.ts`, `utils/date.ts`, `SuperAdminUi.tsx` (shared card/state/stat
primitives), `TrendChart.tsx`.

### Team roster drill-down

Clicking a batch on the Teams page opens its interns as a page of their own, with
a back button. The headcount already on the roll-up could not answer "who is in
this batch", so the roster is a separate call: `batchService.fetchAllBatchLearners`
pages `GET /api/v1/students?batch_id=…` to the end rather than taking the first
100, then the page filters and paginates on the client so the search box does not
refetch per keystroke.

Two backend facts this depends on, both bugs that were fixed to make it work:

- `batch_id`, `department` and `status` were accepted by the students listing and
  then **never applied** — the page was taken from `users`, which has none of those
  columns. Every batch therefore returned the same full roster. `list_student_profiles`
  now pages over the `students` profile table and joins `users` for identity, which
  also makes `total` and the page slice consistent.
- The `roles` table holds both `Student` and `student`, differing only in case, and
  seeded interns are split across the two. Resolving one role by exact name matched
  only some of them, so the listing now does not narrow by role at all: a learner
  is a learner because a profile row exists.

### Sidebar

`Sidebar.tsx` had 12 superuser links across 3 sections, 7 of which pointed at
tabs that no longer existed (`organisations`, `roles`, `audit`, `settings`,
`portals`, `reports`, `notifications`). It now derives its items from
`SUPER_ADMIN_TABS`, so the sidebar and the dashboard can never disagree about
which pages exist. Stale labels went with it — "Overview & Sandbox" → Overview
(the sandbox was mock-only), "Google Calendar" → Microsoft Calendar, "Global
People" → People, "Profile & Keys" → Profile.

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
- **Batch membership is not batch leadership.** `batches.teacher_id` /
  `batches.manager_id` record who *leads* a team — one per batch, and overwriting
  them would silently strip an existing lead. Managers and teachers therefore had
  no way to record which team they work with, so migration `0003` adds
  `teachers.batch_id` and `managers.batch_id`, mirroring `students.batch_id` from
  `0001`. The Add Person picker writes that column; it never touches the lead FKs.
  HR has no batch column, so the picker is hidden for that role.
- **Unreachable calendar returns a state, not an error.** The UI shows a setup panel
  with the exact missing configuration instead of an empty calendar.
- **Every failure is a state.** Pages render explicit loading / empty / error /
  permission-denied / not-configured states rather than a blank table.

## Verification

- `npx tsc --noEmit --incremental false` → clean across the whole app.
- `npx next build` → passes; `/dashboard/super-admin` and `/dashboard/manager`
  both prerender.
- `pytest` → **270 passed, 2 failed** (was 198/7 when this plan was first written).
  Both remaining failures are pre-existing and unrelated to any page here:
  `test_auth_password_change.py::test_successful_password_change_persists_must_change_password_false`
  and `test_manager_workflows.py::test_get_manager_team`.
  `test_superuser_students.py::test_list_students` used to be on that list as a
  "query-shape mismatch" — it was not a bad mock, it was a mock faithfully
  describing a *correct* implementation that had since been regressed. It now
  drives a fake that really applies filters and really pages, and passes.
- New tests: `test_insights_service.py` (56), `test_microsoft_calendar.py` (24),
  `test_auth_profile_update.py` (17) — 97 tests over the new code. Later additions:
  `test_insights_trend.py` (40), `test_superuser_batches.py` (13), and 15 listing
  tests in `test_superuser_students.py` covering the batch filter.

## Cross-dashboard coupling: HR reuses PeopleTab

`app/dashboard/hr/page.tsx` imports the superuser's `PeopleTab` and passed it the
old `users` / `isLoading` / `onRefreshUsers` / `onSimulate` props, plus
`fetchAdminUsers` and `UserDirectoryRecord` — all removed when the directory was
rewritten to be self-fetching. That broke the HR dashboard, so it was updated too:

- `onOpenAddPerson` is now optional; when absent the Add Person actions are hidden
  rather than linked to a superuser-only route.
- New optional `onDirectoryLoaded` callback lets the HR headcount card reuse
  PeopleTab's single fetch instead of issuing a duplicate request. The card shows
  `—` until loaded rather than a misleading `0`.
