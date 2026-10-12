/** Decorative photo strip. Never carries figures — the numbers live in the cards below it. */
export function Banner({ src, alt, eager = false }: { src: string; alt: string; eager?: boolean }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-lg border border-night-line">
      <img src={src} alt={alt} width={1600} height={640} loading={eager ? "eager" : "lazy"} className="h-36 w-full object-cover opacity-80 sm:h-48" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent" />
    </div>
  );
}
