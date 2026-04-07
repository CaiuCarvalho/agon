"use client";
import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { Shirt, Flag, Trophy, Shield } from "lucide-react";

const categories = [
  { 
    icon: Shield, 
    label: "Manto Sagrado", 
    count: 12,
    href: "/products?category=selecao-brasileira",
    featured: true 
  },
  { 
    icon: Shirt, 
    label: "Clubes", 
    count: 24,
    href: "/products?category=clubes-brasileiros",
    featured: false 
  },
  { 
    icon: Trophy, 
    label: "Clubes Europeus", 
    count: 18,
    href: "/products?category=clubes-europeus",
    featured: false 
  },
  { 
    icon: Flag, 
    label: "Seleções", 
    count: 15,
    href: "/products?category=selecoes",
    featured: false 
  },
];

const Categories = () => {
  return (
    <section id="categorias" className="bg-muted py-20">
      <div className="container mx-auto">
        <SectionTitle title="Categorias" subtitle="Encontre o que combina com você" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.a
              key={cat.label}
              href={cat.href}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`group flex flex-col items-center gap-4 rounded-lg border text-center transition-all hover:shadow-lg ${
                cat.featured
                  ? "sm:col-span-2 lg:col-span-2 bg-primary/5 border-primary p-12 hover:border-primary hover:bg-primary/10"
                  : "border-border bg-card p-8 hover:border-primary"
              }`}
            >
              <div className={`flex items-center justify-center rounded-full transition-colors ${
                cat.featured
                  ? "h-20 w-20 bg-primary text-white group-hover:scale-110"
                  : "h-16 w-16 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
              }`}>
                <cat.icon className={cat.featured ? "h-10 w-10" : "h-7 w-7"} />
              </div>
              <div>
                <h3 className={`font-display tracking-wide text-card-foreground ${
                  cat.featured ? "text-2xl" : "text-xl"
                }`}>
                  {cat.label}
                </h3>
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
