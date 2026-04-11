import { useState, useEffect } from 'react';

export interface UseCarouselResponsiveReturn {
  itemsPerView: number;
  isMobile: boolean;
}

export function useCarouselResponsive(): UseCarouselResponsiveReturn {
  // Inicializar com valor padrão (desktop) para SSR
  const [itemsPerView, setItemsPerView] = useState(4);

  useEffect(() => {
    // Definir valor inicial baseado no tamanho atual da janela
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setItemsPerView(mediaQuery.matches ? 4 : 2);

    // Handler para mudanças de viewport
    const handleChange = (e: MediaQueryListEvent) => {
      setItemsPerView(e.matches ? 4 : 2);
    };

    // Adicionar listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup: remover listener no unmount
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return {
    itemsPerView,
    isMobile: itemsPerView === 2,
  };
}
