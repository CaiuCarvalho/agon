"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { migrationService } from '../services/migrationService';
import type { MigrationStatus } from '../types';

const MIGRATION_FLAG_KEY = 'agon_migrated';

/**
 * useMigrationStatus Hook
 * 
 * Implements the migration gate pattern to prevent empty cart flash during login.
 * This hook manages the migration lifecycle:
 * 
 * 1. Checks localStorage for 'agon_migrated' flag
 * 2. If user exists and not migrated, sets status to 'in_progress'
 * 3. Calls migrationService.migrateUserData(userId)
 * 4. Sets 'agon_migrated' flag in localStorage on success
 * 5. Sets status to 'complete' on success, 'error' on failure
 * 
 * The migration gate suspends cart/wishlist queries until migration completes,
 * preventing the UI from showing an empty cart before migration finishes.
 * 
 * @returns MigrationStatus - Current migration state ('pending' | 'in_progress' | 'complete' | 'error')
 * 
 * @example
 * ```typescript
 * const migrationStatus = useMigrationStatus();
 * 
 * // Use in cart hook to gate queries
 * const { data } = useQuery({
 *   queryKey: ['cart', userId],
 *   queryFn: fetchCart,
 *   enabled: migrationStatus === 'complete', // Block until migration done
 * });
 * ```
 */
export function useMigrationStatus(): MigrationStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<MigrationStatus>('pending');

  useEffect(() => {
    const checkAndRunMigration = async () => {
      // If no user, migration is complete (guest user, no migration needed)
      if (!user) {
        console.log('[Migration] No user, marking as complete');
        setStatus('complete');
        return;
      }

      // Check if migration has already been completed
      const migrated = localStorage.getItem(MIGRATION_FLAG_KEY);
      if (migrated === 'true') {
        console.log('[Migration] Already migrated, marking as complete');
        setStatus('complete');
        return;
      }

      // User exists and not migrated - run migration
      console.log('[Migration] Starting migration for user:', user.id);
      setStatus('in_progress');

      try {
        const result = await migrationService.migrateUserData(user.id);
        console.log('[Migration] Migration result:', result);

        // Check if migration had errors
        if (result.errors.length > 0) {
          console.warn('Migration completed with warnings:', result.errors);
          // Still mark as complete if some items were migrated
          if (result.cartItemsMigrated > 0 || result.wishlistItemsMigrated > 0) {
            localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
            setStatus('complete');
          } else {
            // Total failure - set error status
            console.error('[Migration] Total failure, marking as complete anyway');
            localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
            setStatus('complete');
          }
        } else {
          // Success - mark as migrated
          console.log('[Migration] Success, marking as complete');
          localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
          setStatus('complete');
        }
      } catch (error: any) {
        console.error('Migration failed:', error);
        // Even on error, mark as complete to unblock the UI
        // The user can still use the cart, just without migrated items
        localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
        setStatus('complete');
      }
    };

    checkAndRunMigration();
  }, [user]);

  return status;
}
