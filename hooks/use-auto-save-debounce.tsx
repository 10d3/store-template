import { useEffect, useState } from "react";

export default function useDebounce<T>(values: T, delay: number = 250) {
  const [debounceValues, setDebounceValues] = useState<T>(values);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceValues(values);
    }, delay);

    return () => clearTimeout(handler);
  }, [values, delay]);

  return debounceValues;
}
