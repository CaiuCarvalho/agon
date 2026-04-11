import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavigationButtonProps {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
  isAtBoundary: boolean; // primeira ou última página
  ariaLabel: string;
}

export function NavigationButton({
  direction,
  onClick,
  disabled,
  isAtBoundary,
  ariaLabel,
}: NavigationButtonProps) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  const positionClass = direction === 'prev' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={`
        absolute top-1/2 -translate-y-1/2 z-10
        ${positionClass}
        h-12 w-12 rounded-full
        bg-white shadow-lg
        flex items-center justify-center
        transition-all duration-300
        hover:bg-primary hover:text-white hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-foreground disabled:hover:scale-100
        ${isAtBoundary ? 'opacity-50' : 'opacity-100'}
        max-md:hidden
      `}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}
