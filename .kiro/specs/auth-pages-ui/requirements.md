# Requirements Document: Auth Pages UI

## Introduction

This document specifies the requirements for implementing the Login and Signup UI pages for the Agon e-commerce platform. The pages will integrate existing, fully functional authentication components (AuthLayout, LoginForm, RegisterForm) with the Next.js 14 App Router structure. The implementation focuses on creating minimal page components that compose existing components while ensuring proper client-side rendering, session management, navigation flows, and production-ready behavior including automatic redirection for authenticated users.

## Glossary

- **Login_Page**: The Next.js page component at `/apps/web/src/app/(auth)/login/page.tsx` that renders the login interface
- **Signup_Page**: The Next.js page component at `/apps/web/src/app/(auth)/cadastro/page.tsx` that renders the registration interface
- **AuthLayout**: The existing layout component that provides visual design, animations, and responsive behavior for authentication pages
- **LoginForm**: The existing form component with Supabase Auth integration and Zod validation for user login
- **RegisterForm**: The existing form component with Supabase Auth integration and Zod validation for user registration
- **Client_Component**: A Next.js component marked with "use client" directive that enables client-side interactivity
- **Navigation_Flow**: The ability for users to switch between login and signup pages through UI interactions
- **Supabase_Auth**: The authentication service integration that handles user login and registration
- **Session_Check**: Client-side verification of user authentication state via Supabase session
- **Auth_Redirect**: Automatic navigation away from auth pages when user is already authenticated
- **Loading_State**: Visual feedback displayed while session verification is in progress

## Requirements

### Requirement 1: Session Verification and Auth Redirect (CRITICAL)

**User Story:** As an authenticated user, I want to be automatically redirected away from login/signup pages, so that I don't see authentication forms when I'm already logged in.

#### Acceptance Criteria

1. THE Login_Page SHALL check Supabase session on component mount using client-side session verification
2. THE Signup_Page SHALL check Supabase session on component mount using client-side session verification
3. WHEN a user with active session accesses "/login", THE Login_Page SHALL redirect to "/" immediately
4. WHEN a user with active session accesses "/cadastro", THE Signup_Page SHALL redirect to "/" immediately
5. THE session check SHALL execute before rendering AuthLayout or form components
6. THE session verification SHALL use Supabase client-side API (NOT server-side rendering)
7. THE redirect SHALL use Next.js router.push() for client-side navigation

### Requirement 2: Loading State During Session Check

**User Story:** As a user, I want to see appropriate feedback while the system verifies my authentication status, so that I understand the page is loading.

#### Acceptance Criteria

1. THE Login_Page SHALL display a loading indicator while session verification is in progress
2. THE Signup_Page SHALL display a loading indicator while session verification is in progress
3. THE loading indicator SHALL be a simple centered spinner or "Carregando..." text
4. THE pages SHALL NOT render LoginForm or RegisterForm until session check completes
5. THE loading state SHALL prevent visual flicker or hydration mismatch
6. THE loading indicator SHALL be visible for the duration of the session check only

### Requirement 3: Login Page Implementation

**User Story:** As a user, I want to access a functional login page at `/login`, so that I can authenticate and access my account.

#### Acceptance Criteria

1. THE Login_Page SHALL be a Client_Component marked with "use client" directive
2. THE Login_Page SHALL render the AuthLayout component with title "Entrar" and subtitle "Acesse sua conta para continuar sua jornada"
3. THE Login_Page SHALL render the LoginForm component within the AuthLayout
4. WHEN a user clicks the signup toggle in LoginForm, THE Login_Page SHALL navigate to "/cadastro" using router.push()
5. THE Login_Page SHALL be accessible at the route path "/login"
6. THE Login_Page SHALL only render after session verification confirms no active session

### Requirement 4: Signup Page Implementation

**User Story:** As a new user, I want to access a functional signup page at `/cadastro`, so that I can create an account and join the platform.

#### Acceptance Criteria

