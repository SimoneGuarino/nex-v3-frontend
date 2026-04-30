import { useEffect, useMemo, useRef } from "react";
import { bindRealtimeStoreToKernel } from "@nex/realtime-store";
import { broadcastLogout, clearSession, readSharedSessionSnapshot, subscribeSessionSnapshot } from "@nex/shared-platform";
import { getRealtimeKernel } from "@nex/realtime-core";

const AFK_TIMEOUT = 1000 * 60 * 5;
const LOGOUT_TIMEOUT = 1000 * 60 * 60;

export default function ShellRealtimeBridge() {
    const kernel = useMemo(() => getRealtimeKernel(), []);
    const afkTimerRef = useRef<number | null>(null);
    const logoutTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const cleanupBinding = bindRealtimeStoreToKernel();
        kernel.setForceLogoutHandler(() => {
            clearSession();
            broadcastLogout();
            window.location.reload();
        });

        const startFromSnapshot = (snapshot = readSharedSessionSnapshot()) => {
            kernel.start(snapshot);
        };

        startFromSnapshot();
        const unsubscribeSession = subscribeSessionSnapshot((snapshot) => {
            kernel.start(snapshot);
        });

        return () => {
            unsubscribeSession();
            cleanupBinding();
            kernel.setForceLogoutHandler(null);
        };
    }, [kernel]);

    useEffect(() => {
        const clearTimers = () => {
            if (afkTimerRef.current !== null) window.clearTimeout(afkTimerRef.current);
            if (logoutTimerRef.current !== null) window.clearTimeout(logoutTimerRef.current);
        };

        const resetTimers = () => {
            clearTimers();
            kernel.markUserState("Online");

            afkTimerRef.current = window.setTimeout(() => {
                kernel.markUserState("Assente");
            }, AFK_TIMEOUT);

            logoutTimerRef.current = window.setTimeout(() => {
                clearSession();
                broadcastLogout();
                window.location.reload();
            }, LOGOUT_TIMEOUT);
        };

        const events: Array<keyof WindowEventMap> = ["click", "keydown", "scroll", "mousemove"];
        events.forEach((eventName) => window.addEventListener(eventName, resetTimers, { passive: true }));
        resetTimers();

        return () => {
            clearTimers();
            events.forEach((eventName) => window.removeEventListener(eventName, resetTimers));
        };
    }, [kernel]);

    return null;
}