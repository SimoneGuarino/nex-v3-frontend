import React, {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { UserState } from "types/UserContext";
import { setAuthToken } from "utils/auth/authToken";
import {
    hydrateSharedSession,
    persistSessionSnapshot,
    publishSessionSnapshot,
    readRememberMePreference,
} from "@nex/shared-platform";

export type UserContextValue = [
    UserState | null,
    React.Dispatch<React.SetStateAction<UserState | null>>
];

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export function useUserContext(): UserContextValue {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUserContext deve essere usato dentro UserProvider");
    return ctx;
}

function readInitialLegacyUserState(): UserState | null {
    const snapshot = hydrateSharedSession();
    if (!snapshot?.token) return null;

    return {
        token: snapshot.token,
        details: snapshot.details,
    } as UserState;
}

export const UserProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [state, setState] = useState<UserState | null>(() => readInitialLegacyUserState());
    const hadTokenRef = useRef(Boolean(state?.token));

    /**
     * Keep the legacy in-memory bearer token in sync before child passive effects
     * fire. Several legacy providers call APIs as soon as userContext.details is
     * available; using a layout effect prevents those calls from racing against
     * setAuthToken().
     */
    useLayoutEffect(() => {
        setAuthToken(state?.token ?? null);
    }, [state?.token]);

    useEffect(() => {
        if (state?.token) {
            persistSessionSnapshot({
                token: state.token,
                details: state.details,
                issuedAt: Date.now(),
            }, {
                rememberMe: readRememberMePreference(),
            });

            hadTokenRef.current = true;
            return;
        }

        /**
         * Important: do not publish a null session during the initial legacy mount.
         *
         * The shell has already authenticated the user before mounting this MFE.
         * On the first render the legacy context may still be null for a moment;
         * publishing null here invalidates the shell session and redirects the user
         * back to /login immediately after a successful login.
         */
        if (hadTokenRef.current) {
            publishSessionSnapshot(null);
            hadTokenRef.current = false;
        }
    }, [state?.token, state?.details]);

    const value = useMemo<UserContextValue>(() => [state, setState], [state]);

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
