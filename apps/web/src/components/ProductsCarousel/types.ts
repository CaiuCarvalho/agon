import { Product } from '@/modules/products/types';

// ============================================================
// ProductsCarousel Types
// ============================================================

export interface ProductsCarouselProps {
  initialProducts?: Product[];
  error?: string | null;
  autoScrollInterval?: number; // default: 5000ms
  autoScrollDelay?: number; // default: 3000ms
  transitionDuration?: number; // default: 500ms
  pauseOnHoverDuration?: number; // default: 1000ms
  pauseOnInteractionDuration?: number; // default: 10000ms
}

export interface CarouselState {
  currentIndex: number; // índice do primeiro item visível
  itemsPerView: number; // 2 (mobile) ou 4 (desktop)
  totalItems: number;
  totalPages: number; // Math.ceil(totalItems / itemsPerView)
  isTransitioning: boolean;
}

export interface AutoScrollState {
  isActive: boolean;
  isPaused: boolean;
  pauseReason: 'hover' | 'interaction' | null;
  resumeTimeout: NodeJS.Timeout | null;
}

export interface NavigationState {
  canGoPrev: boolean;
  canGoNext: boolean;
  isAtStart: boolean; // currentIndex === 0
  isAtEnd: boolean; // currentIndex + itemsPerView >= totalItems
}

export type PauseReason = 'hover' | 'interaction';
