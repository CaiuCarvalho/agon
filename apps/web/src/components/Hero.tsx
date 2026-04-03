"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative w-full h-screen min-h-[700px] flex items-center overflow-hidden bg-black">

      {/* Imagem de Fundo de Alto Impacto */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105 animate-slow-zoom"
        style={{
          backgroundImage: "url('https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/54298352151_7c2fffd8cc_k.jpg')",
        }}
      />

      {/* Overlays Estilo Nike/CBF */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
      <div className="absolute inset-0 z-10 bg-black/20" />

      {/* Conteúdo Centralizado à Esquerda (Estilo Nike) */}
      <div className="relative z-20 w-full container mx-auto px-6 md:px-12 flex flex-col items-start pt-20">

        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="h-[2px] w-12 bg-primary" />
            <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs md:text-sm">
              Official Agon Collection 24/25
            </span>
          </div>

          <h1 className="font-display text-[12vw] md:text-[10rem] lg:text-[13rem] text-foreground tracking-tighter leading-[0.75] mb-8 uppercase italic font-black drop-shadow-2xl">
            PELA <br /> <span className="text-primary">ALMA</span> <br /> DO HEXA
          </h1>

          <p className="text-foreground/80 max-w-lg text-lg md:text-xl font-medium mb-12 border-l-4 border-primary pl-6 py-2">
            A nova armadura da Seleção chegou. Tecnologia de elite para quem carrega o orgulho de cinco estrelas no peito.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <Link
              href="/#produtos"
              className="group relative inline-flex h-16 items-center justify-center overflow-hidden rounded-full bg-primary px-12 font-display text-2xl uppercase tracking-widest text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,156,59,0.3)]"
            >
              <span className="relative z-10 flex items-center gap-3">
                GARANTIR A MINHA
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>

            <button className="flex items-center gap-4 text-foreground/70 hover:text-primary transition-all group font-bold uppercase tracking-widest text-xs">
              <div className="h-12 w-12 rounded-full border border-foreground/20 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-all">
                <Play className="h-5 w-5 fill-current" />
              </div>
              Ver o Filme
            </button>
          </div>
        </motion.div>
      </div>

      {/* Decorative Badge */}
      <div className="absolute bottom-12 right-12 z-20 hidden lg:block">
        <div className="flex flex-col items-end">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted-foreground mb-1">Born to play</p>
          <div className="h-1 w-24 bg-gradient-brasil" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes slow-zoom {
          from { transform: scale(1.05); }
          to { transform: scale(1.15); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s infinite alternate ease-in-out;
        }
      `}</style>
    </section>
  );
}
