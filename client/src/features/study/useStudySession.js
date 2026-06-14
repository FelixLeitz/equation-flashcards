import { useCallback, useMemo, useState } from 'react';

/**
 * Manages a study session over an ordered list of cards.
 * State: current index, whether the back is shown, and completion.
 */
export function useStudySession(cards = []) {
  const total = cards.length;
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentCard = useMemo(() => cards[index] ?? null, [cards, index]);
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // Reveal the back; if already showing, this is a no-op.
  const flip = useCallback(() => {
    setShowBack((prev) => !prev);
  }, []);

  // Advance to the next card, or complete the session on the last card.
  const next = useCallback(() => {
    setShowBack(false);
    setIndex((prev) => {
      if (prev >= total - 1) {
        setCompleted(true);
        return prev;
      }
      return prev + 1;
    });
  }, [total]);

  const prev = useCallback(() => {
    setShowBack(false);
    setIndex((p) => Math.max(0, p - 1));
  }, []);

  const restart = useCallback(() => {
    setIndex(0);
    setShowBack(false);
    setCompleted(false);
  }, []);

  return {
    total,
    index,
    currentCard,
    showBack,
    completed,
    isFirst,
    isLast,
    flip,
    next,
    prev,
    restart
  };
}
