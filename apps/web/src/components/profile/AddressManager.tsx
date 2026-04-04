"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressForm } from "@/components/profile/AddressForm";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Address {
  id: string;
  userId: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddressFormValues {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

interface AddressManagerProps {
  userId: string;
}

export function AddressManager({ userId }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAddresses(
        data.map((addr: any) => ({
          id: addr.id,
          userId: addr.user_id,
          zipCode: addr.zip_code,
          street: addr.street,
          number: addr.number,
          complement: addr.complement,
          neighborhood: addr.neighborhood,
          city: addr.city,
          state: addr.state,
          isDefault: addr.is_default,
          createdAt: addr.created_at,
          updatedAt: addr.updated_at,
        }))
      );
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Erro ao carregar endereços");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle create address
  const handleCreate = async (data: AddressFormValues) => {
    if (addresses.length >= 5) {
      toast.error("Você atingiu o limite de 5 endereços");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticAddress: Address = {
      id: tempId,
      userId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    setAddresses((prev) => [...prev, optimisticAddress]);
    setIsSubmitting(true);

    try {
      // If setting as default, unset previous default
      if (data.isDefault) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", userId)
          .eq("is_default", true);
      }

      const { data: newAddress, error } = await supabase
        .from("addresses")
        .insert({
          user_id: userId,
          zip_code: data.zipCode,
          street: data.street,
          number: data.number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          is_default: data.isDefault,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp with real
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === tempId
            ? {
                id: newAddress.id,
                userId: newAddress.user_id,
                zipCode: newAddress.zip_code,
                street: newAddress.street,
                number: newAddress.number,
                complement: newAddress.complement,
                neighborhood: newAddress.neighborhood,
                city: newAddress.city,
                state: newAddress.state,
                isDefault: newAddress.is_default,
                createdAt: newAddress.created_at,
                updatedAt: newAddress.updated_at,
              }
            : addr
        )
      );

      toast.success("Endereço adicionado com sucesso!");
      setIsFormOpen(false);
    } catch (error) {
      // Rollback on failure
      setAddresses((prev) => prev.filter((addr) => addr.id !== tempId));
      toast.error("Erro ao adicionar endereço");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update address
  const handleUpdate = async (data: AddressFormValues) => {
    if (!editingAddress) return;

    const previousAddresses = [...addresses];
    const previousData = { ...editingAddress };

    // Optimistic update
    setAddresses((prev) =>
      prev.map((addr) =>
        addr.id === editingAddress.id ? { ...addr, ...data } : addr
      )
    );
    setIsSubmitting(true);

    try {
      // If setting as default, unset previous default
      if (data.isDefault && !editingAddress.isDefault) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", userId)
          .eq("is_default", true);
      }

      const { error } = await supabase
        .from("addresses")
        .update({
          zip_code: data.zipCode,
          street: data.street,
          number: data.number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          is_default: data.isDefault,
        })
        .eq("id", editingAddress.id);

      if (error) throw error;

      toast.success("Endereço atualizado com sucesso!");
      setIsFormOpen(false);
      setEditingAddress(null);
    } catch (error) {
      // Rollback on failure
      setAddresses(previousAddresses);
      toast.error("Erro ao atualizar endereço");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete address
  const handleDelete = async (id: string) => {
    const previousAddresses = [...addresses];

    // Optimistic update
    setAddresses((prev) => prev.filter((addr) => addr.id !== id));
    setDeleteDialogOpen(false);
    setAddressToDelete(null);

    try {
      const { error } = await supabase.from("addresses").delete().eq("id", id);

      if (error) throw error;

      toast.success("Endereço removido com sucesso!");
    } catch (error) {
      // Rollback on failure
      setAddresses(previousAddresses);
      toast.error("Erro ao remover endereço");
      console.error(error);
    }
  };

  // Handle set default address
  const handleSetDefault = async (id: string) => {
    const previousAddresses = [...addresses];

    // Optimistic update
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );

    try {
      // Unset previous default
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId)
        .eq("is_default", true);

      // Set new default
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      toast.success("Endereço padrão atualizado!");
    } catch (error) {
      // Rollback on failure
      setAddresses(previousAddresses);
      toast.error("Erro ao definir endereço padrão");
      console.error(error);
    }
  };

  // Open form for editing
  const openEditForm = (address: Address) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  // Open form for creating
  const openCreateForm = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  // Close form
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
  };

  // Open delete dialog
  const openDeleteDialog = (id: string) => {
    setAddressToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Card className="border-border/40 shadow-lg">
        <CardHeader className="border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-display uppercase tracking-wider">
              Meus Endereços
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={openCreateForm}
              disabled={addresses.length >= 5}
              className="uppercase font-bold tracking-widest text-xs"
            >
              <Plus className="h-3 w-3 mr-2" />
              Adicionar
            </Button>
          </div>
          {addresses.length >= 5 && (
            <p className="text-xs text-muted-foreground mt-2">
              Limite de 5 endereços atingido
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-lg font-display uppercase tracking-wider mb-2">
                Nenhum Endereço
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Adicione um endereço de entrega para seus pedidos Agon
              </p>
              <Button
                onClick={openCreateForm}
                className="uppercase font-bold tracking-widest text-xs"
              >
                <Plus className="h-3 w-3 mr-2" />
                Adicionar Endereço
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="p-4 rounded-lg border border-border/40 bg-card hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {address.isDefault && (
                          <Badge
                            variant="default"
                            className="text-[8px] uppercase font-black px-1.5 py-0"
                          >
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-bold mb-1">
                        {address.street}, {address.number}
                        {address.complement && ` - ${address.complement}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {address.neighborhood}, {address.city} - {address.state}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CEP: {address.zipCode}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                          className="h-8 px-2 text-[9px] uppercase font-black"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Padrão
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(address)}
                        className="h-8 px-2"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(address.id)}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Form Modal */}
      <AddressForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSave={editingAddress ? handleUpdate : handleCreate}
        initialData={
          editingAddress
            ? {
                zipCode: editingAddress.zipCode,
                street: editingAddress.street,
                number: editingAddress.number,
                complement: editingAddress.complement,
                neighborhood: editingAddress.neighborhood,
                city: editingAddress.city,
                state: editingAddress.state,
                isDefault: editingAddress.isDefault,
              }
            : undefined
        }
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase tracking-wider">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este endereço? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="uppercase font-bold tracking-widest text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => addressToDelete && handleDelete(addressToDelete)}
              className="uppercase font-bold tracking-widest text-xs bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
