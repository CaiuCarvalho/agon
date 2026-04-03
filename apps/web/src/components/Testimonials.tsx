"use client";
import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Silva",
    city: "São Paulo, SP",
    text: "A camisa chegou em 3 dias e a qualidade é incrível! Material idêntico ao oficial. Vou comprar mais!",
    stars: 5,
  },
  {
    name: "Ana Beatriz",
    city: "Rio de Janeiro, RJ",
    text: "Comprei o kit completo para a Copa e ficou perfeito. Melhor loja de artigos do Brasil que já encontrei.",
    stars: 5,
  },
  {
    name: "João Pedro",
    city: "Belo Horizonte, MG",
    text: "Preços justos e entrega super rápida. O boné é lindo e super confortável. Recomendo demais!",
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
