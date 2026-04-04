# Requirements Document: User Profile Page

## Introduction

The User Profile Page (/perfil) is a comprehensive dashboard that allows authenticated users to manage their personal information, addresses, and view their order history. This feature integrates existing profile components (AddressForm, AvatarSelector, OrderCard, OrderList, VerificationModal) into a cohesive user experience, providing full CRUD capabilities for profile data and addresses, along with read-only access to order history.

The page is protected by authentication middleware and leverages Supabase for data persistence, following the domain rules established in the Agon e-commerce platform.

## Glossary

- **Profile_Page**: The main user interface at `/perfil` that displays user information, addresses, and order history
- **Profile_Editor**: The component responsible for editing user personal information (name, avatar, phone, CPF)
- **Address_Manager**: The component responsible for CRUD operations on user addresses
- **Order_History_Viewer**: The component responsible for displaying past orders and their status
- **Auth_Context**: The authentication context providing user data and update methods via `useAuth()` hook
- **Supabase_Client**: The database client for persisting profile, address, and order data
- **Verification_Flow**: The security process requiring email confirmation for sensitive data changes (email, CPF)
- **Avatar_Upload**: The process of selecting or uploading a user avatar image
- **CEP_Lookup**: The automatic address completion service using ViaCEP API
- **Order_Status**: The current state of an order (PENDING, PAID, FAILED, SHIPPED, DELIVERED, CANCELLED)

## Requirements

### Requirement 1: Display User Profile Information

**User Story:** As a logged-in user, I want to view my profile information on the /perfil page, so that I can see my current account details.

#### Acceptance Criteria

1. WHEN the user navigates to `/perfil`, THE Profile_Page SHALL display the user's name, email, avatar, phone, and CPF
2. WHEN the user is not authenticated, THE Profile_Page SHALL redirect to `/login` with a redirect parameter
3. WHILE the profile data is loading, THE Profile_Page SHALL display a loading skeleton
4. THE Profile_Page SHALL display the avatar using the AvatarSelector component with the current avatar URL
5. WHEN the user's profile data is incomplete, THE Profile_Page SHALL display placeholder text for missing fields

### Requirement 2: Edit Profile Information

**User Story:** As a logged-in user, I want to edit my profile information, so that I can keep my account details up to date.

#### Acceptance Criteria

1. WHEN the user clicks the edit button, THE Profile_Editor SHALL display an editable form with current values
2. THE Profile_Editor SHALL allow editing of name, phone, and CPF fields
3. WHEN the user submits valid changes, THE Profile_Editor SHALL call `updateUser()` from Auth_Context
4. WHEN the profile update succeeds, THE Profile_Editor SHALL display a success toast notification
5. WHEN the profile update fails, THE Profile_Editor SHALL display an error toast and preserve the form state
6. THE Profile_Editor SHALL validate phone format (10-11 digits, Brazilian format)
7. THE Profile_Editor SHALL validate CPF format (11 digits, valid checksum)
8. WHEN the user enters an invalid CPF, THE Profile_Editor SHALL display an error message
9. WHEN the user enters an invalid phone, THE Profile_Editor SHALL display an error message

### Requirement 3: Avatar Selection and Upload

**User Story:** As a logged-in user, I want to change my avatar, so that I can personalize my profile.

#### Acceptance Criteria

1. WHEN the user clicks on their avatar, THE Profile_Page SHALL open the AvatarSelector modal
2. THE AvatarSelector SHALL display classic avatar options from CLASSIC_AVATARS
3. WHEN the user selects a classic avatar, THE Avatar_Upload SHALL update the user's avatarUrl via `updateUser()`
4. THE AvatarSelector SHALL allow file upload for custom avatars
5. WHEN the user uploads a custom image, THE Avatar_Upload SHALL compress the image using `compressImage()`
6. THE Avatar_Upload SHALL validate that uploaded files are images (MIME type check)
7. WHEN the upload succeeds, THE Avatar_Upload SHALL update the avatarUrl and close the modal
8. WHEN the upload fails, THE Avatar_Upload SHALL display an error toast
9. THE AvatarSelector SHALL display the currently selected avatar with a checkmark indicator

