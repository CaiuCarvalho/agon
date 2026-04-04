"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarSelector } from "@/components/profile/AvatarSelector";
import { validatePhone, validateCPF, maskPhone, maskCPF } from "@/utils/validation";
import { toast } from "sonner";
import { Pencil, Save, X, User } from "lucide-react";
import type { UserAuth } from "@/context/AuthContext";

interface ProfileEditorProps {
  user: UserAuth;
  onUpdate: (data: Partial<UserAuth>) => Promise<void>;
}

export function ProfileEditor({ user, onUpdate }: ProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    taxId: user.taxId || "",
  });

  // Validation errors
  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    taxId: "",
  });

  // Handle input changes with validation
  const handleChange = (field: keyof typeof formData, value: string) => {
    let processedValue = value;
    
    // Apply masks
    if (field === "phone") {
      processedValue = maskPhone(value);
    } else if (field === "taxId") {
      processedValue = maskCPF(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors = {
      name: "",
      phone: "",
      taxId: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Telefone inválido. Use formato (XX) XXXXX-XXXX";
    }

    if (formData.taxId && !validateCPF(formData.taxId)) {
      newErrors.taxId = "CPF inválido";
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.phone && !newErrors.taxId;
  };

  // Handle form submission with optimistic updates
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const previousData = { ...user };
    setIsLoading(true);

    try {
      // Optimistic UI update
      const updateData: Partial<UserAuth> = {
        name: formData.name,
        phone: formData.phone || undefined,
        taxId: formData.taxId || undefined,
      };

      await onUpdate(updateData);
      
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (error) {
      // Rollback on failure
      setFormData({
        name: previousData.name || "",
        phone: previousData.phone || "",
        taxId: previousData.taxId || "",
      });
      
      toast.error("Erro ao atualizar perfil. Tente novamente.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle avatar selection
  const handleAvatarSelect = async (avatarUrl: string) => {
    try {
      await onUpdate({ avatarUrl });
      // Success toast is handled by AvatarSelector
    } catch (error) {
      toast.error("Erro ao atualizar avatar.");
      throw error; // Re-throw so AvatarSelector can handle it
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
      taxId: user.taxId || "",
    });
    setErrors({ name: "", phone: "", taxId: "" });
    setIsEditing(false);
  };

  return (
    <>
      <Card className="border-border/40 shadow-lg">
        <CardHeader className="border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-display uppercase tracking-wider">
              Meu Perfil
            </CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="uppercase font-bold tracking-widest text-xs"
              >
                <Pencil className="h-3 w-3 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="relative group"
              type="button"
            >
              <Avatar className="h-24 w-24 border-4 border-muted/30 shadow-xl group-hover:border-primary/50 transition-all">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="bg-muted text-2xl font-black">
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Pencil className="h-6 w-6 text-white" />
              </div>
            </button>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              Clique para alterar avatar
            </p>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase font-bold tracking-widest">
                Nome
              </Label>
              {isEditing ? (
                <>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Seu nome completo"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </>
              ) : (
                <p className="text-sm py-2">
                  {user.name || <span className="text-muted-foreground italic">Não informado</span>}
                </p>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-widest">
                Email
              </Label>
              <p className="text-sm py-2 text-muted-foreground">{user.email}</p>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs uppercase font-bold tracking-widest">
                Telefone
              </Label>
              {isEditing ? (
                <>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </>
              ) : (
                <p className="text-sm py-2">
                  {user.phone || <span className="text-muted-foreground italic">Não informado</span>}
                </p>
              )}
            </div>

            {/* CPF Field */}
            <div className="space-y-2">
              <Label htmlFor="taxId" className="text-xs uppercase font-bold tracking-widest">
                CPF
              </Label>
              {isEditing ? (
                <>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleChange("taxId", e.target.value)}
                    placeholder="000.000.000-00"
                    className={errors.taxId ? "border-destructive" : ""}
                  />
                  {errors.taxId && (
                    <p className="text-xs text-destructive">{errors.taxId}</p>
                  )}
                </>
              ) : (
                <p className="text-sm py-2">
                  {user.taxId || <span className="text-muted-foreground italic">Não informado</span>}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 uppercase font-bold tracking-widest text-xs"
              >
                <Save className="h-3 w-3 mr-2" />
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 uppercase font-bold tracking-widest text-xs"
              >
                <X className="h-3 w-3 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelect={handleAvatarSelect}
        currentAvatar={user.avatarUrl}
      />
    </>
  );
}
