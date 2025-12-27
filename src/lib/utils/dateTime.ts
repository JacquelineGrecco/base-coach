/**
 * Centralized date and time formatting utilities
 */

/**
 * Format seconds into MM:SS format
 * @param seconds - Total seconds
 * @returns Formatted time string (e.g., "05:30")
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format a date to localized short date string
 * @param date - Date to format
 * @returns Formatted date (e.g., "21/12/2025")
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a date to localized full date string
 * @param date - Date to format
 * @returns Formatted date (e.g., "21 de dezembro de 2025")
 */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format a date with time
 * @param date - Date to format
 * @returns Formatted date and time (e.g., "21/12/2025 às 14:30")
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateStr} às ${timeStr}`;
}

/**
 * Get relative time string (e.g., "2 dias atrás")
 * @param date - Date to compare
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'agora mesmo';
  } else if (diffMins < 60) {
    return `há ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffHours < 24) {
    return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  } else if (diffDays < 7) {
    return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
  }
}

/**
 * Format duration in minutes to readable string
 * @param minutes - Duration in minutes
 * @returns Formatted duration (e.g., "1h 30min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Get ISO string for date input
 * @param date - Date to convert
 * @returns ISO date string (YYYY-MM-DD)
 */
export function toISODate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}


