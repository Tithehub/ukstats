import { createFileRoute } from "@tanstack/react-router";
import { LiveStreamPanel } from "@/components/LiveStreamPanel";
import { LIVE_STREAM_ID } from "@/lib/brand";

const thumb = `https://i.ytimg.com/vi/${LIVE_STREAM_ID}/hqdefault.jpg`;

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "UKStats Live — official UK figures streamed 24/7" },
      { name: "description", content: "Watch UKStats Live: national debt, small boats, warnings and more from official publishers, every figure sourced and dated." },
      { property: "og:title", content: "UKStats Live — official UK figures, 24/7" },
      { property: "og:description", content: "A round-the-clock stream of official UK statistics. Nothing guessed." },
      { property: "og:type", content: "video.other" },
      { property: "og:image", content: thumb },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: thumb },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-black">UKStats Live</h1>
      <p className="mt-2 text-muted-foreground">Official figures, read out and shown with their source, date and next release. Share it with anyone.</p>
      <LiveStreamPanel showLiveLink={false} />
    </main>
  );
}