### Requirement 4: Manage Addresses (CRUD)

**User Story:** As a logged-in user, I want to manage my delivery addresses, so that I can have multiple shipping options for my orders.

#### Acceptance Criteria

1. THE Address_Manager SHALL display a list of all user addresses from the `addresses` table
2. WHEN the user clicks "Add Address", THE Address_Manager SHALL open the AddressForm modal in create mode
3. WHEN the user clicks "Edit" on an address, THE Address_Manager SHALL open the AddressForm modal with existing data
4. WHEN the user clicks "Delete" on an address, THE Address_Manager SHALL display a confirmation dialog
5. WHEN the user confirms deletion, THE Address_Manager SHALL delete the address from the database
6. THE Address_Manager SHALL mark one address as default (isDefault = true)
7. WHEN the user sets a new default address, THE Address_Manager SHALL unset the previous default
8. THE Address_Manager SHALL limit users to a maximum of 5 addresses
9. WHEN the user attempts to add a 6th address, THE Address_Manager SHALL display an error message
10. WHILE addresses are loading, THE Address_Manager SHALL display a loading skeleton
11. WHEN the user has no addresses, THE Address_Manager SHALL display an empty state with "Add Address" CTA

### Requirement 5: Address Form Validation and CEP Lookup

**User Story:** As a logged-in user, I want the address form to auto-complete from my CEP, so that I can quickly add addresses without typing everything.

#### Acceptance Criteria

1. WHEN the user enters an 8-digit CEP, THE AddressForm SHALL call the ViaCEP API
2. WHEN the CEP is valid, THE AddressForm SHALL auto-fill street, neighborhood, city, and state fields
3. WHEN the CEP is invalid, THE AddressForm SHALL display an error message
4. THE AddressForm SHALL validate that zipCode has exactly 8 digits
5. THE AddressForm SHALL validate that state has exactly 2 characters
6. THE AddressForm SHALL validate that street, number, neighborhood, and city are not empty
7. THE AddressForm SHALL allow complement to be optional
8. WHEN the user submits a valid address, THE AddressForm SHALL save to the `addresses` table
9. WHEN the save succeeds, THE AddressForm SHALL close the modal and refresh the address list
10. WHEN the save fails, THE AddressForm SHALL display an error toast

### Requirement 6: View Order History

**User Story:** As a logged-in user, I want to view my past orders, so that I can track my purchases and their status.

#### Acceptance Criteria

1. THE Order_History_Viewer SHALL display all orders for the authenticated user from the `orders` table
2. THE Order_History_Viewer SHALL use the OrderList component to render orders
3. WHEN the user has no orders, THE Order_History_Viewer SHALL display an empty state with a CTA to browse products
4. WHILE orders are loading, THE Order_History_Viewer SHALL display a loading spinner
5. THE Order_History_Viewer SHALL sort orders by creation date (newest first)
6. THE Order_History_Viewer SHALL display order ID, date, total, and status for each order
7. WHEN the user clicks on an order, THE Order_History_Viewer SHALL expand the OrderCard to show details
8. THE OrderCard SHALL display order items, quantities, prices, and tracking information
9. THE OrderCard SHALL display status-specific messages and icons based on Order_Status
10. WHEN an order has a tracking code, THE OrderCard SHALL display it with a copy button

### Requirement 7: Order Status Display

**User Story:** As a logged-in user, I want to see the current status of my orders, so that I know when to expect delivery.

#### Acceptance Criteria

