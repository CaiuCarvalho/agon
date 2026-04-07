/**
 * Database Error Utilities
 * 
 * Provides consistent error handling across all services.
 * Maps PostgreSQL and Supabase error codes to user-friendly messages.
 * Identifies retryable errors for network resilience.
 */

/**
 * Standard database error codes
 */
export const DATABASE_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  NOT_NULL_VIOLATION: '23502',
  FOREIGN_KEY_VIOLATION: '23503',
  RPC_NOT_FOUND: '42883',
  CONNECTION_ERROR: 'PGRST301',
  TIMEOUT: 'PGRST504',
} as const;

/**
 * Determine if an error should trigger retry logic
 * 
 * @param error - Error object from Supabase or PostgreSQL
 * @returns true if the error is retryable (network/connection issues)
 */
export function isRetryableError(error: any): boolean {
  const retryableCodes = [
    DATABASE_ERROR_CODES.CONNECTION_ERROR,
    DATABASE_ERROR_CODES.TIMEOUT,
    '08000', // PostgreSQL connection exception
    '08003', // PostgreSQL connection does not exist
    '08006', // PostgreSQL connection failure
    '57P03', // PostgreSQL cannot connect now
  ];
  
  return (
    retryableCodes.includes(error.code) ||
    error.message?.includes('fetch failed') ||
    error.message?.includes('network') ||
    error.message?.includes('timeout')
  );
}

/**
 * Get user-friendly error message based on error code
 * 
 * @param error - Error object from Supabase or PostgreSQL
 * @returns User-friendly error message in Portuguese
 */
export function getUserFriendlyMessage(error: any): string {
  switch (error.code) {
    case DATABASE_ERROR_CODES.UNIQUE_VIOLATION:
      return 'Este item já existe';
    case DATABASE_ERROR_CODES.NOT_NULL_VIOLATION:
      return 'Dados obrigatórios ausentes';
    case DATABASE_ERROR_CODES.FOREIGN_KEY_VIOLATION:
      return 'Produto não encontrado';
    case DATABASE_ERROR_CODES.RPC_NOT_FOUND:
      return 'Função do banco de dados não encontrada';
    case DATABASE_ERROR_CODES.CONNECTION_ERROR:
      return 'Erro de conexão com o banco de dados';
    case DATABASE_ERROR_CODES.TIMEOUT:
      return 'Tempo limite excedido';
    default:
      return error.message || 'Erro ao processar operação';
  }
}
