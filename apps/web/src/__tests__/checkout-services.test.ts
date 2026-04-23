import { describe, it, expect, vi, afterEach } from 'vitest'
import { validationService } from '@/modules/checkout/services/validationService'
import { viaCEPService } from '@/modules/checkout/services/viaCEPService'

// ─── validationService ────────────────────────────────────────────────────────

describe('validationService', () => {
  describe('validateCEP', () => {
    it('accepts formatted CEP (XXXXX-XXX)', () => {
      const result = validationService.validateCEP('01310-100')
      expect(result.valid).toBe(true)
    })

    it('accepts unformatted 8-digit CEP', () => {
      const result = validationService.validateCEP('01310100')
      expect(result.valid).toBe(true)
    })

    it('rejects CEP with fewer than 8 digits', () => {
      expect(validationService.validateCEP('0131').valid).toBe(false)
    })

    it('rejects CEP with more than 8 digits', () => {
      expect(validationService.validateCEP('013101000').valid).toBe(false)
    })

    it('rejects empty string', () => {
      expect(validationService.validateCEP('').valid).toBe(false)
    })

    it('returns formatted value when valid', () => {
      const result = validationService.validateCEP('01310100')
      expect(result.valid).toBe(true)
      expect(result.formatted).toBeDefined()
    })

    it('returns input as formatted when invalid', () => {
      const result = validationService.validateCEP('abc')
      expect(result.valid).toBe(false)
      expect(result.formatted).toBe('abc')
    })
  })

  describe('validatePhone', () => {
    it('accepts valid Brazilian mobile (11 digits)', () => {
      expect(validationService.validatePhone('11999990000').valid).toBe(true)
    })

    it('accepts phone with formatting characters', () => {
      expect(validationService.validatePhone('(11) 99999-0000').valid).toBe(true)
    })

    it('rejects phone too short', () => {
      expect(validationService.validatePhone('1199999').valid).toBe(false)
    })

    it('rejects empty string', () => {
      expect(validationService.validatePhone('').valid).toBe(false)
    })

    it('returns input as formatted when invalid', () => {
      const result = validationService.validatePhone('123')
      expect(result.valid).toBe(false)
      expect(result.formatted).toBe('123')
    })
  })

  describe('validateState', () => {
    it('accepts valid Brazilian states', () => {
      expect(validationService.validateState('SP')).toBe(true)
      expect(validationService.validateState('RJ')).toBe(true)
      expect(validationService.validateState('MG')).toBe(true)
      expect(validationService.validateState('RS')).toBe(true)
      expect(validationService.validateState('DF')).toBe(true)
    })

    it('rejects invalid state codes', () => {
      expect(validationService.validateState('XX')).toBe(false)
      expect(validationService.validateState('BR')).toBe(false)
      expect(validationService.validateState('')).toBe(false)
    })

    it('is case-sensitive (lowercase invalid)', () => {
      expect(validationService.validateState('sp')).toBe(false)
    })
  })

  describe('formatCurrency', () => {
    it('formats 0 as R$ 0,00', () => {
      expect(validationService.formatCurrency(0)).toContain('0,00')
    })

    it('formats 100 with R$ prefix', () => {
      const result = validationService.formatCurrency(100)
      expect(result).toMatch(/R\$/)
      expect(result).toContain('100,00')
    })
  })

  describe('sanitizeInput', () => {
    it('removes script tags', () => {
      const result = validationService.sanitizeInput('<script>alert("xss")</script>hello')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
      expect(result).toContain('hello')
    })

    it('removes HTML tags', () => {
      const result = validationService.sanitizeInput('<b>bold</b> text')
      expect(result).not.toContain('<b>')
      expect(result).toContain('bold')
      expect(result).toContain('text')
    })

    it('trims leading and trailing whitespace', () => {
      expect(validationService.sanitizeInput('  hello  ')).toBe('hello')
    })

    it('preserves plain text unchanged', () => {
      expect(validationService.sanitizeInput('Nome Completo')).toBe('Nome Completo')
    })

    it('handles empty string', () => {
      expect(validationService.sanitizeInput('')).toBe('')
    })
  })
})

// ─── viaCEPService ────────────────────────────────────────────────────────────

describe('viaCEPService.validateCEP', () => {
  it('returns true for 8-digit string', () => {
    expect(viaCEPService.validateCEP('01310100')).toBe(true)
  })

  it('returns true for formatted CEP (8 digits total)', () => {
    expect(viaCEPService.validateCEP('01310-100')).toBe(true)
  })

  it('returns false for 7-digit CEP', () => {
    expect(viaCEPService.validateCEP('0131010')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(viaCEPService.validateCEP('')).toBe(false)
  })
})

describe('viaCEPService.formatCEP', () => {
  it('formats 8-digit string as XXXXX-XXX', () => {
    expect(viaCEPService.formatCEP('01310100')).toBe('01310-100')
  })

  it('re-formats already formatted CEP', () => {
    expect(viaCEPService.formatCEP('01310-100')).toBe('01310-100')
  })

  it('returns original string if fewer than 8 digits', () => {
    expect(viaCEPService.formatCEP('0131')).toBe('0131')
  })

  it('returns original string if more than 8 digits', () => {
    expect(viaCEPService.formatCEP('013101000')).toBe('013101000')
  })
})

describe('viaCEPService.fetchAddressByCEP', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null for CEP shorter than 8 digits', async () => {
    const result = await viaCEPService.fetchAddressByCEP('0131')
    expect(result).toBeNull()
  })

  it('returns null for CEP with letters', async () => {
    const result = await viaCEPService.fetchAddressByCEP('ABCDE-FGH')
    expect(result).toBeNull()
  })

  it('returns address data when API responds successfully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    }))

    const result = await viaCEPService.fetchAddressByCEP('01310100')
    expect(result).toEqual({
      street: 'Avenida Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    })
  })

  it('returns null when API response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const result = await viaCEPService.fetchAddressByCEP('99999999')
    expect(result).toBeNull()
  })

  it('returns null when ViaCEP returns erro:true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ erro: true }),
    }))
    const result = await viaCEPService.fetchAddressByCEP('99999999')
    expect(result).toBeNull()
  })

  it('returns null when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch failed')))
    const result = await viaCEPService.fetchAddressByCEP('01310100')
    expect(result).toBeNull()
  })

  it('returns null on AbortError (timeout)', async () => {
    const abortError = new Error('The user aborted a request.')
    abortError.name = 'AbortError'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError))
    const result = await viaCEPService.fetchAddressByCEP('01310100')
    expect(result).toBeNull()
  })

  it('removes non-digits before calling API (passes clean 8-digit CEP)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ logradouro: 'Rua', bairro: 'B', localidade: 'C', uf: 'SP' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await viaCEPService.fetchAddressByCEP('01310-100')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('01310100'),
      expect.any(Object)
    )
  })
})
