"use client";

import { useAuthContext, type UserAuth } from "@/context/AuthContext";

export type { UserAuth };

/**
 * useAuth Hook
 * Now a simple wrapper around AuthProvider to maintain compatibility 
 * with existing components while providing global state synchronization.
 */
export function useAuth() {
  const { 
    user, 
    token, 
    isLoading, 
    isAuthenticated, 
    login, 
    logout, 
    updateUser 
  } = useAuthContext();

  return { 
    user, 
    token, 
    isLoading, 
    isAuthenticated, 
    login, 
    logout, 
    updateUser 
  };
}
