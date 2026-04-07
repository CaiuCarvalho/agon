# Implementation Plan: Pre-Deploy UX Improvements

## Overview

This plan implements critical UX/UI improvements to the Agon e-commerce platform before deployment. The changes are purely presentational, involving CSS class updates and data array modifications across 5 component files. No backend changes, new dependencies, or architectural modifications are required.

## Tasks

- [x] 1. Update checkout form input styling for better visibility
  - [x] 1.1 Update input field styles in ShippingForm component
    - Modify all text input className attributes to include: `bg-white`, `text-gray-900`, `placeholder:text-gray-500`, `focus:ring-primary`, `focus:border-primary`, `disabled:bg-gray-100`
    - Modify all select field className attributes with same styling pattern
    - File: `apps/web/src/modules/checkout/components/ShippingForm.tsx`
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_
  
  - [x] 1.2 Update label styles in ShippingForm component
    - Change label className from `text-gray-700` to `text-gray-900` and `font-medium` to `font-semibold`
    - Update margin from `mb-1` to `mb-1.5`
    - File: `apps/web/src/modules/checkout/components/ShippingForm.tsx`
    - _Requirements: 1.4_
  
  - [ ]* 1.3 Test checkout form input visibility
    - Verify white backgrounds, dark text, visible placeholders
    - Test focus states and error messages
    - Test across different browsers and screen sizes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Fix header logo visibility on checkout page
  - [x] 2.1 Add checkout page detection to Navbar
    - Add `isCheckoutPage` constant using `pathname?.startsWith('/checkout')`
    - Update nav className condition to include `isCheckoutPage` in glass-nike trigger
    - File: `apps/web/src/components/Navbar.tsx`
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 2.2 Test header logo visibility on checkout
    - Navigate to checkout and verify logo contrast
    - Test scrolling behavior
    - Verify normal header behavior on other pages
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Restructure navigation menu items
  - [x] 3.1 Update navLinks array in Navbar component
    - Replace existing navLinks with: Mantos (/#produtos), Seleção (/#produtos), Produtos (/products), Clubes (/products?category=clubes)
    - Remove "Treino" and "Acessórios" items
    - File: `apps/web/src/components/Navbar.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 3.2 Test navigation menu functionality
    - Click each menu item and verify correct navigation
    - Test on mobile and desktop layouts
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Verify header and navigation changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Redesign homepage category cards with visual hierarchy
  - [x] 5.1 Update categories data array in Categories component
    - Import Shield icon from lucide-react
    - Replace categories array with: Manto Sagrado (featured), Clubes, Clubes Europeus, Seleções
    - Add href and featured properties to each category object
    - File: `apps/web/src/components/Categories.tsx`
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 5.2 Implement visual hierarchy styling for category cards
    - Update grid layout to support featured card spanning 2 columns
    - Add conditional className for featured card: larger size, primary background, larger icon, larger text
    - Update motion.a to use href instead of onClick
    - File: `apps/web/src/components/Categories.tsx`
    - _Requirements: 4.2, 4.7, 4.8_
  
  - [ ]* 5.3 Test category cards layout and navigation
    - Verify "Manto Sagrado" visual prominence
    - Click each card and verify navigation works
    - Test responsive layout on mobile, tablet, desktop
    - _Requirements: 4.1, 4.2, 4.7, 4.8_

- [x] 6. Remove "Nossa Jornada" button from homepage
  - [x] 6.1 Remove button and update layout in homepage
    - Delete "Nossa Jornada" button element from "Herança & Comunidade" section
    - Update parent div className from `flex flex-col sm:flex-row gap-6 pt-4` to `pt-4`
    - File: `apps/web/src/app/page.tsx`
    - _Requirements: 5.1, 5.2_
  
  - [ ]* 6.2 Test homepage layout after button removal
    - Verify no empty spacing or broken layout
    - Test on different screen sizes
    - _Requirements: 5.1, 5.2_

- [-] 7. Update testimonials with South Brazil regional focus
  - [x] 7.1 Replace testimonials data array
    - Update testimonials array with 3 new testimonials from Curitiba-PR, Florianópolis-SC, Porto Alegre-RS
    - Ensure natural language, specific product mentions, and proper city format
    - File: `apps/web/src/components/Testimonials.tsx`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 7.2 Test testimonials display
    - Verify 3 testimonials from South region cities
    - Verify natural language and product mentions
    - Verify city format: "City, State"
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8. Final checkpoint - Complete testing and verification
  - [ ]* 8.1 Run full manual testing checklist
    - Test all changes across browsers (Chrome, Firefox, Safari)
    - Test responsive behavior on mobile, tablet, desktop
    - Test keyboard navigation and accessibility
    - Verify color contrast meets WCAG AA standards
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 8.2 Final verification
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster deployment
- All changes are purely presentational (CSS and data updates)
- No backend modifications, new dependencies, or architectural changes required
- Each task references specific requirements for traceability
- Implementation should be straightforward with minimal risk
- Changes can be deployed independently without migration scripts
