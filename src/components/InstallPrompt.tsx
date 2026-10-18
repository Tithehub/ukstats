import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & { prompt: () => Promise<void> };

/** Phone-only nudge to add UKStats to the home screen. Renders nothing until the browser is known. */
export function InstallPrompt({ className = "" }: { className?: string }) {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const phone = window.matchMedia("(max-width: 768px)").matches;
    if (standalone || !phone || localStorage.getItem("install-dismissed")) return;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setHidden(false);
    const h = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  if (hidden || (!evt && !ios)) return null;
  const close = () => { localStorage.setItem("install-dismissed", "1"); setHidden(true); };

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-md border border-night-line bg-night-panel px-4 py-3 text-sm ${className}`}>
      <Smartphone className="h-5 w-5 shrink-0 text-electric-soft" aria-hidden="true" />
      <p className="flex-1">
        {evt ? "Add UKStats to your home screen to open it like an app." : "Add UKStats to your home screen: tap Share, then “Add to Home Screen”."}
      </p>
      {evt && <Button size="sm" onClick={() => { void evt.prompt(); close(); }}>Add to home screen</Button>}
      <Button size="sm" variant="ghost" onClick={close}>Not now</Button>
    </div>
  );
}
