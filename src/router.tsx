import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { PageLoading } from './components/layout/PageFeedback';

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PageLoading,
    defaultPendingMs: 250,
    defaultPendingMinMs: 200,
    defaultPreload: false,
  });

  return router;
};
