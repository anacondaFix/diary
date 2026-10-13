"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Placeholder data for the UI only. Replaced once data fetching is wired up.
const placeholderWorkouts = [
  {
    id: 1,
    name: "Upper Body Push",
    time: "07:30",
    exercises: [
      { name: "Bench Press", muscleGroup: "Chest", sets: 4 },
      { name: "Overhead Press", muscleGroup: "Shoulders", sets: 3 },
      { name: "Tricep Pushdown", muscleGroup: "Arms", sets: 3 },
    ],
  },
  {
    id: 2,
    name: "Evening Mobility",
    time: "19:00",
    exercises: [
      { name: "Hip Flexor Stretch", muscleGroup: "Hips", sets: 2 },
      { name: "Cat-Cow", muscleGroup: "Back", sets: 2 },
    ],
  },
];

// Reading the current time during render breaks prerendering under Cache
// Components. useSyncExternalStore yields `undefined` on the server/prerender
// and today's date on the client, without a setState-in-effect.
let cachedToday: Date | undefined;
const subscribeToday = () => () => {};
const getToday = () => (cachedToday ??= new Date());
const getServerToday = () => undefined;

export default function DashboardPage() {
  const today = useSyncExternalStore(subscribeToday, getToday, getServerToday);
  const [picked, setPicked] = useState<Date | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const date = picked ?? today;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button variant="outline" className="w-full justify-start sm:w-56" />
            }
          >
            <CalendarIcon />
            {date ? format(date, "do MMM yyyy") : "Pick a date"}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              defaultMonth={date}
              onSelect={(next) => {
                if (next) {
                  setPicked(next);
                  setOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">
          {date ? `Workouts on ${format(date, "do MMM yyyy")}` : "Workouts"}
        </h2>

        {placeholderWorkouts.map((workout) => (
          <Card key={workout.id}>
            <CardHeader>
              <CardTitle>{workout.name}</CardTitle>
              <CardDescription>
                {workout.time} · {workout.exercises.length} exercises
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {workout.exercises.map((exercise) => (
                <div
                  key={exercise.name}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="font-medium">{exercise.name}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary">{exercise.muscleGroup}</Badge>
                    <span className="text-muted-foreground">
                      {exercise.sets} sets
                    </span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
