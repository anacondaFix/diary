"use client";

import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Only changes the `?date=` search param; the server page does the fetching.
// `workoutDates` are "yyyy-MM-dd" strings for days with a logged workout;
// they are highlighted in green.
export function DatePicker({
  date,
  workoutDates,
}: {
  date: Date;
  workoutDates: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const workoutDays = workoutDates.map((d) => parse(d, "yyyy-MM-dd", new Date()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" className="w-full justify-start sm:w-56" />}
      >
        <CalendarIcon />
        {format(date, "do MMM yyyy")}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          modifiers={{ workout: workoutDays }}
          modifiersClassNames={{
            workout:
              "bg-green-200! text-green-900 dark:bg-green-800/70! dark:text-green-50",
          }}
          onSelect={(next) => {
            if (next) {
              setOpen(false);
              router.push(`/dashboard?date=${format(next, "yyyy-MM-dd")}`);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
