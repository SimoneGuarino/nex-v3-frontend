import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UserState } from "types/UserContext";
import { setAuthToken } from "utils/auth/authToken";
import { persistSessionSnapshot, publishSessionSnapshot, readRememberMePreference } from "@nex/shared-platform";

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

export const UserProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [state, setState] = useState<UserState | null>(null);

    useEffect(() => {
        if (state?.token) {
            setAuthToken(state.token);
            persistSessionSnapshot({
                token: state.token,
                details: state.details,
                issuedAt: Date.now(),
            }, {
                rememberMe: readRememberMePreference(),
            });
            return;
        }

        publishSessionSnapshot(null);
    }, [state?.token, state?.details]);

    const value = useMemo<UserContextValue>(() => [state, setState], [state]);

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