1. THE OrderCard SHALL display status badges with appropriate colors for each Order_Status
2. WHEN the order status is PENDING, THE OrderCard SHALL display "Aguardando Pagamento" with a warning badge
3. WHEN the order status is PAID, THE OrderCard SHALL display "Pagamento Confirmado" with a success badge
4. WHEN the order status is FAILED, THE OrderCard SHALL display "Pagamento Falhou" with a destructive badge
5. WHEN the order status is SHIPPED, THE OrderCard SHALL display "Em Trânsito" with a default badge
6. WHEN the order status is DELIVERED, THE OrderCard SHALL display "Entregue" with a secondary badge
7. WHEN the order status is CANCELLED, THE OrderCard SHALL display "Cancelado" with an outline badge
8. THE OrderCard SHALL display contextual descriptions for each status
9. THE OrderCard SHALL display appropriate icons for each status (Clock, CheckCircle2, XCircle, Truck, Package)

### Requirement 8: Database Schema Requirements

**User Story:** As a system, I need proper database tables to store profile, address, and order data, so that user information persists correctly.

#### Acceptance Criteria

1. THE Supabase_Client SHALL have a `profiles` table with columns: id (FK to auth.users), name, avatar_url, phone, tax_id, role, created_at, updated_at
2. THE Supabase_Client SHALL have an `addresses` table with columns: id, user_id (FK), zip_code, street, number, complement, neighborhood, city, state, is_default, created_at, updated_at
3. THE Supabase_Client SHALL have an `orders` table with columns: id, user_id (FK), status, total, payment_method, shipping_address_id (FK), tracking_code, created_at, updated_at
4. THE Supabase_Client SHALL have an `order_items` table with columns: id, order_id (FK), product_id (FK), quantity, unit_price, size, created_at
5. THE `profiles` table SHALL have RLS policies allowing users to read and update only their own profile
6. THE `addresses` table SHALL have RLS policies allowing users to read, create, update, and delete only their own addresses
7. THE `orders` table SHALL have RLS policies allowing users to read only their own orders
8. THE `order_items` table SHALL have RLS policies allowing users to read items only from their own orders

### Requirement 9: Responsive Layout

**User Story:** As a user on any device, I want the profile page to be responsive, so that I can manage my profile on mobile, tablet, or desktop.

#### Acceptance Criteria

1. THE Profile_Page SHALL use a responsive grid layout that adapts to screen size
2. WHEN viewed on mobile (< 640px), THE Profile_Page SHALL stack sections vertically
3. WHEN viewed on tablet (640px - 1024px), THE Profile_Page SHALL display sections in a 2-column grid
4. WHEN viewed on desktop (> 1024px), THE Profile_Page SHALL display sections in a 3-column grid
5. THE AddressForm modal SHALL be responsive and scrollable on small screens
6. THE AvatarSelector modal SHALL be responsive and display avatars in a grid that adapts to screen size
7. THE OrderCard SHALL be responsive and stack elements vertically on mobile

### Requirement 10: Security and Verification for Sensitive Changes

**User Story:** As a system, I need to verify sensitive profile changes, so that unauthorized users cannot modify critical information.

#### Acceptance Criteria

1. WHEN the user attempts to change their email, THE Profile_Editor SHALL open the VerificationModal
2. WHEN the user attempts to change their CPF, THE Profile_Editor SHALL open the VerificationModal
3. THE VerificationModal SHALL send a 6-digit verification code to the user's current email
4. THE VerificationModal SHALL accept a 6-digit OTP input
5. WHEN the user enters a valid OTP, THE Verification_Flow SHALL complete the profile update
6. WHEN the user enters an invalid OTP, THE Verification_Flow SHALL display an error message
7. THE verification code SHALL expire after 15 minutes
8. WHEN the code expires, THE Verification_Flow SHALL display an error and allow resending

### Requirement 11: Optimistic UI Updates

**User Story:** As a user, I want immediate feedback when I make changes, so that the interface feels responsive.

#### Acceptance Criteria

