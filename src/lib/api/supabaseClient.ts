/**
 * Typed wrapper around Supabase client for consistent error handling
 * and type safety across all API calls
 */

import { supabase } from '@/lib/supabase';
import { ApiResponse, ApiError } from './types';

/**
 * Convert unknown error to ApiError
 */
export function handleError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      details: error,
    };
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    return {
      message: String(err.message || 'An unknown error occurred'),
      code: String(err.code || 'UNKNOWN_ERROR'),
      details: error,
    };
  }

  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    details: error,
  };
}

/**
 * Generic typed query wrapper
 */
export async function query<T>(
  table: string,
  options?: {
    select?: string;
    filters?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }
): Promise<ApiResponse<T[]>> {
  try {
    let queryBuilder = supabase
      .from(table)
      .select(options?.select || '*');

    // Apply filters
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (options?.order) {
      queryBuilder = queryBuilder.order(
        options.order.column,
        { ascending: options.order.ascending ?? true }
      );
    }

    // Apply limit
    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      return { data: null, error: handleError(error) };
    }

    return { data: data as T[], error: null };
  } catch (error) {
    return { data: null, error: handleError(error) };
  }
}

/**
 * Generic typed insert wrapper
 */
export async function insert<T>(
  table: string,
  data: Partial<T> | Partial<T>[]
): Promise<ApiResponse<T>> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data as never)
      .select()
      .single();

    if (error) {
      return { data: null, error: handleError(error) };
    }

    return { data: result as T, error: null };
  } catch (error) {
    return { data: null, error: handleError(error) };
  }
}

/**
 * Generic typed update wrapper
 */
export async function update<T>(
  table: string,
  id: string,
  data: Partial<T>
): Promise<ApiResponse<T>> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: handleError(error) };
    }

    return { data: result as T, error: null };
  } catch (error) {
    return { data: null, error: handleError(error) };
  }
}

/**
 * Generic typed delete wrapper
 */
export async function deleteRecord(
  table: string,
  id: string
): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      return { data: null, error: handleError(error) };
    }

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: handleError(error) };
  }
}

/**
 * Batch insert with error handling
 */
export async function batchInsert<T>(
  table: string,
  records: Partial<T>[]
): Promise<ApiResponse<T[]>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert(records as never)
      .select();

    if (error) {
      return { data: null, error: handleError(error) };
    }

    return { data: data as T[], error: null };
  } catch (error) {
    return { data: null, error: handleError(error) };
  }
}

export const apiClient = {
  query,
  insert,
  update,
  delete: deleteRecord,
  batchInsert,
  handleError,
};

