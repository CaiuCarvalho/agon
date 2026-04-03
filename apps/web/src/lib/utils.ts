import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ProductDTO = any;
export type UserProfile = any;
export type ShippingAddress = any;
export const formatCurrency = (val: number) => `$${val}`;
