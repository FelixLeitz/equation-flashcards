import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner.jsx';
import { useDeck } from '@/features/decks/api.js';
import { useStudySession } from './useStudySession.js';
import { useSwipe } from './useSwipe.js';
import { CardFace } from './CardFace.jsx';
import { SessionComplete } from './SessionComplete.jsx';

export default function StudyMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useDeck(id);

  const cards = data?.cards ?? [];
  const session = useStudySession(cards);
  const {
    total,
    index,
    currentCard,
    showBack,
    completed,
    isFirst,
    flip,
    next,
    prev,
    restart
  } = session;

  const exit = () => navigate(`/decks/${id}`);

  const swipe = useSwipe({ onSwipeLeft: next, onSwipeRight: prev });

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e) => {
      if (completed) return;
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          flip();
          break;
        case 'ArrowRight':
          next();
          break;
        case 'ArrowLeft':
          prev();
          break;
        case 'Escape':
          exit();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, flip, next, prev]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4">
        <p className="text-muted-foreground">Could not load this deck.</p>
        <Button variant="outline" onClick={() => navigate('/decks')}>
          Back to decks
        </Button>
      </div>
    );
  }

  // Guard: a deck with no cards shouldn't be studyable (Study button is
  // disabled in the UI, but handle direct navigation too).
  if (total === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4">
        <p className="text-muted-foreground">This deck has no cards yet.</p>
        <Button variant="outline" onClick={exit}>
          Back to deck
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col p-4 sm:p-6"
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
    >
      {/* Top bar: progress + exit */}
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {completed ? `${total} of ${total}` : `Card ${index + 1} of ${total}`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={exit}
          aria-label="Exit study"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mx-auto mt-2 h-1 w-full max-w-2xl overflow-hidden rounded bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{
            width: `${completed ? 100 : ((index + 1) / total) * 100}%`
          }}
        />
      </div>

      {/* Body */}
      {completed ? (
        <SessionComplete total={total} onRestart={restart} onExit={exit} />
      ) : (
        <>
          <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center py-6">
            <CardFace card={currentCard} showBack={showBack} onFlip={flip} />
          </div>

          {/* Bottom navigation */}
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={prev}
              disabled={isFirst}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="ghost"
              onClick={flip}
              className="hidden sm:inline-flex"
            >
              {showBack ? 'Show question' : 'Show answer'}
            </Button>
            <Button onClick={next} className="flex-1 sm:flex-none">
              {session.isLast ? 'Finish' : 'Next'}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
