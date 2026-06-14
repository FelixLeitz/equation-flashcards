import { CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SessionComplete({ total, onRestart, onExit }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <CheckCircle2 className="h-14 w-14 text-primary" />
      <h2 className="text-2xl font-bold">Session complete!</h2>
      <p className="text-muted-foreground">
        You reviewed all {total} {total === 1 ? 'card' : 'cards'}.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onRestart}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Study again
        </Button>
        <Button variant="outline" onClick={onExit}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to deck
        </Button>
      </div>
    </div>
  );
}
