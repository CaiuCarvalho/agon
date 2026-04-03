"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";

const resetPasswordSchema = z.object({
  code: z.string().length(6, "O código deve ter 6 dígitos."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  confirmPassword: z.string().min(6, "Confirme sua senha."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  email: string;
  onBack: () => void;
}

export function ResetPasswordForm({ email, onBack }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { login } = useAuth();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordValues) {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: data.code,
          newPassword: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erro ao redefinir senha.");
      }

      setIsSuccess(true);
      toast.success("Senha redefinida com sucesso!");

      // Auto-login logic
      setTimeout(() => {
        login(result.data.token, result.data.user);
        toast.info("Acessando sua conta...");
      }, 1500);

    } catch (error: any) {
      toast.error(error.message || "Código inválido ou expirado.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-10 text-center"
      >
        <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-primary animate-bounce" />
        </div>
        <h2 className="font-display text-3xl font-black uppercase italic tracking-tighter text-foreground mb-4">
          SENHA ALTERADA!
        </h2>
        <p className="text-muted-foreground text-sm max-w-[280px]">
          Sua conta foi atualizada com sucesso. Estamos te conectando agora...
        </p>
      </motion.div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl mb-6">
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest text-center">
            Enviamos o código para: <span className="text-foreground">{email}</span>
          </p>
        </div>

        <FormField
          control={form.control}
          name="code"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                Código de 6 Dígitos
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="000000" 
                    maxLength={6}
                    autoComplete="one-time-code"
                    className="pl-11 h-12 bg-muted/20 border-border/50 focus:border-primary/50 text-center tracking-[0.5em] font-mono text-xl" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                Nova Senha de Elite
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="password"
                    placeholder="••••••••" 
                    className="pl-11 h-12 bg-muted/20 border-border/50 focus:border-primary/50" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                Confirmar Nova Senha
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="password"
                    placeholder="••••••••" 
                    className="pl-11 h-12 bg-muted/20 border-border/50 focus:border-primary/50" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-display text-xl uppercase tracking-[0.2em] italic transition-all group overflow-hidden"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              Redefinir e Acessar
              <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </span>
          )}
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          Cancelar e Voltar
        </button>
      </form>
    </Form>
  );
}
