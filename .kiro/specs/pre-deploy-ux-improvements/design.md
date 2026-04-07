# Design Document: Pre-Deploy UX Improvements

## Overview

This design document specifies the technical implementation for critical UX/UI improvements to the Agon e-commerce platform before deployment. The improvements focus on five key areas: checkout form input visibility, header logo visibility on checkout pages, navigation menu restructuring, homepage category cards redesign, and regional testimonials enhancement.

These changes are purely presentational and do not require backend modifications. All improvements will be implemented using existing Tailwind CSS utilities and React component patterns already established in the codebase.

## Architecture

### Component Hierarchy

```
RootLayout (apps/web/src/app/layout.tsx)
├── Navbar (apps/web/src/components/Navbar.tsx)
│   └── Navigation Links (navLinks array)
├── CheckoutPage (apps/web/src/app/checkout/page.tsx)
│   └── CheckoutPageClient (apps/web/src/modules/checkout/components/CheckoutPageClient.tsx)
│       └── ShippingForm (apps/web/src/modules/checkout/components/ShippingForm.tsx)
└── HomePage (apps/web/src/app/page.tsx)
    ├── Categories (apps/web/src/components/Categories.tsx)
    └── Testimonials (apps/web/src/components/Testimonials.tsx)
```

### Design Principles

1. **Minimal Changes**: Modify only what's necessary to meet requirements
2. **Consistency**: Maintain existing design system (Tailwind classes, color tokens)
3. **No New Dependencies**: Use only existing libraries and utilities
4. **Accessibility**: Ensure WCAG 2.1 AA compliance for form inputs and interactive elements
5. **Responsive**: All changes must work across mobile, tablet, and desktop viewports

## Components and Interfaces

### 1. Checkout Form Input Styling

**Component**: `ShippingForm.tsx`  
**Location**: `apps/web/src/modules/checkout/components/ShippingForm.tsx`

#### Current State
- Input fields use: `className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"`
- Labels use: `className="block text-sm font-medium text-gray-700 mb-1"`
- Error messages use: `className="mt-1 text-sm text-red-600"`

#### Required Changes

**Input Fields**:
```tsx
// Current
className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

// New
className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
```

**Select Fields**:
```tsx
// Current
className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

// New
className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
```

**Labels**:
```tsx
// Current
className="block text-sm font-medium text-gray-700 mb-1"

// New
className="block text-sm font-semibold text-gray-900 mb-1.5"
```

**Error Messages**: No changes needed (already red and visible)

**Rationale**:
- `bg-white`: Ensures light background (>90% lightness) for input visibility
- `text-gray-900`: Dark text color (<20% lightness) for typed content
- `placeholder:text-gray-500`: Medium gray (40-60% lightness) for placeholders
- `focus:ring-primary focus:border-primary`: Distinct focus indicator using brand color
- `disabled:bg-gray-100`: Visual feedback for disabled state
- `font-semibold`: Improved label legibility

### 2. Checkout Page Header Logo Visibility

**Component**: `Navbar.tsx`  
**Location**: `apps/web/src/components/Navbar.tsx`

#### Current State
The Navbar uses conditional styling based on scroll state:
```tsx
className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
  scrolled || isSearchOpen ? "glass-nike h-16 shadow-nike" : "bg-transparent h-24"
}`}
```

The `glass-nike` class provides a semi-transparent background that may not provide sufficient contrast on the checkout page.

#### Required Changes

Add pathname detection and conditional background styling:

```tsx
const pathname = usePathname(); // Already imported
const isCheckoutPage = pathname?.startsWith('/checkout');

// Update nav className
className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
  scrolled || isSearchOpen || isCheckoutPage 
    ? "glass-nike h-16 shadow-nike" 
    : "bg-transparent h-24"
}`}
```

**Rationale**:
- Forces the navbar to use `glass-nike` background on checkout pages
- `glass-nike` provides sufficient contrast for logo visibility
- Maintains existing styling patterns
- No changes to logo component itself needed

### 3. Navigation Menu Restructure

**Component**: `Navbar.tsx`  
**Location**: `apps/web/src/components/Navbar.tsx`

#### Current State
```tsx
const navLinks = [
  { label: "Mantos", href: "/#produtos" },
  { label: "Treino", href: "/#categorias" },
  { label: "Acessórios", href: "/#categorias" },
  { label: "Seleção", href: "/#produtos" },
];
```

