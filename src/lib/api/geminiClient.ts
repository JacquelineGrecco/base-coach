/**
 * Typed wrapper around Gemini AI client with retry logic
 * and consistent error handling
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ApiError, handleError } from './supabaseClient';

let ai: GoogleGenAI | null = null;

/**
 * Initialize and get Gemini client (lazy initialization)
 */
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to .env.local');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

interface GenerateContentOptions<T> {
  model?: string;
  prompt: string;
  schema?: {
    type: typeof Type[keyof typeof Type];
    properties?: Record<string, unknown>;
    items?: unknown;
    required?: string[];
  };
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate content with automatic retry on failure
 */
export async function generateWithRetry<T>(
  options: GenerateContentOptions<T>
): Promise<{ data: T | null; error: ApiError | null }> {
  const {
    model = 'gemini-2.5-flash',
    prompt,
    schema,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const client = getGeminiClient();
      
      const config: Record<string, unknown> = {};
      
      if (schema) {
        config.responseMimeType = "application/json";
        config.responseSchema = schema;
      }

      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text;
      if (!text) {
        lastError = {
          message: 'Empty response from Gemini API',
          code: 'EMPTY_RESPONSE',
        };
        continue;
      }

      // Parse JSON if schema was provided
      if (schema) {
        const parsed = JSON.parse(text) as T;
        return { data: parsed, error: null };
      }

      // Return text as-is if no schema
      return { data: text as T, error: null };

    } catch (error) {
      lastError = handleError(error);
      
      // Don't retry on certain errors
      if (lastError.message.includes('API key') || lastError.message.includes('authentication')) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await sleep(retryDelay * Math.pow(2, attempt));
      }
    }
  }

  return {
    data: null,
    error: lastError || {
      message: 'Failed to generate content after retries',
      code: 'MAX_RETRIES_EXCEEDED',
    },
  };
}

/**
 * Generate content without retry (single attempt)
 */
export async function generateContent<T>(
  prompt: string,
  schema?: GenerateContentOptions<T>['schema'],
  model = 'gemini-2.5-flash'
): Promise<{ data: T | null; error: ApiError | null }> {
  return generateWithRetry<T>({
    model,
    prompt,
    schema,
    maxRetries: 1,
  });
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return !!(apiKey && apiKey !== 'your-gemini-api-key-here');
}

export const geminiClient = {
  generateContent,
  generateWithRetry,
  isConfigured: isGeminiConfigured,
  Type, // Re-export Type for convenience
};

