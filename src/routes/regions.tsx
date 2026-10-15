import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/regions")({
  head: () => ({ meta: [{ title: 'UK regional statistics — UKStats' }, { name: 'description', content: 'Explore official statistics for UK nations and regions.' }, { property: 'og:title', content: 'UK regional statistics — UKStats' }, { property: 'og:description', content: 'Sourced figures for UK nations and regions.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: () => <Outlet />,
});
