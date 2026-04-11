# Implementation Plan: Products Carousel Auto Scroll

## Overview

Este plano implementa um carrossel automático interativo para a seção "Equipamentos da Seleção" na página inicial. A implementação será feita de forma incremental, começando pelos hooks customizados de gerenciamento de estado, seguindo para os componentes visuais, e finalizando com integração e testes.

A arquitetura é baseada em hooks customizados reutilizáveis que separam a lógica de negócio da apresentação, garantindo testabilidade e manutenibilidade.

## Tasks

- [x] 1. Criar estrutura de diretórios e interfaces TypeScript
  - Criar pasta `apps/web/src/components/ProductsCarousel/`
  - Criar subpasta `apps/web/src/components/ProductsCarousel/hooks/`
  - Definir interfaces TypeScript em `apps/web/src/components/ProductsCarousel/types.ts`
  - Incluir: `ProductsCarouselProps`, `CarouselState`, `AutoScrollState`, `NavigationState`
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 2. Implementar hook de estado central (useCarouselState)
  - [x] 2.1 Criar arquivo `apps/web/src/components/ProductsCarousel/hooks/useCarouselState.ts`
    - Implementar gerenciamento de `currentIndex`, `itemsPerView`, `totalPages`
    - Implementar cálculo automático de `currentPage` e `totalPages`
    - Implementar validação de limites de índice
    - Implementar flag `isTransitioning` para bloquear inputs durante animação
    - _Requirements: 1.1, 1.3, 3.3, 4.2_

  - [ ]* 2.2 Escrever testes unitários para useCarouselState
    - Testar cálculos de totalPages e currentPage
    - Testar validação de limites de índice
    - Testar comportamento de isTransitioning
    - _Requirements: 1.1, 4.2_

- [x] 3. Implementar hook de detecção responsiva (useCarouselResponsive)
  - [x] 3.1 Criar arquivo `apps/web/src/components/ProductsCarousel/hooks/useCarouselResponsive.ts`
    - Usar `window.matchMedia('(min-width: 768px)')` para detectar breakpoint
    - Retornar 2 items para mobile (< 768px), 4 para desktop (>= 768px)
    - Implementar listener de mudanças de viewport
    - Limpar listener no unmount
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 3.2 Escrever testes unitários para useCarouselResponsive
    - Mockar `window.matchMedia`
    - Testar detecção de breakpoint mobile/desktop
    - Testar atualização em tempo real
    - _Requirements: 4.1, 4.2_

- [x] 4. Implementar hook de navegação manual (useCarouselNavigation)
  - [x] 4.1 Criar arquivo `apps/web/src/components/ProductsCarousel/hooks/useCarouselNavigation.ts`
    - Implementar `goToNext()` com loop ao final
    - Implementar `goToPrev()` com loop ao início
    - Implementar `goToPage(pageIndex)` para navegação direta
    - Calcular flags: `canGoNext`, `canGoPrev`, `isAtStart`, `isAtEnd`
    - Chamar callback `onInteraction()` após cada ação
    - _Requirements: 2.2, 2.3, 2.5, 2.6, 6.4_

  - [ ]* 4.2 Escrever testes unitários para useCarouselNavigation
    - Testar loop de primeira para última página
    - Testar loop de última para primeira página
    - Testar navegação direta via goToPage
    - Testar cálculo de flags de navegação
    - _Requirements: 2.2, 2.3, 2.5, 2.6_

- [x] 5. Implementar hook de auto-scroll (useAutoScroll)
  - [x] 5.1 Criar arquivo `apps/web/src/components/ProductsCarousel/hooks/useAutoScroll.ts`
    - Implementar timer com `setInterval` para chamar `onNext()` a cada 5s
    - Implementar delay inicial de 3s antes de iniciar
    - Implementar `pause(reason)` para pausar imediatamente
    - Implementar `resume()` com duração baseada em reason (hover: 1s, interaction: 10s)
    - Limpar timers no unmount
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 2.4_

  - [ ]* 5.2 Escrever testes unitários para useAutoScroll
    - Usar `vi.useFakeTimers()` para testar timers
    - Testar início após delay inicial de 3s
    - Testar chamada de onNext a cada 5s
    - Testar pausa e resume com durações corretas
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 2.4_

