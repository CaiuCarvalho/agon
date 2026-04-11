import { useRef, TouchEvent } from 'react';

export interface UseSwipeGestureReturn {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

export function useSwipeGesture(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold: number = 50
): UseSwipeGestureReturn {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const onTouchMove = (e: TouchEvent) => {
    // Placeholder - pode ser usado para feedback visual durante swipe
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return;

    const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);

    // Ignorar se movimento vertical for maior (scroll vertical)
    if (deltaY > Math.abs(deltaX)) {
      touchStart.current = null;
      return;
    }

    // Verificar se movimento horizontal ultrapassou threshold
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        // Swipe para direita (prev)
        onSwipeRight();
      } else {
        // Swipe para esquerda (next)
        onSwipeLeft();
      }
    }

    touchStart.current = null;
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
