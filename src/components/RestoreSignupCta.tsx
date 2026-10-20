import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RESTORE_BRITAIN_JOIN_URL } from "@/lib/brand";

/**
 * Shared "Sign up to Restore Britain" call to action. One place for the panel,
 * so every main page carries the same wording and the same single destination.
 */
export function RestoreSignupCta({ className = "mt-8" }: { className?: string }) {
  return (
    <section
      aria-labelledby="restore-signup-title"
      className={`${className} rounded-lg border border-dedication-foreground/20 bg-dedication p-5 text-dedication-foreground sm:flex sm:items-center sm:justify-between sm:gap-6`}
    >
      <div className="min-w-0">
        <h2 id="restore-signup-title" className="text-base font-semibold">
          Built for Restore Britain
        </h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-dedication-muted">
          UKStats was built on their behalf and donated to them. Joining is handled entirely on their own
          website — nothing on this page collects your details.
        </p>
      </div>
      <div className="mt-4 shrink-0 sm:mt-0">
        <Button asChild size="lg" variant="dedication">
          <a href={RESTORE_BRITAIN_JOIN_URL} target="_blank" rel="noreferrer noopener">
            Sign up to Restore Britain
            <ArrowRight aria-hidden="true" />
          </a>
        </Button>
        <p className="mt-2 font-mono text-[11px] text-dedication-muted">
          Opens restorebritain.org.uk in a new tab
        </p>
      </div>
    </section>
  );
}
