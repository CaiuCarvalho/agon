"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, ArrowRight } from "lucide-react";
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
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export function ForgotPasswordForm({ onSuccess, onBack }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordValues) {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erro ao solicitar recuperação.");
      }

      toast.success("Código enviado! Verifique seu e-mail.");
      onSuccess(data.email);
    } catch (error) {
      toast.error("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                E-mail da Conta
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="seu@email.com" 
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
              Enviar Código
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          Voltar para o login
        </button>
      </form>
    </Form>
  );
}
