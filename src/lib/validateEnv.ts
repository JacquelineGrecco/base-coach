/**
 * Runtime Environment Variable Validation
 * Validates that required environment variables are present at runtime
 */

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  GEMINI_API_KEY?: string; // Server-side only
  NEXT_PUBLIC_SUPPORT_WHATSAPP?: string;
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validates client-side environment variables
 * Call this in components or client-side code
 */
export function validateClientEnv(): void {
  const missingVars: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    
    if (typeof window !== 'undefined') {
      // In browser - show user-friendly error
      console.error('❌ Configuration Error:', errorMessage);
      console.error('Please contact support or check deployment configuration.');
    }
    
    throw new EnvironmentError(errorMessage);
  }
}

/**
 * Validates server-side environment variables
 * Call this in API routes or server components
 */
export function validateServerEnv(): void {
  const missingVars: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (!process.env.GEMINI_API_KEY) {
    missingVars.push('GEMINI_API_KEY');
  }

  if (missingVars.length > 0) {
    throw new EnvironmentError(
      `Missing required server environment variables: ${missingVars.join(', ')}`
    );
  }
}

/**
 * Gets all environment variables with validation
 */
export function getEnv(): EnvConfig {
  validateClientEnv();

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_SUPPORT_WHATSAPP: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP,
  };
}

/**
 * Checks if environment is properly configured (non-throwing)
 */
export function isEnvConfigured(): boolean {
  try {
    validateClientEnv();
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets a specific environment variable with validation
 */
export function getRequiredEnv(key: keyof EnvConfig): string {
  const value = process.env[key];
  
  if (!value) {
    throw new EnvironmentError(`Missing required environment variable: ${key}`);
  }
  
  return value;
}

/**
 * Gets an optional environment variable
 */
export function getOptionalEnv(key: keyof EnvConfig): string | undefined {
  return process.env[key];
}


