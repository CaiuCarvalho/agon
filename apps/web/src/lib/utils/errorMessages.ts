/**
 * Error Message Utility
 * 
 * Provides consistent error messages across the application
 * based on error codes and types.
 */

/**
 * Get user-friendly error message from error object
 * 
 * @param error - Error object from Supabase or other sources
 * @returns User-friendly error message
 */
export function getErrorMessage(error: any): string {
  // PostgreSQL function not found
  if (error?.code === '42883') {
    return 'Função não configurada. Contate o suporte.';
  }
  
  // Supabase RLS (Row Level Security) error
  if (error?.code === 'PGRST116') {
    return 'Sem permissão para realizar esta ação';
  }
  
  // Unique constraint violation
  if (error?.code === '23505') {
    return 'Este registro já existe';
  }
  
  // Timeout errors
  if (error?.message?.includes('timeout') || error?.name === 'AbortError') {
    return 'Tempo esgotado. Tente novamente.';
  }
  
  // Network errors
  if (error?.message?.includes('fetch failed') || error?.message?.includes('network')) {
    return 'Erro de conexão. Verifique sua internet.';
  }
  
  // Return specific error message if available, otherwise generic
  return error?.message || 'Erro inesperado. Tente novamente.';
}
