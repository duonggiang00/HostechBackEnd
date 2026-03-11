import { useState, useEffect } from "react";

/**
 * useDebounce — trì hoãn cập nhật value sau `delay` ms.
 * Dùng cho search input để giảm số lần gọi API.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
