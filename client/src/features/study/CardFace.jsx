import { LatexRenderer } from '@/components/LatexRenderer.jsx';
import { cn } from '@/lib/utils.js';

/**
 * The large, central study card. Shows front or back; click/tap to flip.
 */
export function CardFace({ card, showBack, onFlip }) {
  const content = showBack ? card.back : card.front;

  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={showBack ? 'Show front' : 'Show answer'}
      className={cn(
        'flex w-full max-w-2xl flex-1 cursor-pointer select-none flex-col',
        'items-center justify-center rounded-xl border bg-card p-8 text-center',
        'shadow-sm transition-colors hover:bg-accent/30',
        'min-h-[40vh] sm:min-h-[50vh]'
      )}
    >
      <span className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {showBack ? 'Answer' : 'Question'}
      </span>
      <div className="text-xl sm:text-2xl">
        <LatexRenderer content={content} />
      </div>
      <span className="mt-6 text-xs text-muted-foreground">
        {showBack ? 'Tap to flip back' : 'Tap to reveal answer'}
      </span>
    </button>
  );
}
