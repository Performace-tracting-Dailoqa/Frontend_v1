# Superuser Dashboard Integration Implementation Plan

## Findings from the current project

- The superuser dashboard lives at `Frontend_v1/app/dashboard/super-admin/page.tsx` and uses tab-based navigation with components under `Frontend_v1/src/components/super-admin/`.
- The current visual style is consistent across those components: white cards, slate borders and text, rounded corners, subtle shadows, motion transitions, and the purple `#4B2EF5` accent. Keep these patterns and update only the superuser dashboard.
- The database has `users` and role-specific `managers`, `teachers`, and `hrs` tables. Learners/interns are represented by `students`, which links to a `batch`; there is no separate `interns` table.
- HR, manager, and teacher CRUD APIs exist. Existing frontend services already call these, along with student APIs.
- The current dashboard and several tabs still contain mock data. Also, the current people aggregation fills in placeholder organization/security/activity details that the listed CRUD APIs do not provide.
- The API reference documents a known issue: `GET /hr` may return null `name` and `email`, so HR directory records need a reliable identity source.
- Microsoft authentication endpoints exist, but no calendar integration endpoints were found. There are also no dedicated superuser teams or overall-progress endpoints in the inspected backend routes.

## Implementation plan

### 1. Define the superuser scope and navigation

- Update only the superuser dashboard navigation to expose the requested pages: **Overview, Teams, People, Progress, Microsoft Calendar, Add Person, and Profile**.
- Map the current “Teams & Gantt” tab to Teams, and revise outdated labels such as “Google Calendar.”
- Retain the existing tab layout, header, card styling, responsive behavior, motion, and purple accent.
- Remove or hide unrelated superuser tabs from this dashboard so they do not distract from the requested workflow.

### 2. Map the database to dashboard concepts

- Use `users` and role-specific profile tables for people.
- Treat `students` as the existing learner/intern account model; confirm the product’s preferred display label before presenting these accounts as “Interns.”
- Use `batches` and their manager/teacher assignments as the current basis for Teams, unless “team” is meant to represent a different concept.
- Build progress views only from available workflow tasks and evaluation data; distinguish real metrics from anything not currently returned by an API.

### 3. Implement the pages using current UI patterns

- **Overview:** Show live, backend-supported counts and summaries, with links into Teams, People, and Progress. Remove hard-coded KPIs and activity entries where no backend source exists.
- **Teams:** Present batches as teams with department, dates, status, manager, teacher, and learner count where APIs can supply them.
- **People:** Provide cross-role search and filters for HR, manager, teacher, and learner/intern, with profile details and status actions backed by the appropriate APIs.
- **Progress:** Display team-level workflow/evaluation progress, filters, and clear empty/loading/error states.
- **Microsoft Calendar:** Adapt the existing calendar UI and branding, but bind it to the signed-in superuser’s Microsoft calendar only after the backend exposes calendar-event integration.
- **Add Person:** Provide role-specific forms. HR, manager, teacher, and student creation should call their corresponding APIs and fields; do not imply that a separate intern record is being created.
- **Profile:** Show and edit the signed-in user’s actual profile only for fields supported by existing profile/auth APIs; avoid mock sessions, credentials, and keys.

### 4. Connect frontend data to backend APIs

- Consolidate superuser fetch/create/update/deactivate calls in the existing service layer rather than making API calls inside presentation components.
- Reuse existing HR, manager, teacher, and student CRUD endpoints. Preserve pagination and loading/error states.
- Reconcile profile IDs versus user IDs before wiring update/deactivation: the current frontend appears to pass profile IDs to APIs, while some actions conceptually target the linked `users` record.
- Fix HR identity enrichment for People using a backend response that includes linked user name, email, and active status, or another reliable identity lookup.
- Replace telemetry values and fallback mock counts with values actually returned by the backend; show unavailable states where there is no data.

### 5. Identify backend work needed for complete coverage

- Add or confirm APIs for batch/team listing and team-level membership/assignments.
- Add overall progress aggregation endpoints if existing workflow/evaluation endpoints cannot support the required dashboard efficiently.
- Add Microsoft Graph calendar event endpoints and ensure the superuser’s Microsoft identity and authorization scopes support reading that user’s calendar.
- Add profile read/update APIs if the existing `/auth/me` endpoint does not provide the fields needed by the Profile page.
- Confirm whether the HR list response limitation has already been corrected in the running backend.

### 6. Verify the implementation

- Check that the requested navigation and pages work at desktop and mobile widths and match existing superuser styling.
- Verify list, create, update, and deactivate flows against the backend, including empty results, loading, API failures, and pagination.
- Confirm calendar and progress states accurately reflect API availability rather than presenting mock data as live.
- Run the frontend checks and relevant backend API tests after implementation.

## Dependency note

The existing staff CRUD endpoints can support much of People and Add Person. Teams, overall Progress, and Microsoft Calendar require backend endpoint confirmation or additions before those pages can be fully live.
