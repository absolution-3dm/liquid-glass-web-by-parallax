import { useLayoutEffect, useRef, useState } from "react";

export function useClipboard(text: string) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return { copied, copy };
}
