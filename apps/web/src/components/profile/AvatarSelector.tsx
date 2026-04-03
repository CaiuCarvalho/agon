"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CLASSIC_AVATARS, compressImage } from "@/lib/avatar-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => Promise<void>;
  currentAvatar?: string;
}

export function AvatarSelector({
  isOpen,
  onClose,
  onSelect,
  currentAvatar,
}: AvatarSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida.");
      return;
    }

    setIsLoading(true);
    try {
      // Compress client-side
      const compressed = await compressImage(file);
      await onSelect(compressed);
      toast.success("Avatar atualizado com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Erro ao processar imagem.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Classic Select
  const handleClassicSelect = async (url: string) => {
    setIsLoading(true);
    try {
      await onSelect(url);
      toast.success("Avatar clássico selecionado!");
      onClose();
    } catch (error) {
      toast.error("Erro ao atualizar avatar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display uppercase tracking-wider">
            Escolha seu Avatar
          </DialogTitle>
          <DialogDescription>
            Mostre sua paixão: use sua própria foto ou escolha uma lenda da Seleção.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-8 py-6">
          {/* Upload Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-muted/30 shadow-xl group-hover:border-primary/50 transition-all">
                <AvatarImage src={currentAvatar} />
                <AvatarFallback className="bg-muted text-2xl font-black">?</AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-4 border-background cursor-pointer hover:scale-110 transition-transform shadow-lg"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                <input 
                  id="avatar-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
              </label>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              Clique na câmera para upload
            </p>
          </div>

          {/* Classics Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground border-b border-border/40 pb-2">
              Avatares Clássicos Agon
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {CLASSIC_AVATARS.map((avatar) => {
                const isSelected = currentAvatar === avatar.url;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleClassicSelect(avatar.url)}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-2 group relative"
                  >
                    <div className={`relative h-20 w-20 rounded-2xl overflow-hidden border-2 transition-all ${
                      isSelected ? "border-primary scale-105 shadow-neon-tiny" : "border-border hover:border-primary/50"
                    }`}>
                      <img 
                        src={avatar.url} 
                        alt={avatar.name} 
                        className="h-full w-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-8 w-8 text-white drop-shadow-lg" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[9px] uppercase font-black tracking-widest text-center leading-tight opacity-70 group-hover:opacity-100">
                      {avatar.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="ghost" onClick={onClose} className="uppercase font-bold tracking-widest text-xs">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
