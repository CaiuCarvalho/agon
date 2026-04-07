"use client";
import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Rafael Gonçalves",
    city: "Curitiba, PR",
    text: "Recebi minha camisa da Seleção em 2 dias aqui em Curitiba! A qualidade do tecido é excepcional, parece até a oficial. Já comprei mais duas!",
    stars: 5,
  },
  {
    name: "Mariana Costa",
    city: "Florianópolis, SC",
    text: "Fiz meu pedido de Floripa e chegou super rápido. O kit completo ficou perfeito pro meu filho. Atendimento nota 10!",
    stars: 5,
  },
  {
    name: "Lucas Ferreira",
    city: "Porto Alegre, RS",
    text: "Melhor loja de artigos esportivos que já comprei! O agasalho da Seleção é de altíssima qualidade. Entrega rápida aqui no Sul!",
    stars: 5,
  },
];

const Testimonials = () => {
  return (
    <section id="depoimentos" className="py-32 bg-muted/10">
      <div className="container mx-auto px-6 md:px-12">
        <SectionTitle 
          title="VOZ DA TORCIDA" 
          subtitle="Milhares de torcedores já vestem a nossa paixão" 
        />
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="glass-nike p-10 rounded-3xl shadow-nike border border-border/40 hover:scale-[1.02] transition-transform"
            >
              <div className="mb-6 flex gap-1">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-lg leading-relaxed text-foreground italic font-medium mb-8">
                "{t.text}"
              </p>
              <div className="pt-6 border-t border-border/30">
                <p className="font-display text-xl uppercase tracking-wider text-foreground">
                  {t.name}
                </p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-primary mt-1">
                  {t.city}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