1. WHEN the user updates their profile, THE Profile_Editor SHALL immediately update the UI before the server responds
2. WHEN the server update fails, THE Profile_Editor SHALL rollback the UI to the previous state
3. WHEN the user adds an address, THE Address_Manager SHALL immediately add it to the list with a loading indicator
4. WHEN the address save fails, THE Address_Manager SHALL remove the optimistic entry and display an error
5. WHEN the user deletes an address, THE Address_Manager SHALL immediately remove it from the list
6. WHEN the deletion fails, THE Address_Manager SHALL restore the address and display an error

### Requirement 12: Error Handling and Edge Cases

**User Story:** As a user, I want clear error messages when something goes wrong, so that I know how to fix the issue.

#### Acceptance Criteria

1. WHEN the Supabase_Client connection fails, THE Profile_Page SHALL display a connection error message
2. WHEN the user's session expires, THE Profile_Page SHALL redirect to login with a session expired message
3. WHEN the ViaCEP API is unavailable, THE AddressForm SHALL allow manual entry of all fields
4. WHEN the user submits a form with network errors, THE Profile_Page SHALL display a retry button
5. WHEN the user attempts to delete their only address, THE Address_Manager SHALL allow deletion (no minimum requirement)
6. WHEN the user attempts to unset the default address, THE Address_Manager SHALL require selecting a new default first
7. WHEN the avatar upload exceeds size limits, THE Avatar_Upload SHALL display a file size error
8. WHEN the user's profile data is corrupted, THE Profile_Page SHALL display a fallback UI with contact support message

## Correctness Properties

### Property 1: Profile Data Consistency (Invariant)

**Property:** For all profile updates, the data displayed in the UI SHALL match the data stored in the `profiles` table after the update completes.

**Test Strategy:** Property-based test that generates random profile updates and verifies UI state matches database state.

### Property 2: Address Default Uniqueness (Invariant)

**Property:** For any user, at most one address SHALL have `is_default = true` at any given time.

**Test Strategy:** Property-based test that performs random address CRUD operations and verifies only one default exists.

### Property 3: Address Count Limit (Invariant)

**Property:** For any user, the number of addresses SHALL never exceed 5.

**Test Strategy:** Property-based test that attempts to create multiple addresses and verifies the limit is enforced.

### Property 4: Order History Immutability (Invariant)

**Property:** Users SHALL NOT be able to modify or delete orders through the Profile_Page (read-only access).

**Test Strategy:** Integration test verifying that no update/delete operations are exposed in the UI or API.

### Property 5: CEP Lookup Idempotence (Idempotence)

**Property:** Calling the ViaCEP API with the same CEP multiple times SHALL return the same address data.

**Test Strategy:** Property-based test that calls ViaCEP with the same CEP multiple times and verifies consistent results.

### Property 6: Avatar Update Round-Trip (Round Trip)

**Property:** For all avatar updates, uploading an avatar and then reading the profile SHALL return the same avatar URL.

**Test Strategy:** Property-based test that uploads random avatars and verifies the URL is correctly stored and retrieved.

### Property 7: Form Validation Consistency (Metamorphic)

**Property:** For all invalid inputs, the form validation SHALL reject the input before submission.

**Test Strategy:** Property-based test that generates invalid CPF, phone, and address data and verifies validation errors.

### Property 8: Optimistic Update Rollback (Error Condition)

**Property:** When a server update fails, the UI SHALL rollback to the previous state within 100ms.

**Test Strategy:** Integration test that simulates server failures and measures rollback timing.

### Property 9: RLS Policy Enforcement (Security)

**Property:** Users SHALL NOT be able to read or modify profiles, addresses, or orders belonging to other users.

**Test Strategy:** Integration test that attempts cross-user access and verifies RLS policies block unauthorized access.

### Property 10: Session Expiry Handling (Error Condition)

**Property:** When the user's session expires during a profile update, THE Profile_Page SHALL redirect to login without data loss.

**Test Strategy:** Integration test that simulates session expiry and verifies redirect behavior and error messaging.
