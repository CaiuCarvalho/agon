"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, User, ShoppingBag, Heart, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/modules/checkout/hooks/useCart";
import { useWishlist } from "@/context/WishlistContext";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Logo } from "./ui/Logo";
import { toast } from "sonner";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: "Jersey & Mantos", href: "/#produtos" },
  { label: "Treino & Performance", href: "/#categorias" },
  { label: "Acessórios", href: "/#categorias" },
  { label: "Coleção Feminina", href: "/#produtos" },
  { label: "Outlet Brasil", href: "/#produtos" },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();
  const totalItems = cart?.items.reduce((acc, i) => acc + i.quantity, 0) || 0;
  const { totalFavorites } = useWishlist();
  
  const isAuthPage = pathname?.includes("/login") || pathname?.includes("/cadastro");

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      toast.success("Você saiu da sua conta");
    } catch (error) {
      toast.error("Erro ao sair da conta");
      console.error(error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[70] h-full w-[85%] max-w-sm bg-background p-8 shadow-2xl flex flex-col pt-12"
          >
            <div className="flex items-center justify-between mb-12 shrink-0">
              <div className="h-10 flex items-center">
                {!isAuthPage && (
                  <Logo className="text-2xl" />
                )}
              </div>
              <button 
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/40 text-foreground transition-all hover:bg-muted/60"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">

            {/* Auth Section */}
            <div className="mb-12">
              {isAuthenticated ? (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border/50">
                  <Avatar className="h-12 w-12 border border-border/20 shadow-sm">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="text-xl font-black bg-primary text-primary-foreground">
                      {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-bold truncate">Olá, {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}</p>
                    <div className="flex gap-2">
                      <Link href="/perfil" onClick={onClose} className="text-[10px] uppercase font-bold text-primary hover:underline transition-all">
                        Minha Conta
                      </Link>
                      <button onClick={handleLogout} className="text-[10px] uppercase font-bold text-muted-foreground hover:text-white transition-colors">
                        Sair
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  onClick={onClose}
                  className="flex items-center justify-between p-5 rounded-2xl bg-primary text-primary-foreground font-display text-xl uppercase tracking-widest"
                >
                  Fazer Login
                  <User className="h-5 w-5" />
                </Link>
              )}
            </div>

            {/* Navigation links */}
            <nav className="space-y-6 mb-12">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-4">Navegação</p>
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between text-lg font-display uppercase tracking-wider hover:text-primary transition-colors border-b border-border/20 pb-4"
                >
                  {item.label}
                  <ChevronRight className="h-4 w-4 opacity-30" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="space-y-4">
              <Link
                href="/cart"
                onClick={onClose}
                className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground transition-colors"
              >
                <ShoppingBag className="h-5 w-5" />
                Meu Carrinho ({totalItems})
              </Link>
              <Link
                href="/favoritos"
                onClick={onClose}
                className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground transition-colors"
              >
                <Heart className="h-5 w-5" />
                Favoritos ({totalFavorites})
              </Link>
            </div>
          </div>

            {/* Footer Sign */}
            <div className="pt-8 mt-auto border-t border-border/20 shrink-0">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em]">
                Official Agon Store
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
