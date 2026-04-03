"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/Hero";
import CategoryBanners from "@/components/CategoryBanners";
import ProductCard from "@/components/ProductCard";
import Testimonials from "@/components/Testimonials";
import { Truck, ShieldCheck, RefreshCcw, Zap, Star, Users } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

// Imagens migradas para /public/images/
const images = {
  jersey: "/images/products/product-jersey.jpg",
  scarf: "/images/products/product-scarf.jpg",
  shorts: "/images/products/product-shorts.jpg",
  ball: "/images/products/product-ball.jpg",
  structure: "/images/ui/structure_of_a_champion.png",
  pele: "/images/history/pele_celebration.png",
};

const featuredProducts = [
  { id: "1", image: images.jersey, title: "Manto Titular 24/25 I", price: 349.90, badge: "Lançamento", category: "Match Jersey" },
  { id: "2", image: images.scarf, title: "Jaqueta Anthem Brasil", price: 499.90, category: "Lifestyle" },
  { id: "3", image: images.shorts, title: "Shorts Oficial Strike", price: 199.90, category: "Treino" },
  { id: "4", image: images.ball, title: "Bola Profissional CBF", price: 149.90, badge: "Exclusivo", category: "Equipamentos" },
];

export default function Home() {
  const legacyRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: legacyRef,
    offset: ["start end", "end start"]
  });

  const yPos = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <main className="bg-background overflow-x-hidden">
      <Hero />

      {/* Trust Bar - Nike Style */}
      <section className="bg-muted/30 border-y border-border/50 py-10">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest">Frete Grátis Sul/Sudeste</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest">Pagamento 100% Seguro</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <RefreshCcw className="h-6 w-6 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest">Troca Grátis em 30 dias</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest">Envio Rumo ao Hexa</p>
          </div>
        </div>
      </section>

      <CategoryBanners />

      {/* Destaques Limpos - Flow Nike */}
      <section id="produtos" className="py-32 bg-background">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col mb-16 max-w-2xl">
            <p className="text-primary font-black uppercase tracking-[0.4em] text-xs mb-4">Elite Collection</p>
            <h2 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground uppercase tracking-tighter italic font-black leading-none">
              EQUIPAMENTO <br /> DE <span className="text-primary">SELEÇÃO</span>
            </h2>
            <div className="h-2 w-24 bg-primary mt-8" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {featuredProducts.map((product) => (
              <ProductCard key={product.title} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Padrão de Elite - Troféu (Imagem 3 em HD) */}
      <section className="py-32 bg-muted/10">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative group overflow-hidden rounded-[2rem]">
              <Image
                src={images.structure}
                alt="Elite Trophy"
                fill
                className="object-cover scale-105 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-10 left-10">
                <p className="text-white font-black uppercase tracking-[0.5em] text-[10px]">Agon Prestige</p>
                <div className="h-1 w-20 bg-primary mt-2" />
              </div>
            </div>
            <div className="space-y-8">
              <h2 className="font-display text-5xl md:text-7xl text-foreground uppercase tracking-tighter italic font-black leading-none">
                ESTRUTURA <br /> DE UM <span className="text-primary">CAMPEÃO</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Cada detalhe de nossos produtos é pensado para quem não aceita nada menos que a excelência. Do corte anatômico à tecnologia de transpiração, o padrão Agon é o padrão do topo do mundo.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-black uppercase tracking-widest text-xs text-primary mb-2">Performance</h4>
                  <p className="text-xs text-muted-foreground">Tecidos de alta absorção testados por atletas profissionais.</p>
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-widest text-xs text-primary mb-2">Prestigio</h4>
                  <p className="text-xs text-muted-foreground">Design exclusivo que celebra o peso da camisa amarela.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legado Eterno - Pelé (Imagem 5 em HD com Parallax) */}
      <section ref={legacyRef} className="relative h-[90vh] flex items-center overflow-hidden bg-black group">
        <motion.div
          style={{ y: yPos }}
          className="absolute inset-0 z-0 bg-cover bg-center grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-1000 scale-125"
          initial={false}
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${images.pele})` }}
          />
        </motion.div>

        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-transparent to-black/60" />

        <div className="container relative z-20 mx-auto px-6 md:px-12 flex flex-col items-center text-center">
          <Star className="h-12 w-12 text-primary mb-8" />
          <h2 className="font-display text-6xl md:text-8xl lg:text-[10rem] text-white uppercase tracking-tighter italic font-black leading-none mb-10">
            HERANÇA <br /> <span className="text-primary italic">AGON</span>
          </h2>
          <p className="text-white/70 max-w-2xl text-lg md:text-xl font-medium mb-12 italic">
            &quot;Para ser um campeão, você tem que acreditar em si mesmo quando ninguém mais acredita.&quot; &mdash; Honrando a majestade do futebol.
          </p>
          <div className="h-px w-40 bg-white/20" />
        </div>
      </section>

      {/* NOVO: Herança & Comunidade (Seção Unificada) */}
      <section className="relative w-full py-32 overflow-hidden bg-background border-t border-border/10">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            {/* Lado Esquerdo: Visual Impact */}
            <div className="w-full lg:w-1/2 relative group">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden relative shadow-2xl">
                <Image 
                  src="https://res.cloudinary.com/dbcy4h37x/image/upload/v1775188055/brjlfom8l0fuwbsntx8s.jpg" 
                  alt="Agon Heritage & Community" 
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Elite Agon</span>
                  </div>
                  <h3 className="text-white font-display text-3xl md:text-4xl uppercase italic tracking-tighter leading-none">
                    União que <span className="text-primary">Vence</span>
                  </h3>
                </div>
              </div>
              {/* Floating Badge Style Nike */}
              <div className="absolute -top-6 -right-6 h-24 w-24 bg-primary text-white flex items-center justify-center rounded-3xl rotate-12 shadow-xl border-4 border-background">
                <Star className="h-10 w-10 fill-current" />
              </div>
            </div>

            {/* Lado Direito: Messaging */}
            <div className="w-full lg:w-1/2 space-y-10">
              <div className="space-y-4">
                <p className="text-primary font-black uppercase tracking-[0.4em] text-xs">A Nossa Essência</p>
                <h2 className="font-display text-5xl md:text-7xl text-foreground uppercase tracking-tighter italic font-black leading-[0.9]">
                  VIVA A HISTÓRIA, <br /> SEJA A <span className="text-primary">ELITE</span>
                </h2>
              </div>
              
              <div className="space-y-6">
                <p className="text-muted-foreground text-lg italic leading-relaxed border-l-2 border-primary/30 pl-6">
                  Dos campos de várzea ao topo do mundo. A Agon celebra a garra brasileira com produtos que carregam nossa história em cada fibra. Acreditamos na força da união entre quem joga, quem torce e quem vive o futebol 24 horas por dia.
                </p>
                <p className="text-muted-foreground/80 text-sm">
                  Cada título é conquistado no coletivo. Junte-se a milhares de membros da elite que já respiram o padrão Agon de excelência.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <Link 
                  href="/cadastro"
                  className="inline-flex items-center justify-center h-14 px-10 bg-primary text-white font-display text-xl uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-lg hover:shadow-primary/20"
                >
                  Junte-se à Elite
                </Link>
                <button className="h-14 px-10 border border-border text-foreground font-display text-xl uppercase tracking-widest rounded-full hover:bg-muted transition-all">
                  Nossa Jornada
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mini Banner: Rumos a 2026 (Imagem 1 HD) */}
      <section className="py-20 bg-muted/5 border-b border-border/20">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-10 text-center md:text-left">
            <div className="relative h-28 w-40">
              <Image 
                src="https://res.cloudinary.com/dbcy4h37x/image/upload/v1775188056/ikq1whvviiqvpsoiuxpp.jpg" 
                className="invert brightness-0 object-contain" 
                fill
                alt="2026 Logo" 
              />
            </div>
            <div>
              <p className="text-primary font-black uppercase tracking-widest text-xs mb-1">Coming Next</p>
              <h3 className="text-3xl font-display font-black uppercase tracking-tighter italic leading-none">O FUTURO <br /> É AGORA</h3>
            </div>
          </div>
          <p className="text-muted-foreground text-sm max-w-sm text-center md:text-left leading-relaxed">
            Agon já está preparando a coleção oficial para o maior espetáculo da Terra em 2026. Tecnologia NASA, alma brasileira. Esteja pronto.
          </p>
        </div>
      </section>

      <Testimonials />
    </main>
  );
}
