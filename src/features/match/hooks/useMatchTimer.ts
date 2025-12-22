import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'basecoach:sessionTimer';

interface TimerState {
  duration: number;
  isPaused: boolean;
  startedAt: number;
}

interface UseMatchTimerReturn {
  duration: number;
  isPaused: boolean;
  formattedTime: string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  toggle: () => void;
}

/**
 * Custom hook for managing match timer with localStorage persistence
 * Automatically saves state on pause/resume for session recovery
 */
export function useMatchTimer(autoStart = true): UseMatchTimerReturn {
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(!autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Save to localStorage
  const saveToStorage = useCallback((state: TimerState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save timer state:', error);
    }
  }, []);

  // Load from localStorage
  const loadFromStorage = useCallback((): TimerState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load timer state:', error);
    }
    return null;
  }, []);

  // Clear localStorage
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear timer state:', error);
    }
  }, []);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setDuration(stored.duration);
      setIsPaused(stored.isPaused);
    }
  }, [loadFromStorage]);

  // Timer interval effect
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          // Auto-save every 10 seconds while running
          if (newDuration % 10 === 0) {
            saveToStorage({
              duration: newDuration,
              isPaused: false,
              startedAt: Date.now(),
            });
          }
          return newDuration;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, saveToStorage]);

  // Start timer
  const start = useCallback(() => {
    setIsPaused(false);
    saveToStorage({
      duration,
      isPaused: false,
      startedAt: Date.now(),
    });
  }, [duration, saveToStorage]);

  // Pause timer
  const pause = useCallback(() => {
    setIsPaused(true);
    saveToStorage({
      duration,
      isPaused: true,
      startedAt: Date.now(),
    });
  }, [duration, saveToStorage]);

  // Resume timer
  const resume = useCallback(() => {
    setIsPaused(false);
    saveToStorage({
      duration,
      isPaused: false,
      startedAt: Date.now(),
    });
  }, [duration, saveToStorage]);

  // Reset timer
  const reset = useCallback(() => {
    setDuration(0);
    setIsPaused(!autoStart);
    clearStorage();
  }, [autoStart, clearStorage]);

  // Toggle pause/resume
  const toggle = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);

  return {
    duration,
    isPaused,
    formattedTime: formatTime(duration),
    start,
    pause,
    resume,
    reset,
    toggle,
  };
}

