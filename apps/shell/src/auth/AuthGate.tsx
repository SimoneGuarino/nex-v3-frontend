import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ensureHydratedSharedSession, hydrateSharedSession } from "@nex/shared-platform";

type GateState = "checking" | "authorized" | "unauthorized";

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [gateState, setGateState] = useState<GateState>("checking");

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
                apiEndpoint: import.meta.env.VITE_API_ENDPOINT,
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