#### Required Changes
```tsx
const navLinks = [
  { label: "Mantos", href: "/#produtos" },
  { label: "Seleção", href: "/#produtos" },
  { label: "Produtos", href: "/products" },
  { label: "Clubes", href: "/products?category=clubes" },
];
```

**Rationale**:
- Removes duplicate/unclear categories ("Treino", "Acessórios")
- Adds direct link to products page
- Adds filtered link to club products
- Maintains 4-item navigation structure
- Clear, logical navigation hierarchy

### 4. Homepage Category Cards Redesign

**Component**: `Categories.tsx`  
**Location**: `apps/web/src/components/Categories.tsx`

#### Current State
```tsx
const categories = [
  { icon: Shirt, label: "Camisas", count: 24 },
  { icon: Flag, label: "Acessórios", count: 18 },
  { icon: Trophy, label: "Colecionáveis", count: 12 },
  { icon: Star, label: "Edição Limitada", count: 6 },
];
```

Grid layout: `grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4`

#### Required Changes

**Data Structure**:
```tsx
import { Shirt, Flag, Trophy, Star, Shield } from "lucide-react";

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
```

**Component Structure**:
```tsx
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
```

**Visual Hierarchy Implementation**:
- "Manto Sagrado" spans 2 columns on mobile and desktop (`sm:col-span-2 lg:col-span-2`)
- Larger icon (h-20 w-20 vs h-16 w-16)
- Larger text (text-2xl vs text-xl)
- Primary-colored background (`bg-primary/5`)
- Primary border color
- More padding (p-12 vs p-8)

**Rationale**:
- Clear visual hierarchy with featured card
- Functional navigation links (no broken routes)
- Brazilian national team prominently featured
- Logical category grouping
- Maintains responsive grid layout

### 5. Remove "Nossa Jornada" Button

**Component**: `page.tsx` (Homepage)  
**Location**: `apps/web/src/app/page.tsx`

#### Current State
Located in the "Herança & Comunidade" section:
```tsx
<div className="flex flex-col sm:flex-row gap-6 pt-4">
  <Link 
    href={user ? "/perfil" : "/cadastro"}
    className="inline-flex items-center justify-center h-14 px-10 bg-primary text-white font-display text-xl uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-lg hover:shadow-primary/20"
  >
    Junte-se à Elite
  </Link>
  <button className="h-14 px-10 border border-border text-foreground font-display text-xl uppercase tracking-widest rounded-full hover:bg-muted transition-all">
    Nossa Jornada
  </button>
</div>
```

#### Required Changes
Remove the second button entirely:
```tsx
<div className="pt-4">
  <Link 
    href={user ? "/perfil" : "/cadastro"}
    className="inline-flex items-center justify-center h-14 px-10 bg-primary text-white font-display text-xl uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-lg hover:shadow-primary/20"
  >
    Junte-se à Elite
  </Link>
</div>
```

**Rationale**:
- Removes non-functional button
- Simplifies layout
- No empty spacing issues (parent div maintains structure)

### 6. Regional Testimonials Enhancement

**Component**: `Testimonials.tsx`  
**Location**: `apps/web/src/components/Testimonials.tsx`

#### Current State
```tsx
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
```

#### Required Changes
```tsx
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
```

**Rationale**:
- All testimonials from South region cities (Curitiba-PR, Florianópolis-SC, Porto Alegre-RS)
- Natural, conversational language
- Specific product mentions (jersey, kit, tracksuit)
- References to delivery speed in the region
- Maintains existing component structure (no code changes needed beyond data)

## Data Models

### Navigation Link Interface
```typescript
interface NavLink {
  label: string;
  href: string;
}
```

### Category Card Interface
```typescript
interface Category {
  icon: LucideIcon;
  label: string;
  count: number;
  href: string;
  featured: boolean;
}
```

### Testimonial Interface
```typescript
interface Testimonial {
  name: string;
  city: string;
  text: string;
  stars: number;
}
```

### Form Input Styling Pattern
```typescript
// Standard input className pattern
const inputClassName = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed";

// Standard label className pattern
const labelClassName = "block text-sm font-semibold text-gray-900 mb-1.5";

// Standard error className pattern (unchanged)
const errorClassName = "mt-1 text-sm text-red-600";
```

