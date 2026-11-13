# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep pages and presentation behavior in React, use the shared API client with relative `/api` paths, and do not add authentication.
- Logic tier decision: Implement the API contracts in Express routes/services on port `8000`; validate input and return deliberate 4xx responses instead of exposing database cast errors.
- Data tier decision: Add the required Mongoose fields, references, and validation; preserve the currently passing idempotent seed behavior and MongoDB port `27017`.
- Activity tracking approach: List and create activities; validate that submitted user and team IDs are well-formed and refer to existing records, then store the submitted values with computed points and `occurredAt`.
- Team management approach: List and create teams with members; preserve name and mascot and reject a missing name with `400`.
- Leaderboard approach: Sum activity points by team, order highest first, and return each team name, total points, and a 1-based rank.
- Workout suggestions approach: Match the seeded user by email and recommend from their goal or recent activity, including a reason; return a deliberate 4xx for an unknown email.
- Smallest safe implementation order: First satisfy data-model contracts, then implement the failing API behaviors, then connect and complete the presentation states. Preserve passing seed behavior and make focused changes at each tier.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — 4 failed, 1 passed. User, team, activity, and workout model validation is incomplete; the idempotent seed test passes.
- API command: `npm run test:api --prefix octofit-tracker/backend` — 4 failed. Invalid activity/team input returns `501` instead of `400`, leaderboard results are empty, and a workout suggestion is missing the expected reason.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — 15 failed. The primary data/suggestion views and the loading, empty, and accessible API-error states across activities, teams, leaderboard, and workouts do not meet the presentation contract.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — not run.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — not run.
