import { useEffect } from "react";

export default function useUnloadingWarning(condition: boolean = true) {
  useEffect(() => {
    if (!condition) {
      return;
    }

    const listener = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", listener);

    return () => window.removeEventListener("beforeunload", listener);
  }, [condition]);
}