1. THE Signup_Page SHALL be a Client_Component marked with "use client" directive
2. THE Signup_Page SHALL render the AuthLayout component with title "Criar Conta" and subtitle "Junte-se à torcida e garanta seu manto oficial"
3. THE Signup_Page SHALL render the RegisterForm component within the AuthLayout
4. WHEN a user clicks the login toggle in RegisterForm, THE Signup_Page SHALL navigate to "/login" using router.push()
5. THE Signup_Page SHALL be accessible at the route path "/cadastro"
6. THE Signup_Page SHALL only render after session verification confirms no active session

### Requirement 5: Post-Authentication Redirect

**User Story:** As a user, I want to be redirected to the home page after successful login or signup, so that I can immediately access the platform.

#### Acceptance Criteria

1. WHEN authentication succeeds via LoginForm, THE Login_Page SHALL redirect to "/" using router.push()
2. WHEN registration succeeds via RegisterForm, THE Signup_Page SHALL redirect to "/" using router.push()
3. THE redirect SHALL execute immediately after successful authentication
4. THE redirect SHALL NOT depend on implicit Supabase behavior
5. THE redirect SHALL be implemented explicitly in the page component callbacks

### Requirement 6: Navigation Flow Between Pages

**User Story:** As a user, I want to seamlessly switch between login and signup pages, so that I can choose the appropriate action without losing context.

#### Acceptance Criteria

1. WHEN LoginForm receives onToggleToRegister callback, THE callback SHALL execute router.push("/cadastro")
2. WHEN RegisterForm receives onToggleToLogin callback, THE callback SHALL execute router.push("/login")
3. THE Navigation_Flow SHALL use Next.js useRouter hook for client-side navigation
4. THE Navigation_Flow SHALL preserve the AuthLayout visual state during transitions
5. THE navigation SHALL NOT cause full page reload

### Requirement 7: Forgot Password Flow Handling

**User Story:** As a user who forgot my password, I want to access password recovery functionality, so that I can regain access to my account.

#### Acceptance Criteria

1. THE Login_Page SHALL handle the onToggleToForgot callback from LoginForm
2. THE onToggleToForgot callback SHALL navigate to "/forgot-password" route using router.push()
3. IF the "/forgot-password" route does not exist, THE callback SHALL be temporarily disabled (no-op function)
4. THE implementation SHALL NOT leave navigation pointing to non-existent routes
5. THE forgot password functionality SHALL be documented as future enhancement if not implemented

### Requirement 8: Component Integration

**User Story:** As a developer, I want the pages to properly integrate existing components, so that authentication functionality works without modification.

#### Acceptance Criteria

1. THE Login_Page SHALL pass onToggleToRegister callback to LoginForm
2. THE Login_Page SHALL pass onToggleToForgot callback to LoginForm
3. THE Signup_Page SHALL pass onToggleToLogin callback to RegisterForm
4. THE pages SHALL NOT modify or duplicate existing component logic
5. THE pages SHALL maintain existing Supabase_Auth integration without changes
6. THE pages SHALL NOT implement custom authentication logic
7. THE pages SHALL delegate all authentication operations to existing hooks and components

### Requirement 9: Client-Side Only Implementation

**User Story:** As a developer, I want the auth pages to be fully client-side, so that we avoid hydration mismatches and SSR complications.

#### Acceptance Criteria

1. THE Login_Page SHALL be marked with "use client" directive
2. THE Signup_Page SHALL be marked with "use client" directive
3. THE pages SHALL NOT use server-side rendering for authentication logic
4. THE pages SHALL NOT use Next.js server components for auth state
5. THE session verification SHALL execute entirely on the client side
6. THE implementation SHALL prevent hydration mismatch errors

### Requirement 10: Responsive Design Compliance

**User Story:** As a user on any device, I want the authentication pages to display correctly, so that I can authenticate regardless of screen size.

#### Acceptance Criteria

