"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, UserPlus, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const registerSchema = z
  .object({
    name: z.string().min(3, "O nome completo precisa ter pelo menos 3 caracteres"),
    email: z.string().email("Formato de e-mail inválido"),
    password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onToggleToLogin: () => void;
}

export function RegisterForm({ onToggleToLogin }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);

    try {
      const { data: result } = await api.post("/api/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      toast.success("Bem-vindo à Torcida Agon! Aproveite seu manto.");

      if (result?.token) {
        login(result.user, result.token);
      } else {
        setTimeout(onToggleToLogin, 1500);
      }

    } catch (error: any) {
      toast.error(error.message || "Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
            Nome Completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pelé Arantes do Nascimento"
              className="h-12 pl-10 bg-muted/20 border-border/50 focus:border-primary transition-all rounded-xl"
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="text-[10px] uppercase font-bold text-destructive px-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
            E-mail de Acesso
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                className="h-12 pl-10 bg-muted/20 border-border/50 focus:border-primary transition-all rounded-xl"
                {...register("password")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
              Confirmar
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                className="h-12 pl-10 bg-muted/20 border-border/50 focus:border-primary transition-all rounded-xl"
                {...register("confirmPassword")}
              />
            </div>
          </div>
        </div>
        {(errors.password || errors.confirmPassword) && (
          <p className="text-[10px] uppercase font-bold text-destructive px-1">
            {errors.password?.message || errors.confirmPassword?.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-primary text-primary-foreground font-display text-xl uppercase italic font-black tracking-widest rounded-xl hover:scale-[1.02] shadow-neon active:scale-95 transition-all mt-6"
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <span className="flex items-center gap-3">
              Criar Conta e Prosseguir <ArrowRight className="h-5 w-5" />
            </span>
          )}
        </Button>
      </form>

      <div className="text-center pt-8 border-t border-border/20">
        <button
          onClick={onToggleToLogin}
          className="text-[11px] uppercase font-black tracking-[0.2em] text-foreground hover:text-primary transition-all hover:tracking-[0.25em]"
        >
          Já faz parte da torcida? <span className="text-primary italic">Entrar Agora</span>
        </button>
      </div>
    </div>
  );
}
