/**
 * Centralizza il cleanup degli AbortController usati dal layout.
 * Il componente resta leggibile e non deve ripetere la stessa logica in fondo al file.
 */
import { useEffect } from "react";
import type { MutableRefObject } from "react";

export function useAbortControllersCleanup(...refs: Array<MutableRefObject<AbortController | null>>) {
    useEffect(() => {
        return () => {
            refs.forEach((ref) => {
                try {
                    ref.current?.abort();
                } catch {
                    // Ignoriamo eventuali controller già chiusi.
                }
            });
        };
        // Registra il cleanup una sola volta su mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
