import { describe, it, expect } from 'vitest';
import {
  validatePhone,
  validateCPF,
  validateZipCode,
  validateState,
  validateRequiredFields,
} from './validation';

describe('Validation Utilities', () => {
  describe('validatePhone', () => {
    it('should accept 10-digit phone numbers', () => {
      expect(validatePhone('1234567890')).toBe(true);
      expect(validatePhone('(11) 1234-5678')).toBe(true);
    });

    it('should accept 11-digit phone numbers', () => {
      expect(validatePhone('12345678901')).toBe(true);
      expect(validatePhone('(11) 91234-5678')).toBe(true);
    });

    it('should reject phone numbers with less than 10 digits', () => {
      expect(validatePhone('123456789')).toBe(false);
      expect(validatePhone('(11) 1234-567')).toBe(false);
    });

    it('should reject phone numbers with more than 11 digits', () => {
      expect(validatePhone('123456789012')).toBe(false);
    });
  });

  describe('validateCPF', () => {
    it('should accept valid CPF with checksum', () => {
      expect(validateCPF('11144477735')).toBe(true); // Valid CPF
      expect(validateCPF('111.444.777-35')).toBe(true); // Valid CPF with formatting
    });

    it('should reject CPF with invalid checksum', () => {
      expect(validateCPF('11144477736')).toBe(false); // Invalid checksum
    });

    it('should reject CPF with less than 11 digits', () => {
      expect(validateCPF('1114447773')).toBe(false);
    });

    it('should reject CPF with more than 11 digits', () => {
      expect(validateCPF('111444777350')).toBe(false);
    });

    it('should reject CPF with all same digits', () => {
      expect(validateCPF('11111111111')).toBe(false);
      expect(validateCPF('00000000000')).toBe(false);
    });
  });

  describe('validateZipCode', () => {
    it('should accept 8-digit zip codes', () => {
      expect(validateZipCode('12345678')).toBe(true);
      expect(validateZipCode('12345-678')).toBe(true); // With formatting
    });

    it('should reject zip codes with less than 8 digits', () => {
      expect(validateZipCode('1234567')).toBe(false);
    });

    it('should reject zip codes with more than 8 digits', () => {
      expect(validateZipCode('123456789')).toBe(false);
    });
  });

  describe('validateState', () => {
    it('should accept 2-character state codes', () => {
      expect(validateState('SP')).toBe(true);
      expect(validateState('RJ')).toBe(true);
    });

    it('should reject state codes with less than 2 characters', () => {
      expect(validateState('S')).toBe(false);
    });

    it('should reject state codes with more than 2 characters', () => {
      expect(validateState('SPP')).toBe(false);
    });
  });

  describe('validateRequiredFields', () => {
    it('should accept when all required fields are filled', () => {
      expect(
        validateRequiredFields({
          street: 'Rua Exemplo',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
        })
      ).toBe(true);
    });

    it('should reject when street is empty', () => {
      expect(
        validateRequiredFields({
          street: '',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
        })
      ).toBe(false);
    });

    it('should reject when number is empty', () => {
      expect(
        validateRequiredFields({
          street: 'Rua Exemplo',
          number: '',
          neighborhood: 'Centro',
          city: 'São Paulo',
        })
      ).toBe(false);
    });

    it('should reject when neighborhood is empty', () => {
      expect(
        validateRequiredFields({
          street: 'Rua Exemplo',
          number: '123',
          neighborhood: '',
          city: 'São Paulo',
        })
      ).toBe(false);
    });

    it('should reject when city is empty', () => {
      expect(
        validateRequiredFields({
          street: 'Rua Exemplo',
          number: '123',
          neighborhood: 'Centro',
          city: '',
        })
      ).toBe(false);
    });

    it('should reject when fields contain only whitespace', () => {
      expect(
        validateRequiredFields({
          street: '   ',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
        })
      ).toBe(false);
    });

    it('should reject when fields are undefined', () => {
      expect(
        validateRequiredFields({
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
        })
      ).toBe(false);
    });
  });
});
