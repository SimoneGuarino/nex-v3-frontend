import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [rect, setRect] = useState({ width: 0, height: 0 });

  const setRef = useCallback((node: T | null) => {
    ref.current = node;
  }, []);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setRect({ width: cr.width, height: cr.height });
      }
    });
    ro.observe(el);
    // prima misura sincrona
    const r = el.getBoundingClientRect();
    setRect({ width: r.width, height: r.height });

    return () => ro.disconnect();
  }, []);

  return { ref: setRef, rect };
}
