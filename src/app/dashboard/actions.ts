"use server";

import { isValid, parse, set } from "date-fns";
import { revalidatePath } from "next/cache";

import { createWorkout } from "@/data/workouts";

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

// The user id is never read from the input; the /data helper takes it from the session.
export async function addWorkout(input: AddWorkoutInput): Promise<AddWorkoutResult> {
  const day = parse(input.date, "yyyy-MM-dd", new Date());
  if (!isValid(day)) return { ok: false, error: "Invalid date." };

  const exercises: Parameters<typeof createWorkout>[0]["exercises"] = [];
  for (const e of input.exercises) {
    const exerciseId = Number(e.exerciseId);
    if (!Number.isInteger(exerciseId)) {
      return { ok: false, error: "Choose an exercise for every row." };
    }
    const sets: (typeof exercises)[number]["sets"] = [];
    for (const s of e.sets) {
      const reps = optionalNumber(s.reps, true);
      const weight = optionalNumber(s.weight, false);
      if (reps === undefined || weight === undefined || (weight !== null && weight >= 10000)) {
        return { ok: false, error: "Reps and weight must be valid positive numbers." };
      }
      sets.push({ reps, weight });
    }
    exercises.push({ exerciseId, sets });
  }

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
