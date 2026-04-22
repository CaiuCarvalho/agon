import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { formatBRL } from '@/lib/format'
import { isAdminRole } from '@/lib/auth/roles'
import { buildApiUrl } from '@/lib/url'
import { validateImageFile, CLASSIC_AVATARS } from '@/lib/avatar-utils'

// ─── formatBRL ────────────────────────────────────────────────────────────────

describe('formatBRL', () => {
  it('formats zero as R$ 0,00', () => {
    expect(formatBRL(0)).toMatch(/R\$/)
    expect(formatBRL(0)).toContain('0,00')
  })

  it('formats integer value correctly', () => {
    const result = formatBRL(100)
    expect(result).toMatch(/R\$/)
    expect(result).toContain('100,00')
  })

  it('formats decimal value with two places', () => {
    expect(formatBRL(99.9)).toContain('99,90')
    expect(formatBRL(9.99)).toContain('9,99')
  })

  it('formats thousands with dot separator', () => {
    expect(formatBRL(1000)).toContain('1.000,00')
    expect(formatBRL(1500.5)).toContain('1.500,50')
  })

  it('formats large values', () => {
    expect(formatBRL(1_000_000)).toContain('1.000.000,00')
  })

  it('formats negative values', () => {
    const result = formatBRL(-50)
    expect(result).toMatch(/R\$/)
    expect(result).toContain('50,00')
  })

  it('includes R$ currency symbol', () => {
    expect(formatBRL(1)).toMatch(/R\$/)
  })

  it('rounds correctly at 2 decimal places', () => {
    // 0.005 rounds to 0.01 in most implementations
    expect(formatBRL(0.001)).toContain('0,00')
  })
})

// ─── isAdminRole ──────────────────────────────────────────────────────────────

describe('isAdminRole', () => {
  it('returns true when profileRole is admin', () => {
    expect(isAdminRole({ profileRole: 'admin', metadataRole: undefined })).toBe(true)
  })

  it('returns true when metadataRole is admin', () => {
    expect(isAdminRole({ profileRole: undefined, metadataRole: 'admin' })).toBe(true)
  })

  it('returns true when both are admin', () => {
    expect(isAdminRole({ profileRole: 'admin', metadataRole: 'admin' })).toBe(true)
  })

  it('returns false when profileRole is user and metadataRole undefined', () => {
    expect(isAdminRole({ profileRole: 'user', metadataRole: undefined })).toBe(false)
  })

  it('returns false when both are null', () => {
    expect(isAdminRole({ profileRole: null, metadataRole: null })).toBe(false)
  })

  it('returns false when both are undefined', () => {
    expect(isAdminRole({ profileRole: undefined, metadataRole: undefined })).toBe(false)
  })

  it('returns true when profileRole is admin even if metadataRole is user', () => {
    expect(isAdminRole({ profileRole: 'admin', metadataRole: 'user' })).toBe(true)
  })

  it('returns false when profileRole is empty string', () => {
    expect(isAdminRole({ profileRole: '', metadataRole: undefined })).toBe(false)
  })

  it('is case-sensitive (Admin !== admin)', () => {
    expect(isAdminRole({ profileRole: 'Admin', metadataRole: undefined })).toBe(false)
  })
})

// ─── buildApiUrl ──────────────────────────────────────────────────────────────

describe('buildApiUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.NEXT_PUBLIC_API_URL
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('prepends /api to the path with default base', () => {
    expect(buildApiUrl('/products', 'http://localhost:3000')).toBe('http://localhost:3000/api/products')
  })

  it('adds leading slash to path that lacks one', () => {
    expect(buildApiUrl('products', 'http://localhost:3000')).toBe('http://localhost:3000/api/products')
  })

  it('removes trailing slash from base URL', () => {
    expect(buildApiUrl('/items', 'http://localhost:3000/')).toBe('http://localhost:3000/api/items')
  })

  it('strips /api suffix from base URL before adding /api', () => {
    expect(buildApiUrl('/products', 'http://localhost:3000/api')).toBe('http://localhost:3000/api/products')
  })

  it('falls back to NEXT_PUBLIC_API_URL env when rawBaseUrl is undefined', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://staging.example.com'
    expect(buildApiUrl('/checkout')).toBe('http://staging.example.com/api/checkout')
  })

  it('falls back to default production URL when no args given', () => {
    const result = buildApiUrl('/health')
    expect(result).toBe('https://agonimports.com/api/health')
  })

  it('handles nested paths', () => {
    expect(buildApiUrl('/admin/orders/123', 'http://localhost:3000')).toBe(
      'http://localhost:3000/api/admin/orders/123'
    )
  })

  it('explicit rawBaseUrl takes precedence over env var', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://env.example.com'
    expect(buildApiUrl('/test', 'http://explicit.com')).toBe('http://explicit.com/api/test')
  })
})

// ─── validateImageFile ────────────────────────────────────────────────────────

describe('validateImageFile', () => {
  const makeFile = (type: string, sizeBytes: number): File =>
    new File([new Uint8Array(sizeBytes)], 'test', { type })

  it('accepts a valid JPEG image under 5MB', () => {
    expect(validateImageFile(makeFile('image/jpeg', 1024))).toBe(true)
  })

  it('accepts a valid PNG image', () => {
    expect(validateImageFile(makeFile('image/png', 1024))).toBe(true)
  })

  it('accepts a valid WebP image', () => {
    expect(validateImageFile(makeFile('image/webp', 1024))).toBe(true)
  })

  it('rejects a non-image MIME type (PDF)', () => {
    expect(validateImageFile(makeFile('application/pdf', 1024))).toBe(false)
  })

  it('rejects a text file', () => {
    expect(validateImageFile(makeFile('text/plain', 1024))).toBe(false)
  })

  it('rejects a file exactly at 5MB limit + 1 byte', () => {
    const overLimit = 5 * 1024 * 1024 + 1
    expect(validateImageFile(makeFile('image/jpeg', overLimit))).toBe(false)
  })

  it('accepts a file exactly at the 5MB limit', () => {
    const atLimit = 5 * 1024 * 1024
    expect(validateImageFile(makeFile('image/jpeg', atLimit))).toBe(true)
  })

  it('rejects empty MIME type', () => {
    expect(validateImageFile(makeFile('', 1024))).toBe(false)
  })
})

// ─── CLASSIC_AVATARS ──────────────────────────────────────────────────────────

describe('CLASSIC_AVATARS', () => {
  it('has exactly 3 avatars', () => {
    expect(CLASSIC_AVATARS).toHaveLength(3)
  })

  it('each avatar has id, name and url', () => {
    for (const avatar of CLASSIC_AVATARS) {
      expect(avatar.id).toBeTruthy()
      expect(avatar.name).toBeTruthy()
      expect(avatar.url).toMatch(/^https:\/\//)
    }
  })

  it('avatar ids are unique', () => {
    const ids = CLASSIC_AVATARS.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
