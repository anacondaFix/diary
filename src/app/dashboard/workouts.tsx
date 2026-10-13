import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { getWorkoutsForDay, type WorkoutWithDetails } from "@/data/workouts";
import {
  dateFromString,
  dayRange,
  parseDateParam,
  safeTimeZone,
  TZ_COOKIE,
} from "@/lib/dates";

type WorkoutsProps = {
  searchParams: PageProps<"/dashboard">["searchParams"];
};

export async function Workouts({ searchParams }: WorkoutsProps) {
  const { userId } = await auth();
  if (!userId) return null; // proxy.ts already redirects signed-out users

  const [{ date }, cookieStore] = await Promise.all([searchParams, cookies()]);
  const tz = safeTimeZone(cookieStore.get(TZ_COOKIE)?.value);
  const day = parseDateParam(date, tz);
  const { start, end } = dayRange(day, tz);

  const workouts = await getWorkoutsForDay(userId, start, end);

  if (workouts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No workouts logged on{" "}
        {dateFromString(day).toLocaleDateString("en-US", {
          dateStyle: "full",
        })}
        .
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {workouts.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} tz={tz} />
      ))}
    </ul>
  );
}

function WorkoutCard({
  workout,
  tz,
}: {
  workout: WorkoutWithDetails;
  tz: string;
}) {
  const time = workout.performedAt.toLocaleTimeString("en-US", {
    timeStyle: "short",
    timeZone: tz,
  });

  return (
    <li className="rounded-lg border p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">{workout.name ?? "Workout"}</h2>
        <time
          dateTime={workout.performedAt.toISOString()}
          className="text-sm text-muted-foreground"
        >
          {time}
        </time>
      </div>
      {workout.notes && (
        <p className="mt-1 text-sm text-muted-foreground">{workout.notes}</p>
      )}

      <ol className="mt-4 flex flex-col gap-4">
        {workout.workoutExercises.map((we) => (
          <li key={we.id}>
            <h3 className="font-medium">{we.exercise.name}</h3>
            {we.notes && (
              <p className="text-sm text-muted-foreground">{we.notes}</p>
            )}
            <ul className="mt-1 flex flex-col gap-0.5 text-sm tabular-nums">
              {we.sets.map((set) => (
                <li key={set.id} className="flex gap-3">
                  <span className="w-12 text-muted-foreground">
                    Set {set.setNumber}
                  </span>
                  <span>
                    {set.reps ?? "–"} reps
                    {set.weight != null && ` × ${Number(set.weight)} kg`}
                  </span>
                  {set.isWarmup && (
                    <span className="text-muted-foreground">warm-up</span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </li>
  );
}

export function WorkoutListSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      {[0, 1].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
