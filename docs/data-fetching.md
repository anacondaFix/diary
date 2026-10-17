# Data Fetching Standards

These standards apply to all data fetching and database access throughout this project.

## 1. Server components ONLY

**ALL data fetching in this app MUST be done via server components. This is incredibly important.**

Data must **NOT** be fetched via:

- Route handlers (`route.ts` / `app/api/**`)
- Client components (`"use client"`), including `useEffect`, SWR, React Query, or `fetch` calls in the browser
- Server Actions used to read data
- Any other mechanism

The **only** permitted way to read data is: a server component calls a helper function from `/data`, and passes the result down (as props) to child components.

```tsx
// src/app/dashboard/page.tsx — a server component (no "use client")
import { getWorkoutsForDate } from "@/data/workouts";

export default async function DashboardPage() {
  const workouts = await getWorkoutsForDate(new Date());
  // render with shadcn/ui components, passing `workouts` as props
}
```

If a client component needs data, fetch it in a parent server component and pass it in as props. Do not fetch it from the client.

## 2. Database queries: helper functions in `/data` only

- All database queries MUST live in helper functions inside the `src/data/` directory (e.g. `src/data/workouts.ts`).
- Server components call these helpers. Components, pages, and layouts must never query the database directly.
- Each helper file should be organised by domain (e.g. `workouts.ts`, `entries.ts`).

## 3. Drizzle ORM only — NO raw SQL

- Helper functions MUST use [Drizzle ORM](https://orm.drizzle.team/) to query the database, using the `db` instance from `src/db`.
- **DO NOT USE RAW SQL.** No `sql` template strings for whole queries, no `db.execute(...)` with hand-written SQL, no string-built queries.
- Use Drizzle's query builder (`db.select().from(...).where(...)`) or relational query API (`db.query...`) with operators such as `eq` and `and`.

## 4. User data isolation (CRITICAL)

**A logged-in user can ONLY access their own data. They MUST NOT be able to access any other user's data.**

- Every helper in `/data` that reads or writes user-owned data MUST scope the query to the current user's ID.
- The user ID MUST come from the authenticated session on the server (Clerk's `auth()` from `@clerk/nextjs/server`). **Never** accept a user ID from the client, URL params, search params, or form input as the source of truth for who the user is.
- If there is no authenticated user, the helper must not return data and must **redirect** the visitor to `/login-required` using `redirect()` from `next/navigation`. **Do NOT throw an `Error("Unauthorized")`**: that surfaces as an error screen instead of a friendly page. Never fall back to an unscoped query.
- The `/login-required` page (see `docs/ui.md`) shows the message "Please Login first to access Data!".
- `redirect()` works by throwing internally, so never wrap a call to a `/data` helper in a `try/catch` that swallows it.
- Every query on user-owned tables MUST include a `where` condition on the owner column, including queries that look up a single record by its ID. Looking up by record ID alone is not enough, because it would let a user read another user's record by guessing an ID.
- Updates and deletes must apply the same ownership condition.

```ts
// src/data/workouts.ts
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workouts } from "@/db/schema";

export async function getWorkoutById(workoutId: number) {
  const { userId } = await auth();
  if (!userId) redirect("/login-required");

  return db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}
```

## Checklist

Before finishing any data-related change, confirm:

- [ ] Data is fetched in a server component, not a route handler or client component
- [ ] The query lives in a helper function under `src/data/`
- [ ] The helper uses Drizzle ORM, with no raw SQL
- [ ] The helper gets the user ID from the server-side session and filters by it
- [ ] When there is no signed-in user, the helper redirects to `/login-required` instead of throwing
