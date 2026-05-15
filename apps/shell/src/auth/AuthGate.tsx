import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
    ensureHydratedSharedSession,
    hydrateSharedSession,
    SESSION_EVENTS,
    STORAGE_KEYS,
    subscribeSessionSnapshot,
} from "@nex/shared-platform";

type GateState = "checking" | "authorized" | "unauthorized";

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [gateState, setGateState] = useState<GateState>("checking");


    useEffect(() => {
        const unsubscribe = subscribeSessionSnapshot((snapshot) => {
            if (!snapshot?.token) {
                setGateState("unauthorized");
            }
        });

        const onSessionInvalidated = () => {
            setGateState("unauthorized");
        };

        const onStorage = (event: StorageEvent) => {
            if (
                event.key === STORAGE_KEYS.logoutSignal ||
                event.key === STORAGE_KEYS.sessionInvalidation
            ) {
                setGateState("unauthorized");
            }
        };

        window.addEventListener(SESSION_EVENTS.invalidated, onSessionInvalidated);
        window.addEventListener("storage", onStorage);

        return () => {
            unsubscribe();
            window.removeEventListener(SESSION_EVENTS.invalidated, onSessionInvalidated);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            const snapshot = hydrateSharedSession();
            if (!snapshot?.token) {
                if (!cancelled) setGateState("unauthorized");
                return;
            }

            if (snapshot.details) {
                if (!cancelled) setGateState("authorized");
                return;
            }

            const hydrated = await ensureHydratedSharedSession({
                apiEndpoint: import.meta.env.VITE_API_AUTH,
            });

            if (cancelled) return;
            setGateState(hydrated?.token ? "authorized" : "unauthorized");
        }

        void run();
        return () => {
            cancelled = true;
        };
    }, [location.pathname]);

    if (gateState === "checking") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
                <div className="text-sm opacity-80">Verifica sessione in corso...</div>
            </div>
        );
    }

    if (gateState === "unauthorized") {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <>{children}</>;
}
