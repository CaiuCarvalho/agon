import { Product } from '@/modules/products/types';
import ProductCard from '@/components/ProductCard';

interface CarouselTrackProps {
  products: Product[];
  currentIndex: number;
  itemsPerView: number;
  transitionDuration: number;
  isTransitioning: boolean;
}

export function CarouselTrack({
  products,
  currentIndex,
  itemsPerView,
  transitionDuration,
  isTransitioning,
}: CarouselTrackProps) {
  // Calcular translateX baseado no currentIndex e itemsPerView
  // Cada item ocupa 100% / itemsPerView do container
  const itemWidth = 100 / itemsPerView;
  const translateX = -(currentIndex * itemWidth);

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="flex transition-transform ease-in-out will-change-transform"
        style={{
          transform: `translateX(${translateX}%)`,
          transitionDuration: `${transitionDuration}ms`,
          pointerEvents: isTransitioning ? 'none' : 'auto',
        }}
        data-transitioning={isTransitioning}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 px-2"
            style={{
              width: `${itemWidth}%`,
            }}
          >
            <ProductCard
              id={product.id}
              image={product.imageUrl}
              title={product.name}
              price={product.price}
              category={product.category?.name}
              stock={product.stock}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
