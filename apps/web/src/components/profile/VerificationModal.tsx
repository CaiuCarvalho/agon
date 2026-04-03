"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (token: string) => Promise<void>;
  type: "EMAIL_UPDATE" | "TAXID_UPDATE" | null;
  isLoading: boolean;
}

export function VerificationModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  isLoading,
}: VerificationModalProps) {
  const [token, setToken] = useState("");

  const label = type === "EMAIL_UPDATE" ? "alteração de e-mail" : "alteração de CPF";
  const icon = type === "EMAIL_UPDATE" ? <Mail className="h-6 w-6 text-primary" /> : <ShieldCheck className="h-6 w-6 text-primary" />;

  const handleConfirm = async () => {
    if (token.length !== 6) {
      toast.error("Por favor, insira o código de 6 dígitos.");
      return;
    }
    await onConfirm(token);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            {icon}
          </div>
          <DialogTitle className="text-xl font-display uppercase tracking-wider">
            Verificação de Segurança
          </DialogTitle>
          <DialogDescription className="text-center">
            Enviamos um código de confirmação para o seu e-mail atual. 
            Insira-o abaixo para confirmar a <strong>{label}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          <InputOTP
            maxLength={6}
            value={token}
            onChange={(val) => setToken(val)}
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-4">
            O código expira em 15 minutos
          </p>
        </div>

        <DialogFooter className="sm:justify-center gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="uppercase font-bold tracking-widest text-xs"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || token.length !== 6}
            className="uppercase font-bold tracking-widest text-xs min-w-[120px]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
