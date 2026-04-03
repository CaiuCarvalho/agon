"use client";
import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { Shirt, Flag, Trophy, Star } from "lucide-react";

const categories = [
  { icon: Shirt, label: "Camisas", count: 24 },
  { icon: Flag, label: "Acessórios", count: 18 },
  { icon: Trophy, label: "Colecionáveis", count: 12 },
  { icon: Star, label: "Edição Limitada", count: 6 },
];

const Categories = () => {
  return (
    <section id="categorias" className="bg-muted py-20">
      <div className="container mx-auto">
        <SectionTitle title="Categorias" subtitle="Encontre o que combina com você" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {categories.map((cat, i) => (
            <motion.a
              key={cat.label}
              href="#"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <cat.icon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-display text-xl tracking-wide text-card-foreground">{cat.label}</h3>
                <p className="text-sm text-muted-foreground">{cat.count} produtos</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
