'use client';

import { useEffect, useState } from 'react';

/**
 * useDebounce
 *
 * Delays updating the returned value until `delay` ms after the last change.
 * Use for search inputs to avoid firing on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
