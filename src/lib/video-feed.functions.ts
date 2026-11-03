import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export const getVideoFeed = createServerFn({ method: "POST" }).handler(async () => {
  const { loadVideoFeed } = await import("./video-feed.server");
  try { return await loadVideoFeed(); } catch { return null; }
});

export const videoFeedQuery = (paused = false) => queryOptions({
  queryKey: ["video-feed"], queryFn: () => getVideoFeed(), staleTime: 60_000,
  refetchInterval: paused ? false : 120_000, refetchIntervalInBackground: false,
});
