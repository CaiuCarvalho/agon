"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressForm } from "@/components/profile/AddressForm";
import { addressService } from "@/modules/address/services/addressService";
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
import { getErrorMessage } from "@/lib/utils/errorMessages";

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

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const addresses = await addressService.getAddresses(userId);
      setAddresses(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Erro ao carregar endereços");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle create address
  const handleCreate = async (data: AddressFormValues) => {
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
    
    try {
      setIsSubmitting(true);

      const newAddress = await addressService.createAddress(userId, data);

      // Replace temp with real
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === tempId ? newAddress : addr
        )
      );

      toast.success("Endereço adicionado com sucesso!");
      setIsFormOpen(false);
    } catch (error: any) {
      // Rollback on failure
      setAddresses((prev) => prev.filter((addr) => addr.id !== tempId));
      console.error("Error creating address:", error);
      toast.error(getErrorMessage(error));
    } finally {
      // CRITICAL: Always reset submitting state
      setIsSubmitting(false);
    }
  };

  // Handle update address
  const handleUpdate = async (data: AddressFormValues) => {
    if (!editingAddress) return;

    const previousAddresses = [...addresses];

    // Optimistic update
    setAddresses((prev) =>
      prev.map((addr) =>
        addr.id === editingAddress.id ? { ...addr, ...data } : addr
      )
    );
    
    try {
      setIsSubmitting(true);

      await addressService.updateAddress(userId, editingAddress.id, data);

      toast.success("Endereço atualizado com sucesso!");
      setIsFormOpen(false);
      setEditingAddress(null);
    } catch (error: any) {
      // Rollback on failure
      setAddresses(previousAddresses);
      console.error("Error updating address:", error);
      toast.error(getErrorMessage(error));
    } finally {
      // CRITICAL: Always reset submitting state
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
      await addressService.deleteAddress(userId, id);
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
      await addressService.setDefaultAddress(userId, id);
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
