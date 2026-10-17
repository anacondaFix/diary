import { auth } from "@clerk/nextjs/server";
import { addDays, startOfDay } from "date-fns";
import { and, eq, gte, lt } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { workouts } from "@/db/schema";

// Workouts (with exercises and sets) the current user performed on `date`.
// Always scoped to the authenticated user's id.
export async function getWorkoutsForDate(date: Date) {
  const { userId } = await auth();
  if (!userId) redirect("/login-required");

  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);

  return db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      gte(workouts.performedAt, dayStart),
      lt(workouts.performedAt, dayEnd),
    ),
    orderBy: (w, { asc }) => [asc(w.performedAt)],
    with: {
      workoutExercises: {
        orderBy: (we, { asc }) => [asc(we.position)],
        with: {
          exercise: true,
          sets: { orderBy: (s, { asc }) => [asc(s.setNumber)] },
        },
      },
    },
  });
}
