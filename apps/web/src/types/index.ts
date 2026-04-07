// ============================================================
// Tipos compartilhados do projeto Vitta
// ============================================================

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  image_url: string;
  category: string;
  rating: number;
  reviews: number;
}

export interface NavLink {
  label: string;
  href: string;
}

// Nav links compartilhados entre Navbar e Footer
export const NAV_LINKS: NavLink[] = [
  { label: "Produtos", href: "#produtos" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
];

// Re-export types from specialized modules
export * from "./form";
export * from "./address";
export * from "./order";
export * from "./cart";
