import { QueryClient, dehydrate, hydrate } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { PageLoading } from './components/layout/PageFeedback';

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    dehydrate: () => ({ queryState: dehydrate(queryClient) }),
    hydrate: (state) => { hydrate(queryClient, state.queryState); },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PageLoading,
    defaultPendingMs: 250,
    defaultPendingMinMs: 200,
    defaultPreload: false,
  });

  return router;
};
