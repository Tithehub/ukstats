import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Password field with a show/hide eye control so people can check what they
 * typed before submitting. The button is a real toggle (aria-pressed) and is
 * never a form submit.
 */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function PasswordInput({ className = "", ...props }, ref) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative mt-2">
      <input
        ref={ref}
        {...props}
        type={shown ? "text" : "password"}
        className={`min-h-11 w-full rounded-lg border border-night-line/70 bg-night-panel px-3 py-2.5 pr-12 text-sm outline-none focus-visible:border-electric ${className}`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-pressed={shown}
        aria-label={shown ? "Hide password" : "Show password"}
        title={shown ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 grid min-h-11 w-9 -translate-y-1/2 place-items-center rounded-md text-night-muted transition-colors hover:text-night-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
      >
        {shown ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
});
