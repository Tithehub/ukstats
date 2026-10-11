import type { ReactNode } from "react";

/**
 * Age and next-release text is read off the clock, so the server's render and the
 * client's hydration can land on either side of an "under 1h / 1h" or "due today /
 * due tomorrow" boundary. Wrapping that text keeps React from throwing away the
 * server-rendered page when it does; the figure and its source are untouched.
 */
export function ClockText({ children }: { children: ReactNode }) {
  return <span suppressHydrationWarning>{children}</span>;
}
