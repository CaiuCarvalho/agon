"use client";

import { useState } from "react";
import { Plus, Check, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShippingAddress } from "@/lib/utils";
import { maskCEP } from "@/utils/validation";

interface AddressSelectorProps {
  addresses: ShippingAddress[];
  selectedId: string;
  onSelect: (id: string) => void;
  showNewForm: boolean;
  setShowNewForm: (show: boolean) => void;
  newAddress: ShippingAddress;
  onNewAddressChange: (field: keyof ShippingAddress, value: string) => void;
  stepNumber: number;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  showNewForm,
  setShowNewForm,
  newAddress,
  onNewAddressChange,
  stepNumber
}: AddressSelectorProps) {
  const [cepLoading, setCepLoading] = useState(false);

  const fetchCepData = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        onNewAddressChange("street", data.logradouro);
        onNewAddressChange("neighborhood", data.bairro);
        onNewAddressChange("city", data.localidade);
        onNewAddressChange("state", data.uf);
      }
    } catch (err) {
      console.warn("Falha ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepChange = (value: string) => {
    const masked = maskCEP(value);
    onNewAddressChange("zipCode", masked);
    if (masked.length === 9) fetchCepData(masked);
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 ease-out">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black italic shadow-[0_0_15px_rgba(0,156,59,0.1)]">
            0{stepNumber}
          </div>
          <div>
            <h2 className="text-2xl font-display uppercase italic font-black tracking-tighter">ENDEREÇO DE <span className="text-primary">ENTREGA</span></h2>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">Onde enviaremos seu Manto</p>
          </div>
        </div>
        {addresses.length > 0 && !showNewForm && (
          <button 
            onClick={() => setShowNewForm(true)}
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-muted/20 border border-border/30 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-primary hover:text-white transition-all duration-300"
          >
            <Plus className="h-3 w-3 transition-transform group-hover:rotate-90" /> Novo Endereço
          </button>
        )}
      </div>

      <div className="space-y-6">
        {addresses.length > 0 && !showNewForm ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => onSelect(addr.id!)}
                className={`relative text-left p-6 rounded-3xl border-2 transition-all duration-500 group overflow-hidden ${
                  selectedId === addr.id 
                    ? "border-primary bg-primary/5 shadow-[0_0_30px_rgba(0,156,59,0.15)]" 
                    : "border-border/40 bg-card/20 hover:border-primary/30"
                }`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl transition-opacity duration-500 ${selectedId === addr.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                
                {selectedId === addr.id && (
                  <motion.div 
                    layoutId="active-address"
                    className="absolute top-4 right-4 h-6 w-6 bg-primary rounded-full flex items-center justify-center shadow-lg z-10"
                  >
                    <Check className="h-3.5 w-3.5 text-white" />
                  </motion.div>
                )}
                
                <p className="font-display text-xl uppercase italic font-black tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors">{addr.street}, {addr.number}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{addr.neighborhood}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">{addr.city} — {addr.state}</p>
                
                <div className="mt-4 pt-4 border-t border-border/20">
                  <span className="text-[10px] font-mono font-bold text-primary/60">{addr.zipCode}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-card/30 backdrop-blur-md p-8 rounded-3xl border border-border/40 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black text-primary tracking-[0.3em] ml-1">CEP</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="00000-000"
                    maxLength={9}
                    value={newAddress.zipCode}
                    onChange={(e) => handleCepChange(e.target.value)}
                    className="w-full bg-background/50 border-border/40 rounded-2xl h-14 px-5 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground font-body font-bold placeholder:text-muted-foreground/30"
                  />
                  <AnimatePresence>
                    {cepLoading && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute right-4 top-4.5"
                      >
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] uppercase font-black text-primary tracking-[0.3em] ml-1">Rua / Logradouro</label>
                <input 
                  type="text"
                  placeholder="Ex: Av. Brasil"
                  value={newAddress.street}
                  onChange={(e) => onNewAddressChange("street", e.target.value)}
                  className="w-full bg-background/50 border-border/40 rounded-2xl h-14 px-5 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground font-body font-bold placeholder:text-muted-foreground/30"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black text-primary tracking-[0.3em] ml-1">Número</label>
                <input 
                  type="text"
                  placeholder="123"
                  value={newAddress.number}
                  onChange={(e) => onNewAddressChange("number", e.target.value)}
                  className="w-full bg-background/50 border-border/40 rounded-2xl h-14 px-5 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground font-body font-bold placeholder:text-muted-foreground/30"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black text-primary tracking-[0.3em] ml-1">Complemento</label>
                <input 
                  type="text"
                  placeholder="Apt 42"
                  value={newAddress.complement || ""}
                  onChange={(e) => onNewAddressChange("complement", e.target.value)}
                  className="w-full bg-background/50 border-border/40 rounded-2xl h-14 px-5 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground font-body font-bold placeholder:text-muted-foreground/30"
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] uppercase font-black text-primary tracking-[0.3em] ml-1">Bairro</label>
                <input 
                  type="text"
                  placeholder="Ex: Centro"
                  value={newAddress.neighborhood}
                  onChange={(e) => onNewAddressChange("neighborhood", e.target.value)}
                  className="w-full bg-background/50 border-border/40 rounded-2xl h-14 px-5 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground font-body font-bold placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            {addresses.length > 0 && (
              <button 
                onClick={() => setShowNewForm(false)}
                className="mt-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                type="button"
              >
                <ArrowLeft className="h-3 w-3" /> Cancelar e usar endereço salvo
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
