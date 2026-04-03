"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Star } from "lucide-react";
import { Logo } from "../ui/Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  illustrationImage?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  illustrationImage = "https://i.pinimg.com/1200x/9f/5f/5c/9f5f5c0ecd4901309a949525fcb5105a.jpg", // Imagem da Escalação
}: AuthLayoutProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Lado Esquerdo - Visual (Oculto em Mobile) */}
      <div className="relative hidden w-1/2 lg:flex flex-col items-center justify-center p-12 overflow-hidden">
        {/* Imagem de Fundo HD */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center brightness-[0.4] contrast-125 scale-105"
          style={{ backgroundImage: `url('${illustrationImage}')` }}
        />
        
        {/* Gradientes de Estilo */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-transparent to-black/40" />
        <div className="absolute inset-0 z-10 bg-black/20" />

        {/* Conteúdo Inspiracional */}
        <div className="relative z-20 flex flex-col items-center text-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Logo Central (Desktop) - Só renderiza se for desktop para evitar conflito de layoutId */}
            {isDesktop && (
              <div className="mb-20 relative z-[100] cursor-pointer">
                <Logo className="text-4xl text-white hover:text-primary drop-shadow-2xl" />
              </div>
            )}
            
            <div className="flex flex-col items-center gap-6 mb-12">
               <Star className="h-10 w-10 text-primary animate-pulse" />
               <h2 className="font-display text-6xl xl:text-7xl text-white uppercase tracking-tighter italic font-black leading-none drop-shadow-2xl">
                  RUMO AO <br /> <span className="text-primary italic">HEXA</span>
               </h2>
            </div>
            
            <p className="text-white/80 text-lg xl:text-xl font-medium italic border-l-4 border-primary pl-6 py-2 text-left bg-black/30 backdrop-blur-sm rounded-r-lg">
               "A paixão pelo Brasil começa aqui. Vista a camisa. Viva o jogo."
            </p>
          </motion.div>
        </div>

        {/* Footer Badge */}
        <div className="absolute bottom-12 left-12 z-20 flex items-center gap-4 text-white/40">
           <div className="h-[2px] w-12 bg-white/20" />
           <p className="text-[10px] font-bold uppercase tracking-[0.5em]">Official Agon Member Access</p>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 lg:p-20 relative overflow-y-auto">
        <div className="w-full max-w-md relative z-10">
          {/* Logo Mobile / Small Desktop - Só renderiza se NÃO for desktop */}
          {!isDesktop && (
            <div className="lg:hidden flex justify-center mb-12 relative z-[100]">
              <Logo className="text-3xl text-foreground hover:text-primary" />
            </div>
          )}

          {/* Form Header */}
          <div className="mb-10">
            <h1 className="font-display text-4xl font-black uppercase italic tracking-tighter text-foreground leading-none mb-3">
              {title}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              {subtitle}
            </p>
          </div>

          {/* Render Slot */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
