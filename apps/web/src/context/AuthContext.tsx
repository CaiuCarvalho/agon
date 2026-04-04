"use client";

import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

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
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (newData: Partial<UserAuth>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUserToUserAuth(user: User, profile: { name?: string; role?: string; avatar_url?: string; tax_id?: string; phone?: string } | null): UserAuth {
  return {
    id: user.id,
    email: user.email!,
    name: profile?.name || user.user_metadata?.name || "",
    role: profile?.role || "customer",
    avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url,
    taxId: profile?.tax_id,
    phone: profile?.phone,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAuth | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      return profile;
    } catch (error) {
      console.error("[Auth] Error loading profile:", error);
      return null;
    }
  }, [supabase]);

  const initializeAuth = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession?.user) {
        const profile = await loadUserProfile(currentSession.user.id);
        setSession(currentSession);
        setUser(mapSupabaseUserToUserAuth(currentSession.user, profile));
      }
    } catch (error) {
      console.error("[Auth] Error during initialization:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, loadUserProfile]);

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("[Auth] State change:", event);

        if (currentSession?.user) {
          const profile = await loadUserProfile(currentSession.user.id);
          setSession(currentSession);
          setUser(mapSupabaseUserToUserAuth(currentSession.user, profile));
        } else {
          setSession(null);
          setUser(null);
        }

        if (event === "SIGNED_OUT") {
          router.push("/login");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, initializeAuth, loadUserProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const profile = await loadUserProfile(data.user.id);
      setSession(data.session);
      setUser(mapSupabaseUserToUserAuth(data.user, profile));
      
      router.refresh();
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/";
      router.push(redirect);
    }
  }, [supabase, router, loadUserProfile]);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      const profile = await loadUserProfile(data.user.id);
      setSession(data.session);
      setUser(mapSupabaseUserToUserAuth(data.user, profile));
      
      router.refresh();
      router.push("/");
    }
  }, [supabase, router, loadUserProfile]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setSession(null);
    setUser(null);
    router.refresh();
    router.push("/login");
  }, [supabase, router]);

  const updateUser = useCallback(async (newData: Partial<UserAuth>) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: newData.name,
        avatar_url: newData.avatarUrl,
        tax_id: newData.taxId,
        phone: newData.phone,
      })
      .eq("id", user.id);

    if (error) throw error;

    setUser((prev) => (prev ? { ...prev, ...newData } : null));
  }, [supabase, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
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
