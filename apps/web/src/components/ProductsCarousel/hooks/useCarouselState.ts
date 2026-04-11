import { useState, useCallback, useMemo } from 'react';

export interface UseCarouselStateReturn {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  itemsPerView: number;
  setItemsPerView: (count: number) => void;
  totalPages: number;
  currentPage: number;
  isTransitioning: boolean;
  setIsTransitioning: (value: boolean) => void;
}

export function useCarouselState(
  totalItems: number,
  initialItemsPerView: number
): UseCarouselStateReturn {
  const [currentIndex, setCurrentIndexState] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(initialItemsPerView);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Calcular totalPages automaticamente
  const totalPages = useMemo(() => {
    if (totalItems === 0 || itemsPerView === 0) return 0;
    return Math.ceil(totalItems / itemsPerView);
  }, [totalItems, itemsPerView]);

  // Calcular currentPage
  const currentPage = useMemo(() => {
    if (itemsPerView === 0) return 0;
    return Math.floor(currentIndex / itemsPerView);
  }, [currentIndex, itemsPerView]);

  // Validar e definir currentIndex com limites
  const setCurrentIndex = useCallback(
    (index: number) => {
      // Validar limites
      const maxIndex = Math.max(0, totalItems - itemsPerView);
      const validIndex = Math.max(0, Math.min(index, maxIndex));
      setCurrentIndexState(validIndex);
    },
    [totalItems, itemsPerView]
  );

  return {
    currentIndex,
    setCurrentIndex,
    itemsPerView,
    setItemsPerView,
    totalPages,
    currentPage,
    isTransitioning,
    setIsTransitioning,
  };
}
