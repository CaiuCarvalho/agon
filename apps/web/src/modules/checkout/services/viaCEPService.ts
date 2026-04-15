/**
 * ViaCEP Service
 *
 * Integrates with ViaCEP API to fetch Brazilian address data by CEP
 */

import { z } from 'zod';
import type { AddressData } from '@/modules/payment/types';

const viaCEPResponseSchema = z.object({
  logradouro: z.string().default(''),
  bairro: z.string().default(''),
  localidade: z.string().default(''),
  uf: z.string().default(''),
  erro: z.boolean().optional(),
});

export const viaCEPService = {
  /**
   * Fetch address data by CEP
   * Returns null if CEP not found or API error
   */
  async fetchAddressByCEP(cep: string): Promise<AddressData | null> {
    // Remove non-digits
    const cleanedCEP = cep.replace(/\D/g, '');

    if (cleanedCEP.length !== 8) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch(
        `https://viacep.com.br/ws/${cleanedCEP}/json/`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('ViaCEP API error:', response.status);
        return null;
      }

      const raw = await response.json();
      const parseResult = viaCEPResponseSchema.safeParse(raw);

      if (!parseResult.success || parseResult.data.erro) {
        return null;
      }

      const data = parseResult.data;
      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('ViaCEP request timeout');
      } else {
        console.error('Failed to fetch CEP data:', error);
      }
      return null;
    }
  },

  /**
   * Validate CEP format
   */
  validateCEP(cep: string): boolean {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.length === 8;
  },

  /**
   * Format CEP as XXXXX-XXX
   */
  formatCEP(cep: string): string {
    const cleaned = cep.replace(/\D/g, '');

    if (cleaned.length !== 8) {
      return cep;
    }

    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  },
};
