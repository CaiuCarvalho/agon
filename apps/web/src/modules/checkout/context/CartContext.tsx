"use client";
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";
import { Cart } from "../contracts";

interface CartContextData {
  cart: Cart | null;
  setCart: Dispatch<SetStateAction<Cart | null>>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isInitialLoading: boolean;
  setIsInitialLoading: (val: boolean) => void;
}

export const CartContext = createContext<CartContextData | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  return (
    <CartContext.Provider value={{ cart, setCart, isOpen, setIsOpen, isInitialLoading, setIsInitialLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCartContext deve ser usado dentro de CartProvider");
  return context;
};
