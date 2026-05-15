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

export interface UserCodes {
    /** Codice buyer di default assegnato al suo account */
    buyer?: string | null;
    /** Codice agente di default assegnato al suo account */
    agente?: string | null;
    /** Lista dei codici Agenti assegnati al suo account */
    ulterioriAgente?: string[];
    [key: string]: any;
}

export interface UserImages {
    avatar?: string | null;
    cover?: string | null;
}

export interface UserDetails {
    _id?: string;
    id?: string;
    username: string;
    email?: string;
    nome: string;
    cognome: string;
    codici?: UserCodes;
    immagini?: UserImages;
    magazzino?: string | null;
    isMEPA?: boolean;
    /** @deprecated Legacy numeric/string role. UI must use authz.caps and authz.activeGroupId/groupContexts. */
    ruolo?: string | number;
    /** @deprecated Legacy multi-role collection. UI must use authz.caps and authz.groupContexts. */
    multiRuolo?: Array<string | number | Record<string, any>>;
    /** @deprecated Legacy permissions collection. UI must use authz.caps. */
    permissions?: string[];
    authz?: AuthzPayload;
    [key: string]: any;
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
