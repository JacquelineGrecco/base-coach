/**
 * Supabase Error Handler
 * Provides utilities for handling common Supabase errors and session issues
 */

export class SupabaseSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseSessionError';
  }
}

/**
 * Checks if an error is related to authentication/session issues
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('session') ||
    errorMessage.includes('auth') ||
    errorMessage.includes('jwt') ||
    errorMessage.includes('token') ||
    errorCode === 'pgrst301' || // JWT expired
    errorCode === 'pgrst302' || // JWT invalid
    error.status === 401 ||
    error.statusCode === 401
  );
}

/**
 * Checks if an error is a 404/not found error
 */
export function isNotFoundError(error: any): boolean {
  if (!error) return false;
  
  return (
    error.status === 404 ||
    error.statusCode === 404 ||
    error.code === 'PGRST116' // PostgreSQL not found
  );
}

/**
 * Checks if an error is due to RLS (Row Level Security) policy
 */
export function isRLSError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  
  return (
    errorMessage.includes('row-level security') ||
    errorMessage.includes('policy') ||
    errorMessage.includes('permission denied') ||
    error.code === '42501' // PostgreSQL insufficient privilege
  );
}

/**
 * Provides a user-friendly error message based on the error type
 */
export function getFriendlyErrorMessage(error: any): string {
  if (isAuthError(error)) {
    return 'Sua sessão expirou. Por favor, faça login novamente.';
  }
  
  if (isNotFoundError(error)) {
    return 'Dados não encontrados. Verifique se você tem acesso a este recurso.';
  }
  
  if (isRLSError(error)) {
    return 'Você não tem permissão para acessar este recurso.';
  }
  
  return 'Ocorreu um erro. Por favor, tente novamente.';
}

/**
 * Logs error details for debugging
 */
export function logSupabaseError(error: any, context: string): void {
  console.error(`[Supabase Error - ${context}]`, {
    message: error.message,
    code: error.code,
    status: error.status || error.statusCode,
    details: error.details,
    hint: error.hint,
  });
}

