"use client";

import { useAuthContext, type UserAuth } from "@/context/AuthContext";

export type { UserAuth };

/**
 * useAuth Hook
 * Wrapper around AuthProvider mantendo compatibilidade com componentes existentes
 */
export function useAuth() {
  const { 
    user, 
    session,
    isLoading, 
    isAuthenticated, 
    login, 
    signup,
    logout, 
    updateUser 
  } = useAuthContext();

  return { 
    user, 
    token: session?.access_token || null,
    isLoading, 
    isAuthenticated, 
    login, 
    signup,
    logout, 
    updateUser 
  };
}
