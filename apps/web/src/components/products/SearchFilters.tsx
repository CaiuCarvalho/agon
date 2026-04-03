"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
  id: string;
  name: string;
}

interface SearchFiltersProps {
  categories: Category[];
}

export default function SearchFilters({ categories }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");
  const [activeSort, setActiveSort] = useState(searchParams.get("sort") || "latest");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      router.push(`/products?${params.toString()}`, { scroll: false });
    }, 500);

    return () => clearTimeout(timer);
  }, [search, router, searchParams]);

  const updateParam = useCallback((name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "latest") {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const sortOptions = [
    { label: "Lançamentos", value: "latest" },
    { label: "Menor Preço", value: "price_asc" },
    { label: "Maior Preço", value: "price_desc" },
    { label: "Mais Antigos", value: "oldest" },
  ];

  return (
    <div className="flex flex-col gap-8 mb-12">
      {/* Upper Row: Search & Sort */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xl group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="BUSCAR NO ARSENAL AGON..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-16 bg-card/10 border border-border/40 rounded-full pl-16 pr-6 font-display text-xs uppercase tracking-widest focus:border-primary/60 outline-none transition-all placeholder:text-muted-foreground/30 backdrop-blur-xl"
          />
        </div>

        <div className="relative w-full md:w-auto">
          <button 
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="w-full md:w-64 h-16 px-8 rounded-full border border-border/40 bg-card/10 backdrop-blur-xl flex items-center justify-between font-display text-[10px] font-black uppercase tracking-widest hover:border-primary/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span>Ordenar: {sortOptions.find(o => o.value === activeSort)?.label}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isSortOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-2 left-0 w-full bg-card/90 backdrop-blur-2xl border border-border/40 rounded-[2rem] p-4 z-50 shadow-2xl"
              >
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setActiveSort(opt.value);
                      updateParam("sort", opt.value);
                      setIsSortOpen(false);
                    }}
                    className="flex items-center justify-between w-full p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    {opt.label}
                    {activeSort === opt.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Categories Toolbar (Horizontal) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
        <button
          onClick={() => {
            setActiveCategory("all");
            updateParam("category", "all");
          }}
          className={`h-11 px-8 rounded-full font-display text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
            activeCategory === "all" 
              ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,156,59,0.3)]" 
              : "bg-card/10 border border-border/40 text-muted-foreground hover:border-foreground/50 hover:text-foreground"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              updateParam("category", cat.id);
            }}
            className={`h-11 px-8 rounded-full font-display text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeCategory === cat.id 
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,156,59,0.3)]" 
                : "bg-card/10 border border-border/40 text-muted-foreground hover:border-foreground/50 hover:text-foreground"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
