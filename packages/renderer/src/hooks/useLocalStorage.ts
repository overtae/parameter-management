import { useState, useEffect, useCallback, useRef } from "react";

export default function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef(initialValue);
  
  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  const readValue = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValueRef.current;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  }, [key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  return [storedValue, setValue] as const;
}
