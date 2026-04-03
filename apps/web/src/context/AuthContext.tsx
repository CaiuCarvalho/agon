"use client";

import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export interface UserAuth {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  taxId?: string;
  phone?: string;
}

interface AuthContextType {
  user: UserAuth | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserAuth, jwtToken: string) => void;
  logout: () => void;
  updateUser: (newData: Partial<UserAuth>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_COOKIE_NAME = "vitta_token";
const USER_LOCAL_STORAGE = "vitta_user";

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token);
    if (!payload) return true;
    
    // Se o backend não enviar 'exp' (erro anterior), verificamos o 'iat' ou apenas permitimos
    if (typeof payload.exp !== "number") {
      console.warn("[Auth] Token without 'exp' claim. Checking 'iat'...");
      if (typeof payload.iat === "number") {
        // Válido por pelo menos 4 horas se não houver expiração explícita
        return Date.now() >= (payload.iat + (4 * 3600)) * 1000;
      }
      return false; // Assume válido se não tiver info nenhuma
    }

    // Margem de 30 segundos para clock skew
    const now = Math.floor(Date.now() / 1000);
    return now >= (payload.exp - 30);
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAuth | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const clearAuth = useCallback(() => {
    if (typeof window !== "undefined") {
      Cookies.remove(AUTH_COOKIE_NAME);
      localStorage.removeItem(AUTH_COOKIE_NAME); // Limpa também o LS por segurança
      localStorage.removeItem(USER_LOCAL_STORAGE);
    }
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window !== "undefined") {
          const storedToken = Cookies.get(AUTH_COOKIE_NAME) || localStorage.getItem(AUTH_COOKIE_NAME);
          const storedUser = localStorage.getItem(USER_LOCAL_STORAGE);

          if (storedToken && storedUser) {
            if (isTokenExpired(storedToken)) {
              console.warn("[Auth] Token expired");
              clearAuth();
            } else {
              const userData = JSON.parse(storedUser);
              setToken(storedToken);
              setUser(userData);
              
              if (!Cookies.get(AUTH_COOKIE_NAME)) {
                Cookies.set(AUTH_COOKIE_NAME, storedToken, { expires: 7, path: "/" });
              }
            }
          } else {
            // Sessão não encontrada
          }
        }
      } catch (error) {
        console.error("[Auth] Error during initialization:", error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [clearAuth]);

  const login = useCallback((userData: UserAuth, jwtToken: string) => {
    // login iniciado
    if (typeof window !== "undefined") {
      Cookies.set(AUTH_COOKIE_NAME, jwtToken, { expires: 7, path: "/" });
      localStorage.setItem(AUTH_COOKIE_NAME, jwtToken);
      localStorage.setItem(USER_LOCAL_STORAGE, JSON.stringify(userData));
    }
    setToken(jwtToken);
    setUser(userData);
    
    setTimeout(() => {
      router.refresh();
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/";
      router.push(redirect);
    }, 150);
  }, [router]);

  const logout = useCallback(() => {
    clearAuth();
    setTimeout(() => {
      router.refresh();
      router.push("/login");
    }, 100);
  }, [clearAuth, router]);

  const updateUser = useCallback((newData: Partial<UserAuth>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...newData };
      localStorage.setItem(USER_LOCAL_STORAGE, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
