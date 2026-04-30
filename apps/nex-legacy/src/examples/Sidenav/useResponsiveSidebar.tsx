import { useEffect, useRef, useCallback, useState } from "react";
import { useMaterialUIController, setMiniSidenav, setWhiteSidenav, setSidebarOpen } from "context/index";
import { useNexTheme } from "@nex/theme-system";

export function useResponsiveSidebar(breakpoint = 1280) {
    const [controller, dispatch] = useMaterialUIController();
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const frame = useRef<number | null>(null);
    const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < breakpoint);

    const update = useCallback(() => {
        const mobile = window.innerWidth < breakpoint;
        setIsMobile(mobile);
        setMiniSidenav(dispatch, mobile);
        setWhiteSidenav(dispatch, !darkMode);

        // opzionale: chiudi se stai passando a desktop e lasci aperto solo su mobile quando esplicitamente richiesto
        if (!mobile) {
            setSidebarOpen(dispatch, false);
        } else {
            setMiniSidenav(dispatch, false); // forza sempre full-width su mobile
        }
    }, [dispatch, darkMode, breakpoint]);

    const onResize = useCallback(() => {
        if (frame.current != null) return;
        frame.current = requestAnimationFrame(() => {
            frame.current = null;
            update();
        });
    }, [update]);

    useEffect(() => {
        update();
        window.addEventListener("resize", onResize, { passive: true });
        return () => {
            window.removeEventListener("resize", onResize);
            if (frame.current != null) cancelAnimationFrame(frame.current);
        };
    }, [onResize, update]);

    return { isMobile };
}
