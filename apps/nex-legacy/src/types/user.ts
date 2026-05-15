import type { AuthzPayload, UserCodes, UserImages } from "./UserContext";

export interface UserContextTypes {
    details?: User;
    token?: string;
};

export interface User {
    _id: string;
    nome: string;
    cognome: string;
    username: string;
    email?: string;
    immagini?: UserImages;
    biografia?: string | null;
    codici?: UserCodes;
    magazzino?: string | null;
    isMEPA?: boolean;
    authz?: AuthzPayload;
    /** @deprecated Legacy numeric/string role. Use authz.caps/groupContexts. */
    ruolo?: string | number;
    /** @deprecated Legacy role field. Use authz.caps/groupContexts. */
    role?: string;
    /** @deprecated Legacy multi-role collection. Use authz.caps/groupContexts. */
    multiRuolo?: Array<string | number | Record<string, any>>;
    /** @deprecated Legacy permissions collection. Use authz.caps. */
    permissions?: string[];
    createdAt?: Date | string;
    updatedAt?: Date | string;
    [key: string]: any;
};
