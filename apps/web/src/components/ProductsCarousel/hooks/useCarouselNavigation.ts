import { useCallback, useMemo } from 'react';

export interface UseCarouselNavigationReturn {
  goToNext: () => void;
  goToPrev: () => void;
  goToPage: (pageIndex: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isAtStart: boolean;
  isAtEnd: boolean;
}

export function useCarouselNavigation(
  currentIndex: number,
  setCurrentIndex: (index: number) => void,
  itemsPerView: number,
  totalItems: number
): UseCarouselNavigationReturn {
  // Para navegação infinita (loop), nunca estamos no início ou fim
  const isAtStart = false; // Sempre false para permitir loop
  const isAtEnd = false; // Sempre false para permitir loop
  const canGoPrev = totalItems > 0;
  const canGoNext = totalItems > 0;

  // Navegar para próxima página com loop
  const goToNext = useCallback(() => {
    if (totalItems === 0) return;

    const nextIndex = currentIndex + itemsPerView;
    
    // Se ultrapassar o final, voltar ao início (loop)
    if (nextIndex >= totalItems) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(nextIndex);
    }

  }, [currentIndex, itemsPerView, totalItems, setCurrentIndex]);

  // Navegar para página anterior com loop
  const goToPrev = useCallback(() => {
    if (totalItems === 0) return;

    const prevIndex = currentIndex - itemsPerView;

    // Se for antes do início, ir para última página (loop)
    if (prevIndex < 0) {
      const lastPageIndex = Math.floor((totalItems - 1) / itemsPerView) * itemsPerView;
      setCurrentIndex(lastPageIndex);
    } else {
      setCurrentIndex(prevIndex);
    }

  }, [currentIndex, itemsPerView, totalItems, setCurrentIndex]);

  // Navegar para página específica
  const goToPage = useCallback(
    (pageIndex: number) => {
      if (totalItems === 0) return;

      const newIndex = pageIndex * itemsPerView;
      setCurrentIndex(newIndex);
    },
    [itemsPerView, totalItems, setCurrentIndex]
  );

  return {
    goToNext,
    goToPrev,
    goToPage,
    canGoNext,
    canGoPrev,
    isAtStart,
    isAtEnd,
  };
}