## Error Handling

### Form Input Validation
- Existing validation logic remains unchanged
- Error messages already styled correctly (red text, positioned below inputs)
- No additional error handling needed

### Navigation Links
- All href values point to existing routes or valid hash anchors
- Category filter URLs use standard query parameter format
- No 404 risk from navigation changes

### Component Rendering
- All changes are presentational CSS/data updates
- No conditional rendering logic changes
- No risk of runtime errors from these modifications

## Testing Strategy

### Manual Testing Checklist

#### Checkout Form Inputs
1. Navigate to `/checkout` (requires authentication and cart items)
2. Verify all input fields have white background
3. Type in each field and verify text is dark and readable
4. Verify placeholder text is medium gray and visible
5. Tab through fields and verify focus ring appears (primary color)
6. Verify labels are dark and legible
7. Trigger validation errors and verify red error messages appear

#### Header Logo on Checkout
1. Navigate to `/checkout`
2. Verify logo is visible with good contrast
3. Scroll page and verify logo remains visible
4. Navigate to other pages and verify normal header behavior

#### Navigation Menu
1. Verify navigation shows: Mantos, Seleção, Produtos, Clubes
2. Click "Mantos" → should scroll to #produtos section on homepage
3. Click "Seleção" → should scroll to #produtos section on homepage
4. Click "Produtos" → should navigate to `/products` page
5. Click "Clubes" → should navigate to `/products?category=clubes`

#### Category Cards
1. Navigate to homepage
2. Scroll to "Escolha seu caminho" section
3. Verify "Manto Sagrado" card is larger and visually prominent
4. Verify 4 cards total: Manto Sagrado, Clubes, Clubes Europeus, Seleções
5. Click each card and verify navigation works
6. Test responsive layout on mobile, tablet, desktop

#### Homepage Button Removal
1. Navigate to homepage
2. Scroll to "Herança & Comunidade" section
3. Verify only "Junte-se à Elite" button is present
4. Verify no empty spacing or layout issues

#### Testimonials
1. Navigate to homepage
2. Scroll to "Voz da Torcida" section
3. Verify 3 testimonials from South region cities
4. Verify natural language and specific product mentions
5. Verify city format: "City, State"

### Responsive Testing
- Test all changes on mobile (320px - 767px)
- Test all changes on tablet (768px - 1023px)
- Test all changes on desktop (1024px+)

### Browser Testing
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)

### Accessibility Testing
- Keyboard navigation through checkout form
- Screen reader testing for form labels and errors
- Color contrast verification (WCAG AA minimum 4.5:1)
- Focus indicators visible and clear

## Implementation Notes

### File Modification Summary

1. **apps/web/src/modules/checkout/components/ShippingForm.tsx**
   - Update all input field className attributes
   - Update all label className attributes
   - Update select field className attribute

2. **apps/web/src/components/Navbar.tsx**
   - Add `isCheckoutPage` constant
   - Update nav className condition to include checkout page check
   - Replace `navLinks` array with new structure

3. **apps/web/src/components/Categories.tsx**
   - Import `Shield` icon from lucide-react
   - Replace `categories` array with new structure
   - Update grid layout className
   - Update motion.a className with conditional styling
   - Update icon container className with conditional styling
   - Update h3 className with conditional sizing

4. **apps/web/src/app/page.tsx**
   - Remove "Nossa Jornada" button from "Herança & Comunidade" section
   - Update parent div className from `flex flex-col sm:flex-row gap-6 pt-4` to `pt-4`

5. **apps/web/src/components/Testimonials.tsx**
   - Replace `testimonials` array with new South region data

### No Changes Required
- No backend/API modifications
- No database schema changes
- No new dependencies
- No routing changes
- No authentication/authorization changes
- No state management changes

### Deployment Considerations
- Changes are purely frontend
- No environment variable updates needed
- No migration scripts required
- Can be deployed independently
- No cache invalidation needed
- No CDN purge required

## Conclusion

This design provides a complete specification for implementing the pre-deploy UX improvements. All changes are minimal, focused, and maintain consistency with the existing design system. The improvements directly address user experience issues identified in the requirements without introducing technical complexity or risk.

Implementation should be straightforward, requiring only CSS class updates and data array modifications across 5 component files. No architectural changes, new dependencies, or backend modifications are needed.
