"use client";

import { CalendarIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { dateFromString, parseDateParam, toDateString } from "@/lib/dates";

/**
 * Date picker whose value lives in the `?date=YYYY-MM-DD` search param.
 * Defaults to today in the browser's time zone. Must render under <Suspense>
 * because it reads search params.
 */
export function DatePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const selected = dateFromString(
    parseDateParam(searchParams.get("date") ?? undefined, tz),
  );

  function select(date: Date | undefined) {
    if (!date) return;
    setOpen(false);
    startTransition(() => {
      router.push(`${pathname}?date=${toDateString(date)}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" className="min-w-52 justify-start" />
          }
        >
          <CalendarIcon />
          {selected.toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={select}
          />
        </PopoverContent>
      </Popover>
      <Button variant="ghost" onClick={() => select(new Date())}>
        Today
      </Button>
      {isPending && (
        <span className="text-sm text-muted-foreground">Loading…</span>
      )}
    </div>
  );
}
