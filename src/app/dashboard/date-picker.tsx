"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Only changes the `?date=` search param; the server page does the fetching.
export function DatePicker({ date }: { date: Date }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
