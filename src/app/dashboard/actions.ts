"use server";

import { isValid, parse, set } from "date-fns";
import { revalidatePath } from "next/cache";

import { createWorkout, deleteWorkout, updateWorkout } from "@/data/workouts";

export type AddWorkoutInput = {
  date: string; // yyyy-MM-dd
  name: string;
  notes: string;
  exercises: {
    exerciseId: string;
    sets: { reps: string; weight: string }[];
  }[];
};

export type AddWorkoutResult = { ok: true } | { ok: false; error: string };

// Parses an optional non-negative number; "" -> null, garbage -> undefined.
function optionalNumber(value: string, integer: boolean) {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0 || (integer && !Number.isInteger(n))) {
    return undefined;
  }
  return n;
}

// Validates form rows into the shape the /data helpers expect.
function parseExercises(
  input: AddWorkoutInput["exercises"],
): { error: string } | { exercises: Parameters<typeof createWorkout>[0]["exercises"] } {
  const exercises: Parameters<typeof createWorkout>[0]["exercises"] = [];
  for (const e of input) {
    // Number("") is 0, so an unselected row must be rejected explicitly.
    const exerciseId = e.exerciseId.trim() === "" ? NaN : Number(e.exerciseId);
    if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
      return { error: "Choose an exercise for every row." };
    }
    const sets: (typeof exercises)[number]["sets"] = [];
    for (const s of e.sets) {
      const reps = optionalNumber(s.reps, true);
      const weight = optionalNumber(s.weight, false);
      if (reps === undefined || weight === undefined || (weight !== null && weight >= 10000)) {
        return { error: "Reps and weight must be valid positive numbers." };
      }
      sets.push({ reps, weight });
    }
    exercises.push({ exerciseId, sets });
  }

  return { exercises };
}

// The user id is never read from the input; the /data helper takes it from the session.
export async function addWorkout(input: AddWorkoutInput): Promise<AddWorkoutResult> {
  const day = parse(input.date, "yyyy-MM-dd", new Date());
  if (!isValid(day)) return { ok: false, error: "Invalid date." };

  const parsed = parseExercises(input.exercises);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const { exercises } = parsed;

  const now = new Date();
  await createWorkout({
    name: input.name.trim() || null,
    notes: input.notes.trim() || null,
    performedAt: set(day, { hours: now.getHours(), minutes: now.getMinutes() }),
    exercises,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export type UpdateWorkoutInput = Omit<AddWorkoutInput, "date">;

export async function editWorkout(
  workoutId: number,
  input: UpdateWorkoutInput,
): Promise<AddWorkoutResult> {
  const parsed = parseExercises(input.exercises);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const found = await updateWorkout(workoutId, {
    name: input.name.trim() || null,
    notes: input.notes.trim() || null,
    exercises: parsed.exercises,
  });
  if (!found) return { ok: false, error: "Workout not found." };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeWorkout(workoutId: number): Promise<AddWorkoutResult> {
  const found = await deleteWorkout(workoutId);
  if (!found) return { ok: false, error: "Workout not found." };

  revalidatePath("/dashboard");
  return { ok: true };
}