- [x] 6. Implementar hook de gestos touch (useSwipeGesture)
  - [x] 6.1 Criar arquivo `apps/web/src/components/ProductsCarousel/hooks/useSwipeGesture.ts`
    - Capturar `touchstart` para registrar posição inicial
    - Capturar `touchmove` para calcular delta
    - Capturar `touchend` para determinar direção
    - Ignorar movimento se deltaY > deltaX (scroll vertical)
    - Chamar `onSwipeLeft()` para swipe esquerda (next)
    - Chamar `onSwipeRight()` para swipe direita (prev)
    - Threshold mínimo de 50px
    - _Requirements: 4.4, 4.5, 4.6, 4.7_

  - [ ]* 6.2 Escrever testes unitários para useSwipeGesture
    - Simular eventos touch com TouchEvent
    - Testar detecção de swipe left/right
    - Testar threshold mínimo
    - Testar ignorar movimento vertical
    - _Requirements: 4.4, 4.5, 4.6_

- [x] 7. Checkpoint - Validar hooks customizados
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implementar componente CarouselTrack
  - [x] 8.1 Criar arquivo `apps/web/src/components/ProductsCarousel/CarouselTrack.tsx`
    - Renderizar lista de produtos com flexbox
    - Aplicar `transform: translateX()` baseado em currentIndex e itemsPerView
    - Aplicar transição CSS com `transition: transform 500ms ease-in-out`
    - Adicionar `will-change: transform` para otimização GPU
    - Bloquear pointer-events durante transição
    - Reutilizar componente `ProductCard` existente
    - _Requirements: 1.4, 3.1, 3.2, 3.3_

  - [ ]* 8.2 Escrever testes de componente para CarouselTrack
    - Testar renderização de produtos
    - Testar aplicação de transform baseado em currentIndex
    - Testar bloqueio de pointer-events durante transição
    - _Requirements: 1.4, 3.2, 3.3_

- [x] 9. Implementar componente NavigationButton
  - [x] 9.1 Criar arquivo `apps/web/src/components/ProductsCarousel/NavigationButton.tsx`
    - Renderizar botão com ícone ChevronLeft ou ChevronRight
    - Aplicar estilos de estado: disabled, boundary (primeira/última página)
    - Adicionar ARIA labels: `aria-label`, `aria-disabled`
    - Tornar focusável e ativável via Enter/Space
    - Ocultar em mobile (< 768px) via CSS
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 5.1, 5.2_

  - [ ]* 9.2 Escrever testes de componente para NavigationButton
    - Testar renderização de ícones
    - Testar estados disabled e boundary
    - Testar acessibilidade (ARIA labels, keyboard)
    - _Requirements: 2.1, 5.1, 5.2_

- [x] 10. Implementar componente PaginationDots
  - [x] 10.1 Criar arquivo `apps/web/src/components/ProductsCarousel/PaginationDots.tsx`
    - Renderizar dots baseado em totalPages
    - Destacar dot da página atual
    - Implementar navegação direta via click em dot
    - Adicionar ARIA: `role="tablist"`, `role="tab"`, `aria-selected`
    - Adicionar labels: `aria-label="Ir para página X"`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 10.2 Escrever testes de componente para PaginationDots
    - Testar renderização de dots
    - Testar highlight de página atual
    - Testar navegação via click
    - Testar acessibilidade (ARIA)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 11. Implementar componente principal ProductsCarousel
  - [x] 11.1 Criar arquivo `apps/web/src/components/ProductsCarousel/index.tsx`
    - Orquestrar todos os hooks: useCarouselState, useAutoScroll, useCarouselNavigation, useCarouselResponsive, useSwipeGesture
    - Renderizar estrutura: CarouselContainer > NavigationButton + CarouselTrack + NavigationButton + PaginationDots
    - Implementar event listeners: onMouseEnter/onMouseLeave para pause/resume
    - Adicionar ARIA: `role="region"`, `aria-roledescription="carousel"`, `aria-label="Equipamentos da Seleção"`
    - Adicionar ARIA para slides: `role="group"`, `aria-roledescription="slide"`, `aria-label="Produtos X de Y"`
    - Implementar fallback para produtos vazios ou erro
    - _Requirements: 1.1, 1.5, 1.6, 2.4, 4.7, 5.3, 5.4_

  - [ ]* 11.2 Escrever testes de integração para ProductsCarousel
    - Testar orquestração de hooks
    - Testar pause/resume em hover
    - Testar pause em interação (click, swipe)
    - Testar acessibilidade completa
    - _Requirements: 1.5, 1.6, 2.4, 5.3, 5.4_

