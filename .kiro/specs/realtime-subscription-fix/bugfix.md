# Bugfix Requirements Document

## Introduction

This document addresses the Supabase Realtime subscription error occurring in the wishlist and cart hooks. The error "cannot add `postgres_changes` callbacks after `subscribe()`" prevents cross-device synchronization from working correctly. The bug affects both `useWishlist.ts` and `useCart.ts` hooks, breaking real-time updates when users modify their cart or wishlist on different devices.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the useWishlist hook attempts to set up a Realtime subscription THEN the system fails to properly chain the `.on()` and `.subscribe()` methods, resulting in no active subscription

1.2 WHEN the useCart hook attempts to set up a Realtime subscription THEN the system references an undefined `supabase` variable instead of creating a client instance, causing a runtime error

1.3 WHEN either hook tries to add postgres_changes callbacks THEN the system throws error "cannot add `postgres_changes` callbacks after `subscribe()`" because the channel lifecycle is incorrectly managed

1.4 WHEN a user modifies their cart or wishlist on one device THEN the changes do not sync to other devices due to the broken Realtime subscription

### Expected Behavior (Correct)

2.1 WHEN the useWishlist hook sets up a Realtime subscription THEN the system SHALL properly chain `.channel()`, `.on()`, and `.subscribe()` methods in the correct order to establish an active subscription

2.2 WHEN the useCart hook sets up a Realtime subscription THEN the system SHALL create a Supabase client instance using `createClient()` before attempting to create a channel

2.3 WHEN either hook adds postgres_changes callbacks THEN the system SHALL add all callbacks via `.on()` before calling `.subscribe()` to avoid lifecycle errors

2.4 WHEN a user modifies their cart or wishlist on one device THEN the system SHALL sync the changes to other devices in real-time through the active Realtime subscription

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user is not authenticated THEN the system SHALL CONTINUE TO use localStorage for cart and wishlist data without attempting Realtime subscriptions

3.2 WHEN the migration status is not 'complete' for cart THEN the system SHALL CONTINUE TO block cart queries until migration finishes

3.3 WHEN a Realtime event originates from the same client (matching CLIENT_ID) THEN the system SHALL CONTINUE TO filter out the event to prevent loops

3.4 WHEN the useEffect cleanup function runs THEN the system SHALL CONTINUE TO properly unsubscribe and remove channels to prevent memory leaks

3.5 WHEN cart items are updated THEN the system SHALL CONTINUE TO calculate totalItems and subtotal correctly

3.6 WHEN wishlist items are queried THEN the system SHALL CONTINUE TO provide the isInWishlist helper function for O(n) lookups
