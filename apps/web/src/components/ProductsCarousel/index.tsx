'use client';

import { useEffect } from 'react';
import { ProductsCarouselProps } from './types';
import { CarouselTrack } from './CarouselTrack';
import { NavigationButton } from './NavigationButton';
import { PaginationDots } from './PaginationDots';
import {
  useCarouselState,
  useCarouselResponsive,
  useCarouselNavigation,
  useAutoScroll,
  useSwipeGesture,
} from './hooks';

export function ProductsCarousel({
  initialProducts = [],
  error = null,
  autoScrollInterval = 5000,
  autoScrollDelay = 3000,
  transitionDuration = 500,
  pauseOnHoverDuration = 1000,
  pauseOnInteractionDuration = 10000,
}: ProductsCarouselProps) {
  // Hook de detecção responsiva
  const { itemsPerView } = useCarouselResponsive();

  // Hook de estado central
  const {
    currentIndex,
    setCurrentIndex,
    itemsPerView: stateItemsPerView,
    setItemsPerView,
    totalPages,
    currentPage,
    isTransitioning,
    setIsTransitioning,
  } = useCarouselState(initialProducts.length, itemsPerView);

  // Sincronizar itemsPerView do responsive com o estado
  useEffect(() => {
    setItemsPerView(itemsPerView);
  }, [itemsPerView, setItemsPerView]);

  // Callback para interação do usuário
  const handleInteraction = () => {
    autoScroll.pause('interaction');
    autoScroll.resume('interaction');
  };

  // Hook de navegação
  const navigation = useCarouselNavigation(
    currentIndex,
    setCurrentIndex,
    stateItemsPerView,
    initialProducts.length
  );

  const handleUserNext = () => {
    navigation.goToNext();
    handleInteraction();
  };

  const handleUserPrev = () => {
    navigation.goToPrev();
    handleInteraction();
  };

  const handleUserGoToPage = (pageIndex: number) => {
    navigation.goToPage(pageIndex);
    handleInteraction();
  };

  // Hook de auto-scroll
  const autoScroll = useAutoScroll(navigation.goToNext, {
    interval: autoScrollInterval,
    initialDelay: autoScrollDelay,
    pauseOnHoverDuration,
    pauseOnInteractionDuration,
  });

  // Hook de gestos touch
  const swipeHandlers = useSwipeGesture(
    () => {
      handleUserNext();
    },
    () => {
      handleUserPrev();
    }
  );

  // Gerenciar transição
  useEffect(() => {
    setIsTransitioning(true);
    const timeout = setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);

    return () => clearTimeout(timeout);
  }, [currentIndex, transitionDuration, setIsTransitioning]);

  // Handlers de hover
  const handleMouseEnter = () => {
    autoScroll.pause('hover');
  };

  const handleMouseLeave = () => {
    autoScroll.resume('hover');
  };

  // Fallback para erro ou produtos vazios
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (initialProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum produto disponível</p>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Equipamentos da Seleção"
      className="relative w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...swipeHandlers}
    >
      {/* Container do carrossel */}
      <div className="relative px-12 max-md:px-0">
        {/* Botão anterior */}
        <NavigationButton
          direction="prev"
          onClick={handleUserPrev}
          disabled={navigation.isAtStart}
          isAtBoundary={navigation.isAtStart}
          ariaLabel="Produto anterior"
        />

        {/* Track com produtos */}
        <div
          role="group"
          aria-roledescription="slide"
          aria-label={`Produtos ${currentPage + 1} de ${totalPages}`}
        >
          <CarouselTrack
            products={initialProducts}
            currentIndex={currentIndex}
            itemsPerView={stateItemsPerView}
            transitionDuration={transitionDuration}
            isTransitioning={isTransitioning}
          />
        </div>

        {/* Botão próximo */}
        <NavigationButton
          direction="next"
          onClick={handleUserNext}
          disabled={navigation.isAtEnd}
          isAtBoundary={navigation.isAtEnd}
          ariaLabel="Próximo produto"
        />
      </div>

      {/* Pagination dots */}
      <PaginationDots
        totalPages={totalPages}
        currentPage={currentPage}
        onDotClick={handleUserGoToPage}
      />
    </div>
  );
}
