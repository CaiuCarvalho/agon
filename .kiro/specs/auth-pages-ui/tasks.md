# Implementation Plan: Auth Pages UI

## Overview

This plan implements production-ready authentication page components for the Agon e-commerce platform. The implementation creates minimal client-side pages that compose existing authentication components (AuthLayout, LoginForm, RegisterForm) with proper session verification, loading states, and navigation flows. Each page will be under 50 lines of code, delegating all complex logic to existing components.

## Tasks

- [x] 1. Implement Login Page with Session Verification
  - Create `/apps/web/src/app/(auth)/login/page.tsx` as client component
  - Add session verification logic using `supabase.auth.getSession()`
  - Implement loading state during session check
  - Add redirect to "/" for authenticated users
  - Render AuthLayout with title "Entrar" and subtitle "Acesse sua conta para continuar sua jornada"
  - Render LoginForm with navigation callbacks
  - Implement `onToggleToRegister` callback to navigate to "/cadastro"
  - Implement `onToggleToForgot` callback (no-op with console log until route exists)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.1, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 15.1, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ]* 1.1 Write unit tests for Login Page
  - Test session verification redirects authenticated users
  - Test loading state transitions correctly
  - Test form renders for unauthenticated users
  - Test navigation callbacks execute router.push() correctly
  - Test error handling for failed session checks
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.6, 6.1, 6.3, 12.5_

- [x] 2. Implement Signup Page with Session Verification
  - Create `/apps/web/src/app/(auth)/cadastro/page.tsx` as client component
  - Add session verification logic using `supabase.auth.getSession()`
  - Implement loading state during session check
  - Add redirect to "/" for authenticated users
  - Render AuthLayout with title "Criar Conta" and subtitle "Junte-se à torcida e garanta seu manto oficial"
  - Render RegisterForm with navigation callbacks
  - Implement `onToggleToLogin` callback to navigate to "/login"
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ]* 2.1 Write unit tests for Signup Page
  - Test session verification redirects authenticated users
  - Test loading state transitions correctly
  - Test form renders for unauthenticated users
  - Test navigation callbacks execute router.push() correctly
  - Test error handling for failed session checks
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 4.6, 6.2, 6.3, 12.5_

- [x] 3. Checkpoint - Verify Core Functionality
  - Manually test navigation to /login and /cadastro routes
  - Verify loading states appear briefly during session checks
  - Verify forms render correctly for unauthenticated users
  - Verify authenticated users are redirected to home page
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 4. Write integration tests for navigation flows
  - Test full login flow from page load to redirect
  - Test full signup flow from page load to redirect
  - Test navigation between login and signup pages
  - Test authenticated user redirect from both pages
  - Test form submission success triggers redirect
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 5. Write E2E tests for complete authentication journey
  - Test complete login journey with real Supabase instance
  - Test complete signup journey with real Supabase instance
  - Test navigation flow between pages
  - Test slow network simulation with loading states
  - Test browser back button behavior after authentication
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 5.1, 5.2, 6.1, 6.2, 16.1, 16.2, 16.3, 16.4_

- [x] 6. Final Checkpoint - Production Readiness Verification
  - Verify both pages are under 50 lines of code
  - Verify no TypeScript errors with `npx tsc --noEmit`
  - Verify responsive design on mobile, tablet, and desktop
  - Verify accessibility with screen reader testing
  - Verify error handling for network failures
  - Verify session persistence across page reloads
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Both pages follow identical implementation patterns for consistency
- Session verification uses client-side Supabase API only
- All authentication logic is delegated to existing components
- Loading states prevent visual flicker during session checks
- Navigation uses Next.js router.push() for client-side transitions
- Forgot password functionality is stubbed until route is implemented
- Pages are production-ready with proper error handling and edge case coverage
