import { Suspense } from "react";
import { DatePicker } from "@/components/date-picker";
import { TimezoneSync } from "@/components/timezone-sync";
import { Button } from "@/components/ui/button";
import { WorkoutListSkeleton, Workouts } from "./workouts";

export const metadata = { title: "Dashboard" };

export default function DashboardPage(props: PageProps<"/dashboard">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pb-12">
      <TimezoneSync />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Suspense
          fallback={
            <Button variant="outline" disabled className="min-w-52">
              Loading…
            </Button>
          }
        >
          <DatePicker />
        </Suspense>
      </div>
      <Suspense fallback={<WorkoutListSkeleton />}>
        <Workouts searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