1. THE Login_Page SHALL render responsively on mobile, tablet, and desktop viewports
2. THE Signup_Page SHALL render responsively on mobile, tablet, and desktop viewports
3. THE pages SHALL inherit responsive behavior from AuthLayout component
4. THE pages SHALL NOT introduce custom responsive logic that conflicts with AuthLayout
5. THE loading state SHALL be responsive and centered on all screen sizes

### Requirement 11: Accessibility Standards

**User Story:** As a user with accessibility needs, I want the authentication pages to be accessible, so that I can navigate and authenticate using assistive technologies.

#### Acceptance Criteria

1. THE Login_Page SHALL maintain semantic HTML structure from AuthLayout and LoginForm
2. THE Signup_Page SHALL maintain semantic HTML structure from AuthLayout and RegisterForm
3. THE pages SHALL preserve existing ARIA attributes from child components
4. THE pages SHALL NOT introduce accessibility barriers through improper component composition
5. THE loading state SHALL include appropriate ARIA labels for screen readers

### Requirement 12: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when authentication actions succeed or fail, so that I understand the system state.

#### Acceptance Criteria

1. THE Login_Page SHALL preserve LoginForm error handling via Zod validation
2. THE Signup_Page SHALL preserve RegisterForm error handling via Zod validation
3. THE pages SHALL preserve existing toast notifications from Supabase_Auth integration
4. WHEN authentication fails, THE forms SHALL display error messages without page navigation
5. WHEN session check fails, THE pages SHALL handle errors gracefully and render the form
6. THE pages SHALL NOT expose raw error messages to users

### Requirement 13: Domain Rules Compliance

**User Story:** As a platform maintainer, I want the authentication pages to comply with domain rules, so that security and business logic remain intact.

#### Acceptance Criteria

1. THE pages SHALL NOT manipulate authentication state outside of Supabase_Auth
2. THE pages SHALL NOT implement custom authentication logic
3. THE pages SHALL comply with "Segurança Isolada do Roteiro" from domain-rules.md
4. THE pages SHALL delegate all authentication operations to existing hooks and components
5. THE session verification SHALL use official Supabase client methods only

### Requirement 14: Performance and Loading States

**User Story:** As a user, I want responsive feedback during authentication operations, so that I know the system is processing my request.

#### Acceptance Criteria

1. THE Login_Page SHALL preserve LoginForm loading states during authentication
2. THE Signup_Page SHALL preserve RegisterForm loading states during registration
3. THE pages SHALL NOT introduce additional loading delays beyond session check
4. THE session verification SHALL complete within 500ms under normal conditions
5. THE pages SHALL render the form within 200ms after session check completes
6. THE loading state SHALL be visually consistent with the platform design system

### Requirement 15: Code Quality and Maintainability

**User Story:** As a developer, I want the page implementations to be minimal and maintainable, so that future changes are straightforward.

#### Acceptance Criteria

1. THE Login_Page SHALL contain no more than 50 lines of code (increased from 30 to accommodate session logic)
2. THE Signup_Page SHALL contain no more than 50 lines of code (increased from 30 to accommodate session logic)
3. THE pages SHALL use TypeScript with proper type definitions
4. THE pages SHALL follow Next.js 14 App Router conventions
5. THE pages SHALL NOT duplicate logic from existing components
6. THE session verification logic SHALL be clear and well-commented
7. THE pages SHALL use consistent patterns for session check and redirect

### Requirement 16: Production Readiness

**User Story:** As a platform operator, I want the auth pages to be production-ready, so that they handle real-world scenarios correctly.

#### Acceptance Criteria

1. THE pages SHALL prevent authenticated users from accessing auth forms
2. THE pages SHALL handle session persistence across page reloads
3. THE pages SHALL provide consistent UX without visual flicker
4. THE pages SHALL handle edge cases (slow network, session expiry) gracefully
5. THE pages SHALL be ready for deployment without additional modifications
6. THE implementation SHALL support the foundation for future features (catalog, cart, checkout)
