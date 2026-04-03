"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const BANNERS = [
  {
    id: "camisas",
    title: "Mantos Sagrados",
    subtitle: "A Armadura Oficial",
    image: "https://i.pinimg.com/1200x/b2/93/29/b29329a7386766f60049071c77f0a8d6.jpg",
    link: "/#produtos",
    colSpan: "col-span-1 md:col-span-2",
  },
  {
    id: "treino",
    title: "Performance",
    subtitle: "Treine como Elite",
    image: "https://i.pinimg.com/1200x/87/44/2c/87442c51080ca373708e2f6946059c25.jpg",
    link: "/#produtos",
    colSpan: "col-span-1",
  },
  {
    id: "chuteiras",
    title: "Velocidade",
    subtitle: "Domine o Gramado",
    image: "https://i.pinimg.com/1200x/63/05/1e/63051efe298642e47264878a846c4f02.jpg",
    link: "/#produtos",
    colSpan: "col-span-1",
  },
  {
    id: "acessorios",
    title: "Acessórios",
    subtitle: "DNA Brasileiro",
    image: "https://i.pinimg.com/1200x/31/85/0b/31850b5550a1fe7960352ef9cacc8e51.jpg",
    link: "/#produtos",
    colSpan: "col-span-1 md:col-span-2",
  },
];

export default function CategoryBanners() {
  return (
    <section id="categorias" className="w-full bg-background pt-24 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col mb-16 max-w-2xl">
          <p className="text-primary font-black uppercase tracking-[0.4em] text-xs mb-4">Categorias em Destaque</p>
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground uppercase tracking-tighter italic font-black leading-none">
            ESCOLHA SEU <br /> <span className="text-primary">CAMINHO</span>
          </h2>
          <div className="h-2 w-24 bg-primary mt-8" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px] md:auto-rows-[450px]">
          {BANNERS.map((banner, index) => (
            <Link
              key={banner.id}
              href={banner.link}
              className={`group relative overflow-hidden rounded-3xl ${banner.colSpan} shadow-nike transition-transform hover:scale-[1.01]`}
            >
              <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                className="w-full h-full"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-110"
                  style={{ backgroundImage: `url('${banner.image}')` }}
                />
                
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent transition-opacity duration-700 opacity-60 group-hover:opacity-80" />
                <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/40 rounded-3xl transition-all duration-500" />
                
                <div className="absolute bottom-0 left-0 w-full p-10 flex flex-col justify-end h-full">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-secondary font-black tracking-[0.3em] uppercase text-[10px] mb-2">
                       {banner.subtitle}
                    </p>
                    <h3 className="font-display text-4xl md:text-5xl text-white uppercase tracking-tighter italic mb-6">
                      {banner.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-3 text-white font-bold uppercase tracking-widest text-xs opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                    Explorar Agora
                    <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center -rotate-45 group-hover:rotate-0 transition-transform duration-500">
                       →
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
