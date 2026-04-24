"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { AuthContext } from "./auth-context";
import type { UserAuth } from "./auth-context";

export type { UserAuth };

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
  const queryClient = useQueryClient();
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
        if (currentSession?.user) {
          const profile = await loadUserProfile(currentSession.user.id);
          setSession(currentSession);
          setUser(mapSupabaseUserToUserAuth(currentSession.user, profile));
        } else {
          setSession(null);
          setUser(null);
        }

        if (event === "SIGNED_OUT") {
          queryClient.clear();
          router.push("/login");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, initializeAuth, loadUserProfile, queryClient]);

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
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: appUrl ? `${appUrl}/auth/callback?next=/perfil` : undefined,
        data: {
          name,
        },
      },
    });

    if (error) throw error;

    if (data.session?.user) {
      const profile = await loadUserProfile(data.session.user.id);
      setSession(data.session);
      setUser(mapSupabaseUserToUserAuth(data.session.user, profile));
      
      router.refresh();
      router.push("/perfil");
      return { requiresEmailConfirmation: false };
    }

    if (data.user) {
      const profile = await loadUserProfile(data.user.id);
      setSession(null);
      setUser(mapSupabaseUserToUserAuth(data.user, profile));

      return { requiresEmailConfirmation: true };
    }

    return { requiresEmailConfirmation: false };
  }, [supabase, router, loadUserProfile]);

  const logout = useCallback(async () => {
    const clearClientState = async () => {
      setSession(null);
      setUser(null);
      await queryClient.cancelQueries();
      queryClient.clear();
      router.push("/login");
      router.refresh();
    };

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        throw error;
      }

      await clearClientState();
    } catch (error) {
      console.error("Failed to logout:", error);
      // Force logout even if API call fails
      await clearClientState();
    }
  }, [supabase, router, queryClient]);

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

export { useAuthContext } from "./auth-context";
