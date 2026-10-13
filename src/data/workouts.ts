import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { workouts } from "@/db/schema";

/** All of a user's workouts performed in the half-open range [start, end). */
export async function getWorkoutsForDay(userId: string, start: Date, end: Date) {
  return db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      gte(workouts.performedAt, start),
      lt(workouts.performedAt, end),
    ),
    orderBy: asc(workouts.performedAt),
    with: {
      workoutExercises: {
        orderBy: (we, { asc }) => asc(we.position),
        with: {
          exercise: true,
          sets: { orderBy: (s, { asc }) => asc(s.setNumber) },
        },
      },
    },
  });
}

export type WorkoutWithDetails = Awaited<
  ReturnType<typeof getWorkoutsForDay>
>[number];
