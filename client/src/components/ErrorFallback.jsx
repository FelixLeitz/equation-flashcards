import { Button } from '@/components/ui/button';

export function ErrorFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">
        An unexpected error occurred. Please try reloading the page.
      </p>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </div>
  );
}