- [x] 12. Adicionar estilos CSS para o carrossel
  - [x] 12.1 Criar arquivo `apps/web/src/components/ProductsCarousel/styles.module.css` ou usar Tailwind
    - Estilos para CarouselContainer (overflow hidden, position relative)
    - Estilos para CarouselTrack (display flex, transition, will-change)
    - Estilos para NavigationButton (position absolute, hover effects, mobile hidden)
    - Estilos para PaginationDots (flex center, gap, hover effects)
    - Estilos para estados: disabled, boundary, active dot
    - Garantir focus visible para acessibilidade
    - _Requirements: 2.7, 2.8, 3.1, 5.2, 6.6_

- [x] 13. Checkpoint - Validar componentes individuais
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Integrar ProductsCarousel no HomeClient
  - [x] 14.1 Modificar `apps/web/src/app/HomeClient.tsx`
    - Importar `ProductsCarousel` component
    - Substituir `<HomeProductsSection>` por `<ProductsCarousel>`
    - Passar props: `initialProducts`, `error` (productsError)
    - Manter estrutura de seção existente (título, descrição)
    - _Requirements: 1.1, 2.1, 4.1_

- [x] 15. Implementar lazy loading de imagens
  - [x] 15.1 Adicionar lazy loading no ProductCard ou CarouselTrack
    - Usar `loading="lazy"` em tags `<Image>` do Next.js
    - Implementar preload de próxima página durante idle time
    - Usar `<link rel="preload">` ou `Image.priority` para primeira página
    - _Requirements: 5.6, 5.7_

  - [ ]* 15.2 Testar performance de lazy loading
    - Validar que imagens fora da view não carregam imediatamente
    - Validar preload de próxima página
    - _Requirements: 5.6, 5.7_

- [x] 16. Validar acessibilidade completa
  - [x] 16.1 Testar navegação por teclado
    - Tab para focar controles de navegação
    - Enter/Space para ativar botões
    - Validar ordem lógica de foco
    - _Requirements: 5.1, 5.2_

  - [x] 16.2 Testar com screen reader
    - Validar anúncios de estado do carrossel
    - Validar anúncios de posição atual
    - Validar labels de controles
    - _Requirements: 5.3, 5.4_

- [x] 17. Otimizar performance e prevenir layout shifts
  - [x] 17.1 Adicionar dimensões fixas ao CarouselContainer
    - Definir height mínimo para evitar layout shift
    - Usar aspect-ratio ou min-height
    - _Requirements: 5.5_

  - [x] 17.2 Validar performance de transições
    - Usar Chrome DevTools Performance tab
    - Garantir 60fps durante transições
    - Validar uso de GPU acceleration (transform, will-change)
    - _Requirements: 1.4, 3.1, 5.5_

- [ ]* 18. Escrever testes de integração end-to-end
  - Testar fluxo completo: load → auto-scroll → click navigation → hover pause → swipe
  - Testar resize de viewport
  - Testar navegação via pagination dots
  - _Requirements: 1.1, 1.2, 1.5, 2.2, 2.4, 4.3, 4.5, 6.4_

- [x] 19. Checkpoint final - Validação completa
  - Ensure all tests pass, ask the user if questions arise.
  - Validar todos os requisitos de acessibilidade
  - Validar performance em diferentes dispositivos
  - Validar comportamento responsivo

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Hooks customizados são testados isoladamente antes de integração
- Componentes reutilizam `ProductCard` existente para consistência
- CSS usa transforms para performance otimizada (GPU acceleration)
- Acessibilidade é implementada desde o início, não como afterthought
