import { format, isValid, parse } from "date-fns";
import { connection } from "next/server";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAvailableExercises,
  getWorkoutDates,
  getWorkoutsForDate,
} from "@/data/workouts";

import { AddWorkoutDialog } from "./add-workout-dialog";
import { EditWorkoutDialog } from "./edit-workout-dialog";
import { DatePicker } from "./date-picker";

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { date: dateParam } = await searchParams;
  // Prerendering stops here; `new Date()` below only runs at request time.
  await connection();
  const parsed =
    typeof dateParam === "string"
      ? parse(dateParam, "yyyy-MM-dd", new Date())
      : undefined;
  const date = parsed && isValid(parsed) ? parsed : new Date();

  const [workouts, exercises, workoutDates] = await Promise.all([
    getWorkoutsForDate(date),
    getAvailableExercises(),
    getWorkoutDates(),
  ]);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#b8e2f4]">
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <DatePicker date={date} workoutDates={workoutDates} />
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">
          Workouts on {format(date, "do MMM yyyy")}
        </h2>

        {workouts.length === 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              No workouts logged for this day.
            </p>
            <AddWorkoutDialog date={date} exercises={exercises} />
          </>
        )}

        {workouts.map((workout) => (
          <Card key={workout.id}>
            <CardHeader>
              <CardTitle>{workout.name ?? "Workout"}</CardTitle>
              <CardDescription>
                {format(workout.performedAt, "HH:mm")} ·{" "}
                {workout.workoutExercises.length} exercises
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {workout.workoutExercises.map((we) => (
                <div
                  key={we.id}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="font-medium">{we.exercise.name}</span>
                  <span className="flex items-center gap-2">
                    {we.exercise.muscleGroup && (
                      <Badge variant="secondary">{we.exercise.muscleGroup}</Badge>
                    )}
                    <span className="text-muted-foreground">
                      {we.sets.length} sets
                    </span>
                  </span>
                </div>
              ))}
              <EditWorkoutDialog workout={workout} exercises={exercises} />
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
    </div>
  );
}
