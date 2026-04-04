# Implementation Plan: User Profile Page

## Overview

This implementation plan breaks down the User Profile Page feature into discrete coding tasks. The page provides authenticated users with a comprehensive dashboard to manage personal information, delivery addresses, and view order history. The implementation leverages existing components (AddressForm, AvatarSelector, OrderCard, OrderList, VerificationModal) and follows an optimistic UI update pattern for responsive user experience.

## Tasks

- [x] 1. Set up database schema and RLS policies
  - Create `profiles`, `addresses`, `orders`, and `order_items` tables in Supabase
  - Implement Row Level Security (RLS) policies for user data isolation
  - Add unique constraint for default address per user
  - Add check constraints for order status and quantity validation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [ ]* 1.1 Write property test for RLS policy enforcement
  - **Property 9: RLS Policy Enforcement**
  - **Validates: Requirements 8.5, 8.6, 8.7, 8.8**

- [x] 2. Create validation utility functions
  - [x] 2.1 Implement phone validation function
    - Write `validatePhone()` function accepting 10-11 digit Brazilian format
    - Support formats: (XX) XXXXX-XXXX and (XX) XXXX-XXXX
    - _Requirements: 2.6, 2.9_
  
  - [ ]* 2.2 Write property test for phone validation
    - **Property 2: Phone Validation Correctness**
    - **Validates: Requirements 2.6, 2.9**
  
  - [x] 2.3 Implement CPF validation function
    - Write `validateCPF()` function with checksum algorithm
    - Accept 11 digits with or without formatting
    - _Requirements: 2.7, 2.8_
  
  - [ ]* 2.4 Write property test for CPF validation
    - **Property 3: CPF Validation Correctness**
    - **Validates: Requirements 2.7, 2.8**
  
  - [x] 2.5 Implement address validation functions
    - Write `validateZipCode()` for 8-digit validation
    - Write `validateState()` for 2-character validation
    - Write `validateRequiredFields()` for street, number, neighborhood, city
    - _Requirements: 5.4, 5.5, 5.6_
  
  - [ ]* 2.6 Write property tests for address validation
    - **Property 8: ZIP Code Validation**
    - **Property 9: State Code Validation**
    - **Property 10: Required Address Fields Validation**
    - **Validates: Requirements 5.4, 5.5, 5.6**

- [ ] 3. Implement image upload utilities
  - [x] 3.1 Create image compression function
    - Write `compressImage()` function to resize to 400x400px at 80% quality
    - Return base64 data URL
    - _Requirements: 3.5_
  
  - [ ]* 3.2 Write property test for image compression
    - **Property 4: Image Compression Application**
    - **Validates: Requirements 3.5**
  
  - [x] 3.3 Create file type validation function
    - Write `validateImageFile()` to check MIME type starts with 'image/'
    - Enforce 5MB max file size
    - _Requirements: 3.6, 12.7_
  
  - [ ]* 3.4 Write property test for file type validation
    - **Property 5: File Type Validation**
    - **Validates: Requirements 3.6**

- [ ] 4. Create ProfileEditor component
  - [x] 4.1 Implement ProfileEditor component structure
    - Create `apps/web/src/components/profile/ProfileEditor.tsx`
    - Set up component state (isEditing, formData, modal states, isLoading)
    - Implement display mode showing user name, email, avatar, phone, CPF
    - Add edit button to toggle edit mode
    - _Requirements: 1.1, 1.4, 2.1_
  
  - [x] 4.2 Implement profile editing form
    - Create editable form with name, phone, and CPF fields
    - Integrate phone and CPF validation
    - Display inline validation errors
    - Implement form submission with `updateUser()` from Auth Context
    - _Requirements: 2.2, 2.3, 2.6, 2.7, 2.8, 2.9_
  
  - [x] 4.3 Implement optimistic UI updates for profile
    - Apply optimistic update on form submission
    - Rollback on failure with error toast
    - Display success toast on successful update
    - _Requirements: 2.4, 2.5, 11.1, 11.2_
  
  - [x] 4.4 Integrate AvatarSelector modal
    - Add click handler on avatar to open AvatarSelector
    - Pass current avatarUrl and update handler
    - Handle avatar selection and upload callbacks
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.8, 3.9_
  
  - [x] 4.5 Implement placeholder display for missing fields
    - Display "Não informado" for missing name, phone, taxId
    - Display default avatar icon if avatarUrl is missing
    - _Requirements: 1.5_
  
  - [ ]* 4.6 Write property test for placeholder display
    - **Property 1: Profile Data Placeholder Display**
    - **Validates: Requirements 1.5**

