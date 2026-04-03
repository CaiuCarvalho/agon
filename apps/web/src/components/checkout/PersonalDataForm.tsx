"use client";

import { UserProfile } from "@/lib/utils";
import { maskCPF, maskPhone } from "@/utils/validation";

interface PersonalDataFormProps {
  userProfile: UserProfile | null;
  formData: {
    taxId: string;
    phone: string;
  };
  onChange: (field: "taxId" | "phone", value: string) => void;
}

export function PersonalDataForm({ userProfile, formData, onChange }: PersonalDataFormProps) {
  const isMissingTaxId = !userProfile?.taxId;
  const isMissingPhone = !userProfile?.phone;

  if (!isMissingTaxId && !isMissingPhone) return null;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black italic shadow-[0_0_15px_rgba(0,156,59,0.1)]">
          01
        </div>
        <div>
          <h2 className="text-2xl font-display uppercase italic font-black tracking-tighter">DADOS DE <span className="text-primary">FATURAMENTO</span></h2>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">Informações Obrigatórias para Nota Fiscal</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card/30 backdrop-blur-md p-8 rounded-3xl border border-border/40 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors duration-1000" />
        
        {isMissingTaxId && (
          <div className="space-y-3 relative z-10">
            <label className="text-[10px] uppercase font-black text-primary tracking-[0.3em] ml-1">CPF para Nota Fiscal</label>
            <input 
              type="text"
              placeholder="000.000.000-00"
              value={formData.taxId}
              onChange={(e) => onChange("taxId", maskCPF(e.target.value))}
              className="w-full bg-background/50 border-border/40 rounded-2xl h-14 px-5 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground font-body font-bold placeholder:text-muted-foreground/30 hover:border-primary/50"
            />
          </div>
        )}
        {isMissingPhone && (
          <div className="space-y-3 relative z-10">
            <label className="text-[10px] uppercase font-black text-primary tracking-[0.3em] ml-1">Telefone / WhatsApp</label>
            <input 
              type="text"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={(e) => onChange("phone", maskPhone(e.target.value))}
              className="w-full bg-background/50 border-border/40 rounded-2xl h-14 px-5 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground font-body font-bold placeholder:text-muted-foreground/30 hover:border-primary/50"
            />
          </div>
        )}
      </div>
    </section>
  );
}
