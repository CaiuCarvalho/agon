"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session) {
          router.replace("/");
          return;
        }
      } catch (error) {
        console.error("[Auth][SessionCheck]", error);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    checkSession();

    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse sua conta para continuar sua jornada"
    >
      <LoginForm
        onToggleToRegister={() => router.push("/cadastro")}
        onToggleToForgot={() => router.push("/forgot-password")}
      />
    </AuthLayout>
  );
}
