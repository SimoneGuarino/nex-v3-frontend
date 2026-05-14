import type React from "react";

export interface GroupContextOption {
    _id: string;
    tenant?: string;
    key?: string;
    name?: string;
    description?: string;
    status?: string;
    kind?: string;
    isDefault?: boolean;
    isActive?: boolean;
    directGroupIds?: string[];
    branchGroupIds?: string[];
    [key: string]: any;
}

export type AuthzPayload = {
    tenant: string;
    appId?: string;
    actorTeamKey?: string | null;
    activeGroupKey?: string | null;
    caps: string[];
    panels?: any[];
    resources?: any[];
    grants?: any[];
    denied?: any[];
    version?: string | null;
    activeGroupId?: string | null;
    defaultGroupContextId?: string | null;
    activeGroup?: GroupContextOption | null;
    groupContexts: GroupContextOption[];
    groups?: any[];
    directGroupIds?: string[];
    groupIds?: string[];
    meta?: Record<string, unknown>;
};

export interface UserDetails {
    username: string;
    nome: string;
    cognome: string;
    /** @deprecated Legacy numeric/string role. UI must use authz.activeGroupId/groupContexts. */
    ruolo?: string;
    permissions?: string[];
    immagini?: {
        avatar?: string;
        cover?: string;
    };
    [key: string]: any;
    authz?: AuthzPayload;
}

export interface UserState {
    token?: string;
    details?: UserDetails;
}

export type UserContextType = [
    UserState | null,
    React.Dispatch<React.SetStateAction<UserState | null>>
];

declare module "../contexts/UserContext" {
    export const UserContext: React.Context<UserContextType>;
};
