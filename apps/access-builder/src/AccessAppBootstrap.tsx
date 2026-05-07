import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SplashProgressLoader, readCrossAppLoading, clearCrossAppLoading } from "@nex/ui-feedback";
import nexLogo from "./assets/logo_nex_transp.webp";
import nexLogoWhite from "./assets/logo_nex_transp_white.webp";

function loadFromLocalStorageBool(key: string, fallback = false): boolean {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        if (raw == null) return fallback;
        if (raw === "true") return true;
        if (raw === "false") return false;
        return Boolean(JSON.parse(raw));
    } catch {
        return fallback;
    }
}

export default function AccessAppBootstrap({ children }: { children: ReactNode }) {
    const darkMode = loadFromLocalStorageBool("darkMode", false);
    const handoff = useMemo(() => readCrossAppLoading(), []);
    const [showSplash, setShowSplash] = useState(Boolean(handoff));
    const [progress, setProgress] = useState(handoff ? 10 : 100);

    useEffect(() => {
        if (!handoff) return;
        const steps = [25, 45, 65, 80, 92, 100];
        let i = 0;

        const interval = setInterval(() => {
            setProgress((prev) => {
                const next = steps[i] ?? prev;
                i += 1;
                return next;
            });
        }, 180);

        const done = setTimeout(() => {
            clearInterval(interval);
            setProgress(100);
            clearCrossAppLoading();
            setTimeout(() => setShowSplash(false), 220);
        }, 1300);

        return () => {
            clearInterval(interval);
            clearTimeout(done);
        };
    }, [handoff]);

    if (showSplash) {
        return (
            <SplashProgressLoader
                progress={progress}
                label="Apertura Access Builder..."
                darkMode={darkMode}
                logoSrc={nexLogo}
                logoDarkSrc={nexLogoWhite}
            />
        );
    }

    return <>{children}</>;
}
