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

const MAX_ITEMS = 20;
const STORAGE_KEY = "agon-wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated, token } = useAuth();

  // 1. Carregar favoritos iniciais
  useEffect(() => {
    const loadWishlist = async () => {
      setIsLoading(true);
      try {
        if (isAuthenticated && token) {
          // Carregar do Banco de Dados
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wishlist`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const result = await response.json();
          if (response.ok) {
            setItems(result.data.map((item: { product: Product }) => item.product));
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
  }, [isAuthenticated, token]);

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

      // Sincronização com Backend se logado
      if (isAuthenticated) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/wishlist/toggle/${product.id}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erro ao atualizar favoritos.");
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
    [isAuthenticated, isFavorite, items.length]
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
