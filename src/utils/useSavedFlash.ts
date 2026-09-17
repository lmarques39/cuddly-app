import { useEffect, useRef, useState } from 'react';

/**
 * Shows a "saved" confirmation flag for a few seconds after calling flash(),
 * then hides it again — clears its own timer on unmount so it never tries
 * to setState after the screen is gone.
 */
export function useSavedFlash(durationMs = 2500) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const flash = () => {
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), durationMs);
  };

  return { visible, flash };
}
