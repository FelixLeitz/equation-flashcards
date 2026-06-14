import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStudySession } from '../useStudySession.js';

const cards = [
  { id: 'a', front: '1', back: 'A' },
  { id: 'b', front: '2', back: 'B' }
];

describe('useStudySession', () => {
  it('starts on the first card, front showing', () => {
    const { result } = renderHook(() => useStudySession(cards));
    expect(result.current.index).toBe(0);
    expect(result.current.showBack).toBe(false);
    expect(result.current.currentCard.id).toBe('a');
    expect(result.current.isFirst).toBe(true);
  });

  it('flip toggles the back', () => {
    const { result } = renderHook(() => useStudySession(cards));
    act(() => result.current.flip());
    expect(result.current.showBack).toBe(true);
    act(() => result.current.flip());
    expect(result.current.showBack).toBe(false);
  });

  it('next advances and resets the face', () => {
    const { result } = renderHook(() => useStudySession(cards));
    act(() => result.current.flip());
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    expect(result.current.showBack).toBe(false);
    expect(result.current.isLast).toBe(true);
  });

  it('next on the last card completes the session', () => {
    const { result } = renderHook(() => useStudySession(cards));
    act(() => result.current.next()); // -> index 1
    act(() => result.current.next()); // -> complete
    expect(result.current.completed).toBe(true);
  });

  it('prev does not go below zero', () => {
    const { result } = renderHook(() => useStudySession(cards));
    act(() => result.current.prev());
    expect(result.current.index).toBe(0);
  });

  it('restart resets everything', () => {
    const { result } = renderHook(() => useStudySession(cards));
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.restart());
    expect(result.current.index).toBe(0);
    expect(result.current.completed).toBe(false);
    expect(result.current.showBack).toBe(false);
  });
});
