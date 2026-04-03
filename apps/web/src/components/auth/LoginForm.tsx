"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, ArrowRight, Lock, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onToggleToRegister: () => void;
  onToggleToForgot: () => void;
}

export function LoginForm({ onToggleToRegister, onToggleToForgot }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://agonimports.com/api";
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "E-mail ou senha incorretos.");
      }

      login(result.data.user, result.data.token);
      toast.success("Bem-vindo de volta, craque!");
    } catch (error: any) {
      toast.error(error.message || "Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
            Endereço de E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="seu@email.com.br"
              className="h-12 pl-10 bg-muted/20 border-border/50 focus:border-primary transition-all rounded-xl"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-[10px] uppercase font-bold text-destructive px-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
              Senha de Acesso
            </label>
            <button
              type="button"
              onClick={onToggleToForgot}
              className="text-[10px] uppercase font-black tracking-widest text-primary hover:text-primary/80 transition-all hover:underline"
            >
              Recuperar Senha
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="••••••••"
              className="h-12 pl-10 bg-muted/20 border-border/50 focus:border-primary transition-all rounded-xl"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-[10px] uppercase font-bold text-destructive px-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-primary text-primary-foreground font-display text-xl uppercase italic font-black tracking-widest rounded-xl hover:scale-[1.02] shadow-neon active:scale-95 transition-all mt-6"
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <span className="flex items-center gap-3">
              Entrar na Conta <ArrowRight className="h-5 w-5" />
            </span>
          )}
        </Button>
      </form>

      <div className="text-center pt-8 border-t border-border/20">
        <p className="text-sm text-muted-foreground mb-4 font-medium italic">
          "O hexa não espera. Entre agora para garantir seu manto."
        </p>
        <div className="h-px w-20 bg-muted/30 mx-auto mb-6" />
        <button
          onClick={onToggleToRegister}
          className="text-[11px] uppercase font-black tracking-[0.2em] text-foreground hover:text-primary transition-all hover:tracking-[0.25em]"
        >
          Não tem conta? <span className="text-primary italic">Cadastre-se Aqui</span>
        </button>
      </div>
    </div>
  );
}
