"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

const addressSchema = z.object({
  zipCode: z.string().length(8, "CEP deve ter 8 dígitos"),
  street: z.string().min(3, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "UF deve ter 2 caracteres"),
  isDefault: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddressFormValues) => Promise<void>;
  initialData?: any;
  isLoading: boolean;
}

export function AddressForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData || {
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      isDefault: false,
    },
  });

  const zipCode = watch("zipCode");

  // CEP Lookup
  useEffect(() => {
    if (zipCode?.length === 8) {
      const fetchAddress = async () => {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
          const data = await res.json();
          if (!data.erro) {
            setValue("street", data.logradouro);
            setValue("neighborhood", data.bairro);
            setValue("city", data.localidade);
            setValue("state", data.uf);
          }
        } catch (error) {
          console.error("Erro ao buscar CEP:", error);
        }
      };
      fetchAddress();
    }
  }, [zipCode, setValue]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        zipCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        isDefault: false,
      });
    }
  }, [initialData, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2 text-primary">
            <MapPin className="h-5 w-5" />
            <DialogTitle className="text-xl font-display uppercase tracking-wider">
              {initialData ? "Editar Endereço" : "Novo Endereço"}
            </DialogTitle>
          </div>
          <DialogDescription>
            Insira os detalhes do endereço para entrega dos seus mantos Agon.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSave)} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                CEP (Apenas números)
              </Label>
              <Input
                id="zipCode"
                placeholder="00000000"
                {...register("zipCode")}
                maxLength={8}
                className={errors.zipCode ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.zipCode && <p className="text-[10px] text-destructive uppercase font-bold">{errors.zipCode.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Estado (UF)
              </Label>
              <Input
                id="state"
                placeholder="SP"
                {...register("state")}
                maxLength={2}
                className={errors.state ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.state && <p className="text-[10px] text-destructive uppercase font-bold">{errors.state.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Rua / Logradouro
            </Label>
            <Input
              id="street"
              placeholder="Ex: Av. Brasil"
              {...register("street")}
              className={errors.street ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.street && <p className="text-[10px] text-destructive uppercase font-bold">{errors.street.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Número
              </Label>
              <Input
                id="number"
                placeholder="123"
                {...register("number")}
                className={errors.number ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.number && <p className="text-[10px] text-destructive uppercase font-bold">{errors.number.message}</p>}
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="complement" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Complemento (Opcional)
              </Label>
              <Input
                id="complement"
                placeholder="Apto 101, Bloco A"
                {...register("complement")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="neighborhood" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Bairro
              </Label>
              <Input
                id="neighborhood"
                placeholder="Centro"
                {...register("neighborhood")}
                className={errors.neighborhood ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.neighborhood && <p className="text-[10px] text-destructive uppercase font-bold">{errors.neighborhood.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Cidade
              </Label>
              <Input
                id="city"
                placeholder="São Paulo"
                {...register("city")}
                className={errors.city ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.city && <p className="text-[10px] text-destructive uppercase font-bold">{errors.city.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isDefault"
              className="h-4 w-4 rounded border-border bg-muted text-primary focus:ring-primary"
              {...register("isDefault")}
            />
            <Label htmlFor="isDefault" className="text-xs uppercase tracking-widest font-bold cursor-pointer">
              Definir como endereço padrão
            </Label>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="uppercase font-bold tracking-widest text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="uppercase font-bold tracking-widest text-xs min-w-[120px]"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Endereço"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
