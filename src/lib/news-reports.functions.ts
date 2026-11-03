import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export const getNewsReports = createServerFn({ method: "POST" }).handler(async () => {
  const { loadNewsReports } = await import("./news-reports.server");
  try { return await loadNewsReports(); } catch { return null; }
});

export const newsReportsQuery = (on: boolean) => queryOptions({
  queryKey: ["news-reports"], queryFn: () => getNewsReports(), enabled: on, staleTime: 5 * 60_000, refetchInterval: on ? 10 * 60_000 : false,
});
