import { useCallback, useEffect, useRef } from "react";
import {
    ensureHydratedSharedSession,
    hydrateSharedSession,
} from "@nex/shared-platform";

const AUTH_API_ENDPOINT = import.meta.env.VITE_AUTH_API_ENDPOINT
    ?? import.meta.env.VITE_API_AUTH
    ?? import.meta.env.VITE_API_AUTH
    ?? "";

export default function useAppBootstrap({
    setUserContext,
}: {
    setUserContext: any;
}) {
    const refreshStartedRef = useRef(false);

    const applySnapshot = useCallback((snapshot: any) => {
        if (!snapshot?.token) return;

        setUserContext((oldValues: any) => {
            const nextDetails = snapshot.details ?? oldValues?.details;

            if (
                oldValues?.token === snapshot.token &&
                oldValues?.details === nextDetails
            ) {
                return oldValues;
            }

            return {
                ...oldValues,
                token: snapshot.token,
                details: nextDetails,
            };
        });
    }, [setUserContext]);

    const restoreSession = useCallback(() => {
        const snapshot = hydrateSharedSession();
        applySnapshot(snapshot);
    }, [applySnapshot]);

    const refreshSession = useCallback(async () => {
        if (refreshStartedRef.current || !AUTH_API_ENDPOINT) return;
        refreshStartedRef.current = true;

        const snapshot = await ensureHydratedSharedSession({
            apiEndpoint: AUTH_API_ENDPOINT,
            force: true,
            tenant: "Focelda",
            appId: "legacy",
        });

        applySnapshot(snapshot);
    }, [applySnapshot]);

    useEffect(() => {
        restoreSession();
        void refreshSession();
    }, [restoreSession, refreshSession]);
}
