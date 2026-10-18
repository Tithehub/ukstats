import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { brandFromHost, type Brand } from "@/lib/site-host";

/** Same answer on server and browser, so the first paint never mismatches. */
export const currentBrand = createIsomorphicFn()
  .server((): Brand => {
    try {
      const req = getRequest();
      return brandFromHost(new URL(req.url).host);
    } catch {
      return "uk";
    }
  })
  .client((): Brand => brandFromHost(window.location.host));
