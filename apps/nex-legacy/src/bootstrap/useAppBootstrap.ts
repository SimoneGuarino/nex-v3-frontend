import { useCallback, useEffect } from "react";
import { hydrateSharedSession } from "@nex/shared-platform";

export default function useAppBootstrap({
    setUserContext,
}: {
    setUserContext: any;
}) {
    const restoreSession = useCallback(() => {
        const snapshot = hydrateSharedSession();
        if (!snapshot?.token) return;

        setUserContext((oldValues: any) => ({
            ...oldValues,
            token: snapshot.token,
            details: snapshot.details ?? oldValues?.details,
        }));
    }, [setUserContext]);

    useEffect(() => {
        restoreSession();
    }, [restoreSession]);
}
