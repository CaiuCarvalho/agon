"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Menu, User as UserIcon, Search, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/modules/checkout/hooks/useCart";
import Sidebar from "./Sidebar";
import QuickSearch from "./QuickSearch";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Logo } from "./ui/Logo";
import { ProductDTO } from "@/lib/utils";

const navLinks = [
  { label: "Mantos", href: "/#produtos" },
  { label: "Treino", href: "/#categorias" },
  { label: "Acessórios", href: "/#categorias" },
  { label: "Seleção", href: "/#produtos" },
];

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  // Search States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductDTO[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAuthPage = pathname?.includes("/login") || pathname?.includes("/cadastro");

  const [isClient, setIsClient] = useState(false);
  const { cart, openCart } = useCart();
  const totalItems = cart?.items.reduce((acc, i) => acc + i.quantity, 0) || 0;

  useEffect(() => {
    setIsClient(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    const checkSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkSize();
    window.addEventListener("resize", checkSize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkSize);
    };
  }, []);

  // Instant Search Logic
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://agonimports.com/api";
        const response = await fetch(`${baseUrl}/api/products?search=${searchQuery}&limit=4`);
        const json = await response.json();
        setSearchResults(json.data?.products || []);
      } catch (err) {
        console.error("Quick search failed:", err);
      } finally {
        setIsSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || isSearchOpen ? "glass-nike h-16 shadow-nike" : "bg-transparent h-24"
        }`}
      >
        <div className="container mx-auto h-full flex items-center justify-between px-6 md:px-12 relative">
          
          <AnimatePresence mode="wait">
            {!isSearchOpen ? (
              <motion.div 
                key="nav-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex items-center justify-between h-full"
              >
                {/* Logo */}
                <div className="h-full flex items-center">
                  {!isAuthPage && (
                    <Logo 
                      className="text-2xl md:text-3xl text-foreground hover:text-primary" 
                      useSharedLayout={!isDesktop} 
                    />
                  )}
                </div>

                {/* Desktop Links */}
                <div className="hidden lg:flex items-center gap-10">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/70 transition-all hover:text-primary hover:tracking-[0.25em]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                {/* Icones de Ação */}
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="hidden sm:flex text-foreground hover:text-primary transition-colors p-2"
                  >
                    <Search className="h-5 w-5" />
                  </button>

                  {isAuthenticated ? (
                    <Link href="/perfil" className="hidden lg:flex items-center gap-3 text-foreground hover:text-primary transition-colors group">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary">
                        Olá, {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}
                      </span>
                      <Avatar className="h-8 w-8 border border-border/20 group-hover:border-primary/50 transition-all shadow-sm">
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback className="text-[10px] font-black bg-muted">
                          {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  ) : (
                    <Link href="/login" className="hidden lg:flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                      <UserIcon className="h-5 w-5" />
                    </Link>
                  )}

                  <button onClick={openCart} className="group p-2 -ml-2 relative text-foreground hover:text-primary transition-all active:scale-95">
                    <ShoppingBag className="h-6 w-6" />
                    {isClient && totalItems > 0 && (
                      <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-neon-tiny animate-in zoom-in-50">
                        {totalItems}
                      </span>
                    )}
                  </button>

                  <button
                    className="group p-2 -mr-2 text-foreground hover:text-primary transition-all active:scale-90"
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Abrir Menu"
                  >
                    <Menu className="h-7 w-7" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="search-bar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex items-center h-full gap-6"
              >
                <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center h-12 bg-white/5 border border-primary/20 rounded-full px-6 group focus-within:border-primary/50 transition-all">
                  <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary mr-4 transition-colors" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="VASCULHAR O ARSENAL AGON..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-xs font-display font-bold tracking-widest uppercase transition-all"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery("")}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </button>
                  )}
                </form>
                <button 
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                >
                  Fechar
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Search Overlay */}
          <QuickSearch 
            isOpen={isSearchOpen}
            query={searchQuery}
            results={searchResults}
            isLoading={isSearchLoading}
            onClose={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
          />
        </div>
      </nav>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
};

export default Navbar;
