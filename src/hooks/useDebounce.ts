import { useState, useEffect, useRef } from 'react';

interface UseDebounceOptions {
  delay: number;
  leading?: boolean; // Déclencher immédiatement la première fois
  trailing?: boolean; // Déclencher à la fin du délai
  maxWait?: number; // Délai maximum avant déclenchement
}

export function useDebounce<T>(
  value: T,
  delay: number,
  options?: Omit<UseDebounceOptions, 'delay'>
): T {
  const {
    leading = false,
    trailing = true,
    maxWait,
  } = options || {};
  
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const firstUpdate = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Déclenchement immédiat si leading est true et première mise à jour
    if (leading && firstUpdate.current) {
      setDebouncedValue(value);
      firstUpdate.current = false;
      return;
    }

    // Nettoyer les timeouts précédents
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxTimeoutRef.current && maxWait) {
      clearTimeout(maxTimeoutRef.current);
    }

    // Timeout normal
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
    }

    // Timeout maximum
    if (maxWait) {
      maxTimeoutRef.current = setTimeout(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setDebouncedValue(value);
      }, maxWait);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing, maxWait]);

  return debouncedValue;
}