import { useState, useCallback, useEffect } from "react";
import { useCartContext } from "../context/CartContext";
import { checkoutService } from "../services/checkoutService";
import { AddToCartPayload, CartItem } from "../contracts";

export function useCart() {
  const { cart, setCart, isOpen, setIsOpen, isInitialLoading, setIsInitialLoading } = useCartContext();
  const [isError, setIsError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Efeito de montagem para fetch original (Skeletons dependem disso)
  useEffect(() => {
    if (!cart && isInitialLoading) {
      checkoutService.fetchCartItems()
        .then(data => setCart(data))
        .catch(err => setIsError(err.message))
        .finally(() => setIsInitialLoading(false));
    }
  }, [cart, isInitialLoading, setCart]);

  // Behavior Otimista
  const addToCart = useCallback(async (payload: AddToCartPayload, fallbackItemMock: CartItem) => {
    setIsError(null);
    setIsSyncing(true);
    setIsOpen(true); // Otimista: Abre a UI instantaneamente na interação temporal zero

    // Clone profundo para rollback
    const previousCartSnapshot = cart ? JSON.parse(JSON.stringify(cart)) : null;

    // Mutação Otimista: Inserir ou incrementar no Front cegamente na View
    setCart(prev => {
      if (!prev) return prev;
      const newItems = [...prev.items];
      const existing = newItems.find(i => i.productId === payload.productId && i.size === payload.size);
      
      if (existing) {
        existing.quantity += payload.quantity;
      } else {
        // Como o Backend proveria os dados completos (Nome, Preço), precisamos do fallbackItemMock
        // para dar o visual instantâneo perfeito na tela antes do back responder o original.
        newItems.push({ ...fallbackItemMock, quantity: payload.quantity });
      }
      return { ...prev, items: newItems, total: prev.total + (fallbackItemMock.price * payload.quantity) };
    });

    try {
      const serverCart = await checkoutService.addToCart(payload);
      setCart(serverCart); // Sink verdade definitiva do BD
    } catch (err) {
      // Rollback Estrutural Seguro em caso da Action Falhar
      if (previousCartSnapshot) setCart(previousCartSnapshot);
      // Retorna a exceção pro Botão / Componente que engatilhou mostrar o erro ex: Toast
      throw err; 
    } finally {
      setIsSyncing(false);
    }
  }, [cart, setCart, setIsOpen]);

  const removeItem = useCallback(async (productId: string, size: string) => {
    const previousCartSnapshot = cart ? JSON.parse(JSON.stringify(cart)) : null;

    // Mutacao Otmista Rompimento local Front
    setCart(prev => {
      if (!prev) return prev;
      const removedItem = prev.items.find(i => i.productId === productId && i.size === size);
      const newItems = prev.items.filter(i => !(i.productId === productId && i.size === size));
      const subtraction = removedItem ? removedItem.price * removedItem.quantity : 0;
      return { ...prev, items: newItems, total: Math.max(0, prev.total - subtraction) };
    });

    try {
      const serverCart = await checkoutService.removeCartItem(productId, size);
      setCart(serverCart);
    } catch (err) {
      if (previousCartSnapshot) setCart(previousCartSnapshot);
      throw err;
    }
  }, [cart, setCart]);

  return {
    cart,
    isOpen,
    isInitialLoading,
    isSyncing,
    isError,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addToCart,
    removeItem
  };
}
