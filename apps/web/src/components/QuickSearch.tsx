"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { ProductDTO } from "@/lib/utils";

interface QuickSearchProps {
  isOpen: boolean;
  query: string;
  results: ProductDTO[];
  isLoading: boolean;
  onClose: () => void;
}

export default function QuickSearch({ isOpen, query, results, isLoading, onClose }: QuickSearchProps) {
  const showResults = query.length >= 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-full left-0 right-0 mt-4 mx-6 md:mx-12 z-[60]"
        >
          <div className="glass-nike rounded-[2.5rem] p-6 md:p-10 shadow-huge border border-primary/20 backdrop-blur-3xl">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                  Vasculhando o Arsenal...
                </p>
              </div>
            ) : showResults ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Product Results */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-4">
                    Resultados ({results.length})
                  </h3>
                  
                  {results.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {results.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          onClick={onClose}
                          className="group flex items-center gap-6 p-4 rounded-3xl hover:bg-white/5 transition-all active:scale-95"
                        >
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-muted/20 border border-border/10">
                            <img 
                              src={product.imageUrl || "/placeholder-product.webp"} 
                              alt={product.name}
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {product.category?.name || "Coleção Premium"}
                            </span>
                            <h4 className="text-sm font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                              {product.name}
                            </h4>
                            <span className="text-xs font-medium text-foreground/60">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 px-4 rounded-3xl bg-secondary/20 border border-dashed border-border/50 flex flex-col items-center text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Nenhum item encontrado no arsenal.
                      </p>
                    </div>
                  )}
                </div>

                {/* Search Deep Link / CTA */}
                <div className="flex flex-col justify-between p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <div>
                    <h3 className="text-2xl font-black uppercase leading-tight tracking-tighter mb-4 italic">
                      Não encontrou seu amuleto?
                    </h3>
                    <p className="text-xs text-muted-foreground font-body leading-relaxed mb-8 max-w-[280px]">
                      Acesse a galeria completa do Arsenal Agon e utilize filtros avançados de preço, categoria e categoria.
                    </p>
                  </div>
                  
                  <Link
                    href={`/products?search=${encodeURIComponent(query)}`}
                    onClick={onClose}
                    className="group flex items-center justify-between w-full h-16 px-8 rounded-full bg-primary text-primary-foreground font-display text-[10px] font-black uppercase tracking-[0.2em] shadow-neon hover:shadow-neon-intense hover:-translate-y-1 transition-all"
                  >
                    Ver Tudo
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="h-10 w-10 text-border mb-6" />
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Inicie sua busca</h3>
                <p className="text-xs text-muted-foreground tracking-widest uppercase">Digite ao menos 2 caracteres para vasculhar o arsenal.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