- [ ] 5. Create AddressManager component
  - [x] 5.1 Implement AddressManager component structure
    - Create `apps/web/src/components/profile/AddressManager.tsx`
    - Set up component state (addresses, isLoading, isFormOpen, editingAddress)
    - Fetch user addresses on mount using Supabase client
    - Display loading skeleton while fetching
    - _Requirements: 4.1, 4.10_
  
  - [x] 5.2 Implement address list display
    - Render list of addresses with street, number, city, state
    - Display "Padrão" badge for default address
    - Add Edit and Delete buttons for each address
    - Display empty state when no addresses exist
    - _Requirements: 4.1, 4.11_
  
  - [x] 5.3 Implement address creation flow
    - Add "Add Address" button (disabled if 5 addresses exist)
    - Open AddressForm modal in create mode
    - Handle form submission with optimistic UI update
    - Save to `addresses` table via Supabase
    - Display error if limit reached
    - _Requirements: 4.2, 4.8, 4.9, 11.3, 11.4_
  
  - [x] 5.4 Implement address editing flow
    - Open AddressForm modal with existing address data
    - Handle form submission with optimistic UI update
    - Update address in `addresses` table
    - _Requirements: 4.3, 5.8, 5.9_
  
  - [x] 5.5 Implement address deletion flow
    - Display confirmation dialog on delete button click
    - Handle deletion with optimistic UI update
    - Delete from `addresses` table
    - Rollback on failure
    - _Requirements: 4.4, 4.5, 11.5, 11.6_
  
  - [x] 5.6 Implement default address management
    - Add "Set as Default" button for non-default addresses
    - Unset previous default when setting new default
    - Update `is_default` field in database
    - Enforce unique default constraint
    - _Requirements: 4.6, 4.7, 12.6_
  
  - [ ]* 5.7 Write property test for default address uniqueness
    - **Property 6: Default Address Uniqueness**
    - **Validates: Requirements 4.6, 4.7**
  
  - [ ]* 5.8 Write property test for address count limit
    - **Property 7: Address Count Limit Enforcement**
    - **Validates: Requirements 4.8, 4.9**

- [ ] 6. Enhance AddressForm component with CEP lookup
  - [x] 6.1 Verify CEP lookup integration
    - Confirm ViaCEP API integration exists in AddressForm
    - Test CEP auto-fill for street, neighborhood, city, state
    - _Requirements: 5.1, 5.2_
  
  - [x] 6.2 Implement CEP error handling
    - Display error message for invalid CEP
    - Implement fallback to manual entry if API fails
    - Add 5-second timeout for API calls
    - _Requirements: 5.3, 12.3_
  
  - [x] 6.3 Verify address form validation
    - Confirm zipCode, state, and required fields validation
    - Ensure complement field is optional
    - Test form submission and error display
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.10_

- [ ] 7. Create OrderHistoryViewer component
  - [x] 7.1 Implement OrderHistoryViewer component structure
    - Create `apps/web/src/components/profile/OrderHistoryViewer.tsx`
    - Set up component state (orders, isLoading)
    - Fetch user orders with order_items join on mount
    - Display loading spinner while fetching
    - _Requirements: 6.1, 6.4_
  
  - [x] 7.2 Implement order sorting and display
    - Sort orders by createdAt descending (newest first)
    - Pass orders to OrderList component
    - Display empty state when no orders exist
    - _Requirements: 6.2, 6.3, 6.5_
  
  - [ ]* 7.3 Write property test for order sorting
    - **Property 11: Order Sorting Consistency**
    - **Validates: Requirements 6.5**

