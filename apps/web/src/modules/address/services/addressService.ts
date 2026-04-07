/**
 * Address Service
 * 
 * Handles all address-related database operations for authenticated users.
 * Implements atomic operations, retry logic, and data transformation.
 * 
 * Key features:
 * - Zod validation for all inputs
 * - Retry logic for network errors
 * - Snake_case to camelCase transformation
 * - Atomic default address updates
 * - 5-address limit enforcement
 * - User ownership validation
 */

import { createClient } from '@/lib/supabase/client';
import { addressSchema, addressUpdateSchema } from '../contracts';
import type { Address, AddressInput } from '../types';
import { cartService } from '@/modules/cart/services/cartService';
import { isRetryableError, getUserFriendlyMessage } from '@/lib/utils/databaseErrors';

const { withRetry } = cartService;

/**
 * Transform database row (snake_case) to Address (camelCase)
 */
function transformAddressRow(row: any): Address {
  return {
    id: row.id,
    userId: row.user_id,
    zipCode: row.zip_code,
    street: row.street,
    number: row.number,
    complement: row.complement,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Address Service
 * All operations for authenticated users
 */
export const addressService = {
  /**
   * Get all addresses for authenticated user
   * Ordered by default status and creation date
   */
  async getAddresses(userId: string): Promise<Address[]> {
    const supabase = createClient();
    
    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
    });
    
    if (error) throw error;
    
    return (data || []).map(transformAddressRow);
  },
  
  /**
   * Create new address for authenticated user
   * Enforces 5-address limit
   * Handles atomic default address updates
   */
  async createAddress(userId: string, input: AddressInput): Promise<Address> {
    // Validate input BEFORE creating client
    const validated = addressSchema.parse(input);
    
    const supabase = createClient();
    
    // Check address limit
    const { data: existingAddresses, error: countError } = await supabase
      .from('addresses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (countError) throw countError;
    
    const addressCount = existingAddresses?.length || 0;
    if (addressCount >= 5) {
      throw new Error('Você atingiu o limite de 5 endereços');
    }
    
    // If setting as default, unset previous default atomically
    if (validated.isDefault) {
      const { error: unsetError } = await withRetry(async () => {
        return await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('is_default', true);
      });
      
      if (unsetError) throw unsetError;
    }
    
    // Insert new address
    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          zip_code: validated.zipCode,
          street: validated.street,
          number: validated.number,
          complement: validated.complement,
          neighborhood: validated.neighborhood,
          city: validated.city,
          state: validated.state,
          is_default: validated.isDefault,
        })
        .select()
        .single();
    });
    
    if (error) throw error;
    
    return transformAddressRow(data);
  },
  
  /**
   * Update existing address
   * Validates user ownership
   * Handles atomic default address updates
   */
  async updateAddress(
    userId: string,
    addressId: string,
    input: Partial<AddressInput>
  ): Promise<Address> {
    // Validate updates BEFORE creating client
    const validated = addressUpdateSchema.parse(input);
    
    const supabase = createClient();
    
    // If setting as default, unset previous default atomically
    if (validated.isDefault) {
      const { error: unsetError } = await withRetry(async () => {
        return await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('is_default', true)
          .neq('id', addressId); // Don't unset the one we're updating
      });
      
      if (unsetError) throw unsetError;
    }
    
    // Build update object with snake_case keys
    const updateData: any = {};
    if (validated.zipCode !== undefined) updateData.zip_code = validated.zipCode;
    if (validated.street !== undefined) updateData.street = validated.street;
    if (validated.number !== undefined) updateData.number = validated.number;
    if (validated.complement !== undefined) updateData.complement = validated.complement;
    if (validated.neighborhood !== undefined) updateData.neighborhood = validated.neighborhood;
    if (validated.city !== undefined) updateData.city = validated.city;
    if (validated.state !== undefined) updateData.state = validated.state;
    if (validated.isDefault !== undefined) updateData.is_default = validated.isDefault;
    
    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('addresses')
        .update(updateData)
        .eq('id', addressId)
        .eq('user_id', userId) // Ensure user owns this address
        .select()
        .single();
    });
    
    if (error) throw error;
    
    return transformAddressRow(data);
  },
  
  /**
   * Delete address
   * Validates user ownership before deleting
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await withRetry(async () => {
      return await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId); // Ensure user owns this address
    });
    
    if (error) throw error;
  },
  
  /**
   * Set address as default
   * Atomically unsets previous default and sets new default
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    const supabase = createClient();
    
    // Unset previous default
    const { error: unsetError } = await withRetry(async () => {
      return await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    });
    
    if (unsetError) throw unsetError;
    
    // Set new default
    const { error: setError } = await withRetry(async () => {
      return await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', userId); // Ensure user owns this address
    });
    
    if (setError) throw setError;
  },
};
