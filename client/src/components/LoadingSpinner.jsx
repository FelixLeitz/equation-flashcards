import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export function LoadingSpinner({ fullScreen = false, className }) {
  const spinner = (
    <Loader2
      className={cn('h-6 w-6 animate-spin text-muted-foreground', className)}
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {spinner}
      </div>
    );
  }
  return <div className="flex items-center justify-center p-4">{spinner}</div>;
}