- [ ] 8. Enhance OrderCard component with status display
  - [x] 8.1 Verify order status configuration
    - Confirm status badge variants for all OrderStatus values
    - Verify status labels, descriptions, and icons
    - Test status display for PENDING, PAID, FAILED, SHIPPED, DELIVERED, CANCELLED
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_
  
  - [x] 8.2 Verify order details expansion
    - Confirm OrderCard expands to show items, quantities, prices
    - Verify tracking code display with copy button
    - _Requirements: 6.6, 6.7, 6.8, 6.10_
  
  - [ ]* 8.3 Write property test for status display mapping
    - **Property 12: Order Status Display Mapping**
    - **Validates: Requirements 6.9, 7.1, 7.8, 7.9**

- [ ] 9. Create main ProfilePage component
  - [x] 9.1 Implement ProfilePage route component
    - Create `apps/web/src/app/perfil/page.tsx` as server component
    - Implement authentication check and redirect to login if unauthenticated
    - Add redirect parameter: `/login?redirect=/perfil`
    - _Requirements: 1.2_
  
  - [x] 9.2 Implement responsive layout
    - Create responsive grid layout for three sections
    - Mobile (< 640px): Stack sections vertically
    - Tablet (640px - 1024px): 2-column grid
    - Desktop (> 1024px): 3-column grid
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 9.3 Integrate ProfileEditor, AddressManager, and OrderHistoryViewer
    - Add ProfileEditor section with user data from Auth Context
    - Add AddressManager section with userId prop
    - Add OrderHistoryViewer section with userId prop
    - _Requirements: 1.1, 4.1, 6.1_
  
  - [x] 9.4 Implement loading state
    - Display loading skeleton while profile data loads
    - Show loading indicators for each section independently
    - _Requirements: 1.3_

- [ ] 10. Implement error handling and edge cases
  - [x] 10.1 Add connection error handling
    - Display connection error message on Supabase failures
    - Add retry button for failed operations
    - _Requirements: 12.1, 12.4_
  
  - [x] 10.2 Add session expiry handling
    - Detect 401 responses and redirect to login
    - Display session expired message
    - Preserve form data in sessionStorage for recovery
    - _Requirements: 12.2_
  
  - [x] 10.3 Add file upload error handling
    - Display file size error for uploads > 5MB
    - Handle corrupted profile data with fallback UI
    - _Requirements: 12.7, 12.8_

- [ ] 11. Implement responsive modal behavior
  - [x] 11.1 Verify AddressForm modal responsiveness
    - Test modal on mobile, tablet, desktop
    - Ensure scrollability on small screens
    - _Requirements: 9.5_
  
  - [x] 11.2 Verify AvatarSelector modal responsiveness
    - Test avatar grid adapts to screen size
    - Ensure modal is usable on mobile
    - _Requirements: 9.6_
  
  - [x] 11.3 Verify OrderCard responsiveness
    - Test card stacks elements vertically on mobile
    - Ensure all content is readable on small screens
    - _Requirements: 9.7_

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Integration and final wiring
  - [x] 13.1 Verify Auth Context integration
    - Confirm `useAuth()` hook provides user data and `updateUser()` method
    - Test profile updates flow through Auth Context
    - _Requirements: 2.3_
  
  - [x] 13.2 Verify Supabase client configuration
    - Confirm Supabase client is properly initialized
    - Test all database operations (profiles, addresses, orders)
    - Verify RLS policies are enforced
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 13.3 Add toast notifications
    - Integrate `sonner` for success and error toasts
    - Add toasts for profile updates, address operations, errors
    - _Requirements: 2.4, 2.5, 3.8, 5.10_
  
  - [x] 13.4 Test complete user flows
    - Test login → navigate to /perfil → view profile
    - Test edit profile → update → verify success
    - Test add/edit/delete address flows
    - Test view order history and expand details
    - Test avatar upload and selection
    - _Requirements: 1.1, 2.1, 4.1, 6.1, 3.1_

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Existing components (AddressForm, AvatarSelector, OrderCard, OrderList, VerificationModal) are reused where possible
- Optimistic UI updates are implemented for all mutations to provide responsive feedback
- Database schema must be created first before implementing components
- RLS policies ensure users can only access their own data
