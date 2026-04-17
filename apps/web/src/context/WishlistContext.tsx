"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Product } from "@/types";

interface WishlistContextValue {
  items: Product[];
  toggleFavorite: (product: Product) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  totalFavorites: number;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}

const MAX_ITEMS = 50;
const STORAGE_KEY = "agon-wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // 1. Carregar favoritos iniciais
  useEffect(() => {
    const loadWishlist = async () => {
      setIsLoading(true);
      try {
        if (isAuthenticated && user) {
          // Carregar do Supabase diretamente (não há API backend)
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          
          const { data, error } = await supabase
            .from('wishlist_items')
            .select('product_id, products(*)')
            .eq('user_id', user.id);
          
          if (!error && data) {
            setItems(data.map((item: any) => ({
              id: item.products.id,
              name: item.products.name,
              description: item.products.description,
              price: parseFloat(item.products.price),
              category: item.products.category_id,
              image_url: item.products.image_url,
              stock: item.products.stock,
              features: item.products.features || [],
              rating: parseFloat(item.products.rating || 0),
              reviews: item.products.reviews || 0,
              createdAt: item.products.created_at,
              updatedAt: item.products.updated_at,
              deletedAt: item.products.deleted_at,
            })));
          }
        } else {
          // Carregar do LocalStorage (Visitante)
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            setItems(JSON.parse(stored));
          }
        }
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, [isAuthenticated, user]);

  // 2. Persistir no LocalStorage apenas para visitantes
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isAuthenticated]);

  const isFavorite = useCallback(
    (productId: string) => items.some((item) => item.id === productId),
    [items]
  );

  const toggleFavorite = useCallback(
    async (product: Product) => {
      const alreadyFavorite = isFavorite(product.id);

      // Verificação de Limite (Apenas se estiver adicionando)
      if (!alreadyFavorite && items.length >= MAX_ITEMS) {
        toast.error(`Limite de ${MAX_ITEMS} favoritos atingido!`);
        return;
      }

      // Atualização Otimista da UI
      setItems((prev) =>
        alreadyFavorite
          ? prev.filter((item) => item.id !== product.id)
          : [...prev, product]
      );

      // Sincronização com Supabase se logado
      if (isAuthenticated && user) {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          
          if (alreadyFavorite) {
            // Remove from wishlist
            const { error } = await supabase
              .from('wishlist_items')
              .delete()
              .eq('user_id', user.id)
              .eq('product_id', product.id);
            
            if (error) throw error;
          } else {
            // Add to wishlist
            const { error } = await supabase
              .from('wishlist_items')
              .insert({
                user_id: user.id,
                product_id: product.id,
              });
            
            if (error) throw error;
          }
          
          toast.success(alreadyFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos!");
        } catch (error) {
          // Reverter UI em caso de erro
          const message = error instanceof Error ? error.message : "Erro ao salvar favorito.";
          setItems((prev) =>
            alreadyFavorite ? [...prev, product] : prev.filter((item) => item.id !== product.id)
          );
          toast.error(message);
        }
      } else {
        toast.success(alreadyFavorite ? "Removido dos favoritos" : "Salvo nos favoritos (Local)");
      }
    },
    [isAuthenticated, isFavorite, items.length, user]
  );

  return (
    <WishlistContext.Provider
      value={{
        items,
        toggleFavorite,
        isFavorite,
        totalFavorites: items.length,
        isLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
