import { Link, useRouter } from '@tanstack/react-router';
import { LoaderCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PageLoading() {
  return <main aria-busy="true" className="mx-auto flex min-h-[50dvh] max-w-6xl items-center justify-center gap-3 px-4 text-muted-foreground">
    <LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
    <p role="status">Loading official figures…</p>
  </main>;
}

export function PageLoadError() {
  const router = useRouter();
  return <main className="mx-auto max-w-6xl px-4 py-16">
    <h1 className="text-2xl font-semibold">These figures couldn’t load</h1>
    <p role="alert" className="mt-3 text-muted-foreground">The source may be taking longer than usual. Please try again.</p>
    <div className="mt-6 flex flex-wrap gap-3">
      <Button onClick={() => void router.invalidate()}><RefreshCw />Try again</Button>
      <Button asChild variant="outline"><Link to="/"><ArrowLeft />Home</Link></Button>
    </div>
  </main>;
}

export function PageNotFound() {
  return <main className="mx-auto max-w-6xl px-4 py-16"><h1 className="text-2xl font-semibold">No figures found</h1><Button asChild variant="outline" className="mt-6"><Link to="/">Return home</Link></Button></main>;
}