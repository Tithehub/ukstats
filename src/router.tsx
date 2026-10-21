import { QueryClient, dehydrate, hydrate } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { PageLoading } from './components/layout/PageFeedback';

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    dehydrate: () => ({ queryState: JSON.stringify(dehydrate(queryClient)) }),
    hydrate: (state) => { hydrate(queryClient, JSON.parse(state.queryState)); },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Avoid replaying direct loaders when returning to a page just visited.
    defaultStaleTime: 60_000,
    defaultPendingComponent: PageLoading,
    defaultPendingMs: 250,
    defaultPendingMinMs: 200,
    defaultPreload: false,
  });

  return router;
};
