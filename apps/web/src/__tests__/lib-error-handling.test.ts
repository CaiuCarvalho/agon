import { describe, it, expect } from 'vitest'
import {
  isRetryableError,
  getUserFriendlyMessage,
  DATABASE_ERROR_CODES,
} from '@/lib/utils/databaseErrors'
import { getErrorMessage } from '@/lib/utils/errorMessages'

// ─── isRetryableError ─────────────────────────────────────────────────────────

describe('isRetryableError', () => {
  it('returns true for CONNECTION_ERROR code (PGRST301)', () => {
    expect(isRetryableError({ code: 'PGRST301' })).toBe(true)
  })

  it('returns true for TIMEOUT code (PGRST504)', () => {
    expect(isRetryableError({ code: 'PGRST504' })).toBe(true)
  })

  it('returns true for PostgreSQL connection exception (08000)', () => {
    expect(isRetryableError({ code: '08000' })).toBe(true)
  })

  it('returns true for PostgreSQL connection does not exist (08003)', () => {
    expect(isRetryableError({ code: '08003' })).toBe(true)
  })

  it('returns true for PostgreSQL connection failure (08006)', () => {
    expect(isRetryableError({ code: '08006' })).toBe(true)
  })

  it('returns true for PostgreSQL cannot connect now (57P03)', () => {
    expect(isRetryableError({ code: '57P03' })).toBe(true)
  })

  it('returns true when message includes "fetch failed"', () => {
    expect(isRetryableError({ code: 'OTHER', message: 'fetch failed unexpectedly' })).toBe(true)
  })

  it('returns true when message includes "network"', () => {
    expect(isRetryableError({ code: 'OTHER', message: 'network error occurred' })).toBe(true)
  })

  it('returns true when message includes "timeout"', () => {
    expect(isRetryableError({ code: 'OTHER', message: 'request timeout' })).toBe(true)
  })

  it('returns false for unique constraint violation (23505)', () => {
    expect(isRetryableError({ code: '23505', message: 'duplicate key' })).toBe(false)
  })

  it('returns false for generic errors without retryable messages', () => {
    expect(isRetryableError({ code: 'PGRST116', message: 'row not found' })).toBe(false)
  })

  it('returns false for null error code and unrelated message', () => {
    expect(isRetryableError({ code: null, message: 'invalid input' })).toBe(false)
  })
})

// ─── getUserFriendlyMessage ───────────────────────────────────────────────────

describe('getUserFriendlyMessage', () => {
  it('returns "Este item já existe" for UNIQUE_VIOLATION (23505)', () => {
    expect(getUserFriendlyMessage({ code: '23505' })).toBe('Este item já existe')
  })

  it('returns "Dados obrigatórios ausentes" for NOT_NULL_VIOLATION (23502)', () => {
    expect(getUserFriendlyMessage({ code: '23502' })).toBe('Dados obrigatórios ausentes')
  })

  it('returns "Produto não encontrado" for FOREIGN_KEY_VIOLATION (23503)', () => {
    expect(getUserFriendlyMessage({ code: '23503' })).toBe('Produto não encontrado')
  })

  it('returns "Função do banco de dados não encontrada" for RPC_NOT_FOUND (42883)', () => {
    expect(getUserFriendlyMessage({ code: '42883' })).toBe('Função do banco de dados não encontrada')
  })

  it('returns "Erro de conexão com o banco de dados" for CONNECTION_ERROR (PGRST301)', () => {
    expect(getUserFriendlyMessage({ code: 'PGRST301' })).toBe('Erro de conexão com o banco de dados')
  })

  it('returns "Tempo limite excedido" for TIMEOUT (PGRST504)', () => {
    expect(getUserFriendlyMessage({ code: 'PGRST504' })).toBe('Tempo limite excedido')
  })

  it('returns error.message for unknown codes when message is present', () => {
    expect(getUserFriendlyMessage({ code: 'UNKNOWN', message: 'custom error' })).toBe('custom error')
  })

  it('returns fallback string when code unknown and message absent', () => {
    expect(getUserFriendlyMessage({ code: 'UNKNOWN' })).toBe('Erro ao processar operação')
  })

  it('DATABASE_ERROR_CODES constants match expected values', () => {
    expect(DATABASE_ERROR_CODES.UNIQUE_VIOLATION).toBe('23505')
    expect(DATABASE_ERROR_CODES.NOT_NULL_VIOLATION).toBe('23502')
    expect(DATABASE_ERROR_CODES.FOREIGN_KEY_VIOLATION).toBe('23503')
    expect(DATABASE_ERROR_CODES.RPC_NOT_FOUND).toBe('42883')
    expect(DATABASE_ERROR_CODES.CONNECTION_ERROR).toBe('PGRST301')
    expect(DATABASE_ERROR_CODES.TIMEOUT).toBe('PGRST504')
  })
})

// ─── getErrorMessage ──────────────────────────────────────────────────────────

describe('getErrorMessage', () => {
  it('returns "Função não configurada" for code 42883', () => {
    expect(getErrorMessage({ code: '42883' })).toBe('Função não configurada. Contate o suporte.')
  })

  it('returns "Sem permissão" for PGRST116', () => {
    expect(getErrorMessage({ code: 'PGRST116' })).toBe('Sem permissão para realizar esta ação')
  })

  it('returns "Este registro já existe" for 23505', () => {
    expect(getErrorMessage({ code: '23505' })).toBe('Este registro já existe')
  })

  it('returns timeout message when message includes "timeout"', () => {
    expect(getErrorMessage({ message: 'request timeout after 5s' })).toBe('Tempo esgotado. Tente novamente.')
  })

  it('returns timeout message for AbortError name', () => {
    expect(getErrorMessage({ name: 'AbortError' })).toBe('Tempo esgotado. Tente novamente.')
  })

  it('returns network error message when message includes "fetch failed"', () => {
    expect(getErrorMessage({ message: 'fetch failed' })).toBe('Erro de conexão. Verifique sua internet.')
  })

  it('returns network error message when message includes "network"', () => {
    expect(getErrorMessage({ message: 'network unreachable' })).toBe('Erro de conexão. Verifique sua internet.')
  })

  it('returns specific error message when no special code matches', () => {
    expect(getErrorMessage({ code: 'OTHER', message: 'something broke' })).toBe('something broke')
  })

  it('returns generic fallback when error has no message', () => {
    expect(getErrorMessage({})).toBe('Erro inesperado. Tente novamente.')
  })

  it('handles null gracefully', () => {
    expect(getErrorMessage(null)).toBe('Erro inesperado. Tente novamente.')
  })

  it('handles undefined gracefully', () => {
    expect(getErrorMessage(undefined)).toBe('Erro inesperado. Tente novamente.')
  })
})
