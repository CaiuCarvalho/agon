interface PaginationDotsProps {
  totalPages: number;
  currentPage: number;
  onDotClick: (pageIndex: number) => void;
}

export function PaginationDots({
  totalPages,
  currentPage,
  onDotClick,
}: PaginationDotsProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Páginas do carrossel"
      className="flex items-center justify-center gap-2 mt-6"
    >
      {Array.from({ length: totalPages }).map((_, index) => (
        <button
          key={index}
          role="tab"
          aria-selected={index === currentPage}
          aria-label={`Ir para página ${index + 1}`}
          onClick={() => onDotClick(index)}
          className={`
            h-2 rounded-full transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            ${
              index === currentPage
                ? 'w-8 bg-primary'
                : 'w-2 bg-muted hover:bg-primary/50'
            }
          `}
        />
      ))}
    </div>
  );
}
