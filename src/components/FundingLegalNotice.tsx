import { legalHoldStatement } from "@/lib/funding-policy";

/**
 * The legal statement shown while donations and sponsorships are on hold.
 * "panel" is a boxed notice on dark pages; "plain" lets a section keep its own colours.
 */
export function FundingLegalNotice({ tone = "panel", className = "" }: { tone?: "panel" | "plain"; className?: string }) {
  const statement = legalHoldStatement();
  if (!statement) return null;
  if (tone === "plain") return <p className={className}>{statement}</p>;
  return (
    <p className={`rounded-md border border-night-line bg-night-panel/80 px-4 py-3 text-sm leading-relaxed text-night-fg ${className}`}>
      {statement}
    </p>

  );
}
