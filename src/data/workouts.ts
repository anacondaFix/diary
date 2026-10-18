import { auth } from "@clerk/nextjs/server";
import { addDays, format, startOfDay } from "date-fns";
import { and, eq, gte, inArray, isNull, lt, or } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { exercises, sets, workoutExercises, workouts } from "@/db/schema";

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

// Distinct days ("yyyy-MM-dd") on which the current user logged a workout.
// Used to highlight days in the dashboard calendar.
export async function getWorkoutDates() {
  const { userId } = await auth();
  if (!userId) redirect("/login-required");

  const rows = await db
    .select({ performedAt: workouts.performedAt })
    .from(workouts)
    .where(eq(workouts.userId, userId));

  return [...new Set(rows.map((row) => format(row.performedAt, "yyyy-MM-dd")))];
}

// Exercises the current user can pick: built-ins (user_id null) plus their own.
export async function getAvailableExercises() {
  const { userId } = await auth();
  if (!userId) redirect("/login-required");

  return db
    .select({ id: exercises.id, name: exercises.name, muscleGroup: exercises.muscleGroup })
    .from(exercises)
    .where(or(isNull(exercises.userId), eq(exercises.userId, userId)))
    .orderBy(exercises.name);
}

export type NewWorkoutInput = {
  name: string | null;
  notes: string | null;
  performedAt: Date;
  exercises: {
    exerciseId: number;
    sets: { reps: number | null; weight: number | null }[];
  }[];
};

// Creates a workout with its exercises and sets for the current user.
// The neon-http driver has no transactions, so a failure part-way through
// deletes the workout (children cascade) rather than leaving a partial one.
export async function createWorkout(input: NewWorkoutInput) {
  const { userId } = await auth();
  if (!userId) redirect("/login-required");

  const exerciseIds = [...new Set(input.exercises.map((e) => e.exerciseId))];
  if (exerciseIds.length > 0) {
    const allowed = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(
        and(
          inArray(exercises.id, exerciseIds),
          or(isNull(exercises.userId), eq(exercises.userId, userId)),
        ),
      );
    if (allowed.length !== exerciseIds.length) {
      throw new Error("Unknown exercise");
    }
  }

  const [workout] = await db
    .insert(workouts)
    .values({
      userId,
      name: input.name,
      notes: input.notes,
      performedAt: input.performedAt,
    })
    .returning({ id: workouts.id });

  try {
    if (input.exercises.length > 0) {
      const rows = await db
        .insert(workoutExercises)
        .values(
          input.exercises.map((e, index) => ({
            workoutId: workout.id,
            exerciseId: e.exerciseId,
            position: index + 1,
          })),
        )
        .returning({ id: workoutExercises.id, position: workoutExercises.position });

      const setRows = rows.flatMap((row) =>
        input.exercises[row.position - 1].sets.map((set, i) => ({
          workoutExerciseId: row.id,
          setNumber: i + 1,
          reps: set.reps,
          weight: set.weight === null ? null : String(set.weight),
        })),
      );
      if (setRows.length > 0) await db.insert(sets).values(setRows);
    }
  } catch (error) {
    await db
      .delete(workouts)
      .where(and(eq(workouts.id, workout.id), eq(workouts.userId, userId)));
    throw error;
  }

  return workout.id;
}

// Confirms every exercise id is a built-in or belongs to the current user.
async function assertExercisesAllowed(userId: string, input: NewWorkoutInput["exercises"]) {
  const exerciseIds = [...new Set(input.map((e) => e.exerciseId))];
  if (exerciseIds.length === 0) return;
  const allowed = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(
      and(
        inArray(exercises.id, exerciseIds),
        or(isNull(exercises.userId), eq(exercises.userId, userId)),
      ),
    );
  if (allowed.length !== exerciseIds.length) throw new Error("Unknown exercise");
}

// Updates a workout the current user owns, replacing its exercises and sets.
// Returns false when no such workout exists for this user. The neon-http
// driver has no transactions, so everything is validated before the old
// children are deleted. `performedAt` is left unchanged.
export async function updateWorkout(
  workoutId: number,
  input: Omit<NewWorkoutInput, "performedAt">,
) {
  const { userId } = await auth();
  if (!userId) redirect("/login-required");

  await assertExercisesAllowed(userId, input.exercises);

  const updated = await db
    .update(workouts)
    .set({ name: input.name, notes: input.notes, updatedAt: new Date() })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning({ id: workouts.id });
  if (updated.length === 0) return false;

  await db.delete(workoutExercises).where(eq(workoutExercises.workoutId, workoutId));

  if (input.exercises.length > 0) {
    const rows = await db
      .insert(workoutExercises)
      .values(
        input.exercises.map((e, index) => ({
          workoutId,
          exerciseId: e.exerciseId,
          position: index + 1,
        })),
      )
      .returning({ id: workoutExercises.id, position: workoutExercises.position });

    const setRows = rows.flatMap((row) =>
      input.exercises[row.position - 1].sets.map((set, i) => ({
        workoutExerciseId: row.id,
        setNumber: i + 1,
        reps: set.reps,
        weight: set.weight === null ? null : String(set.weight),
      })),
    );
    if (setRows.length > 0) await db.insert(sets).values(setRows);
  }

  return true;
}

// Deletes a workout the current user owns (exercises and sets cascade).
export async function deleteWorkout(workoutId: number) {
  const { userId } = await auth();
  if (!userId) redirect("/login-required");

  const deleted = await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning({ id: workouts.id });
  return deleted.length > 0;
}
