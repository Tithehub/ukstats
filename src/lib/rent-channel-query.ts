import { queryOptions } from "@tanstack/react-query";
import { getPublicChannel } from "@/lib/rent-channel.functions";

export const channelQuery = (slug: string) => queryOptions({
  queryKey: ["rent-channel", slug], staleTime: 5 * 60_000, refetchInterval: 10 * 60_000,
  queryFn: () => getPublicChannel({ data: { slug } }).catch(() => null),
});
