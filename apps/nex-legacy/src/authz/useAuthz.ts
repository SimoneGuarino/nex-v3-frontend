import * as React from "react";
import { UserContext } from "../context/UserContext";
import type { AuthzPayload } from "../types/UserContext";
import type { Cap } from "./caps";

export function useAuthz() {
    const ctx = React.useContext(UserContext);
    const [userState] = ctx ?? [];

    const authz: AuthzPayload | undefined = userState?.details?.authz;

    const capsSet = React.useMemo(() => {
        const caps = authz?.caps ?? [];
        return new Set(caps);
    }, [authz?.version, authz?.caps]);
    // se usi version in BE, puoi mettere solo [authz?.version] per meno rerender

    const hasCap = React.useCallback((cap: Cap | string) => {
        return capsSet.has(cap);
    }, [capsSet]);

    return {
        tenant: authz?.tenant,
        version: authz?.version,
        caps: authz?.caps ?? [],
        hasCap,
        isReady: Boolean(userState?.details), // utile quando details non è ancora arrivato
    };
};