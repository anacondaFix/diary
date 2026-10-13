"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TZ_COOKIE } from "@/lib/dates";

/**
 * Stores the browser's IANA time zone in a cookie so server components can
 * work out which calendar day a timestamp belongs to. Refreshes the route
 * once when the cookie was missing or stale.
 */
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const current = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${TZ_COOKIE}=`))
      ?.split("=")[1];
    if (current === encodeURIComponent(tz)) return;

    document.cookie = `${TZ_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
