import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { SplashLoader, SplashProgressLoader } from "@nex/ui-feedback";
import { notifyShellLoadingStart, subscribeShellLoading } from "@nex/shared-platform";
import { useNexTheme } from "@nex/theme-system";
import nexLogo from "../assets/login/logo_nex_transp.webp";
import nexLogoWhite from "../assets/login/logo_nex_transp_white.webp";

type Props = {
    bootKey: string;
};

type State = {
    visible: boolean;
    progress: number | null;
    label: string;
};

const MIN_VISIBLE_MS = 450;
const FAILSAFE_MS = 12000;

export default function ShellSplashHost({ bootKey }: Props) {
    const location = useLocation();
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const [state, setState] = useState<State>({
        visible: true,
        progress: null,
        label: "Caricamento modulo...",
    });
    const visibleSinceRef = useRef<number>(Date.now());
    const failsafeRef = useRef<number | null>(null);

    const defaultLabel = useMemo(() => {
        if (location.pathname.startsWith("/survey-builder")) return "Apertura Survey Builder...";
        if (location.pathname.startsWith("/login")) return "Autenticazione NEX...";
        return "Apertura NEX Legacy...";
    }, [location.pathname]);

    useEffect(() => {
        visibleSinceRef.current = Date.now();
        setState({ visible: true, progress: null, label: defaultLabel });
        notifyShellLoadingStart({
            app: location.pathname.startsWith("/survey-builder") ? "survey" : location.pathname.startsWith("/login") ? "shell" : "legacy",
            reason: "route-change",
            label: defaultLabel,
            source: "shell-route-change",
        });
    }, [bootKey, defaultLabel, location.pathname]);

    useEffect(() => {
        const clearFailsafe = () => {
            if (failsafeRef.current !== null) {
                window.clearTimeout(failsafeRef.current);
                failsafeRef.current = null;
            }
        };

        const armFailsafe = () => {
            clearFailsafe();
            failsafeRef.current = window.setTimeout(() => {
                setState((prev) => ({ ...prev, visible: false, progress: null }));
            }, FAILSAFE_MS);
        };

        armFailsafe();

        const unsubscribe = subscribeShellLoading({
            onStart: (payload) => {
                visibleSinceRef.current = Date.now();
                setState({
                    visible: true,
                    progress: typeof payload.progress === "number" ? payload.progress : null,
                    label: payload.label || defaultLabel,
                });
                armFailsafe();
            },
            onProgress: (payload) => {
                setState((prev) => ({
                    visible: true,
                    progress: typeof payload.progress === "number" ? payload.progress : prev.progress,
                    label: payload.label || prev.label,
                }));
                armFailsafe();
            },
            onReady: () => {
                clearFailsafe();
                const elapsed = Date.now() - visibleSinceRef.current;
                const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
                window.setTimeout(() => {
                    setState((prev) => ({ ...prev, visible: false, progress: null }));
                }, wait);
            },
        });

        return () => {
            unsubscribe();
            clearFailsafe();
        };
    }, [defaultLabel]);


    if (typeof state.progress === "number") {
        if (!state.visible) return null;

        return (
            <SplashProgressLoader
                progress={state.progress}
                label={state.label}
                darkMode={darkMode}
                logoSrc={nexLogo}
                logoDarkSrc={nexLogoWhite}
            />
        );
    }

    return (
        <SplashLoader
            visible={state.visible}
            darkMode={darkMode}
            logoSrc={nexLogo}
            logoDarkSrc={nexLogoWhite}
        />
    );
}
