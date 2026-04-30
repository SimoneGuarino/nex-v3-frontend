import type React from "react";

export type AuthzPayload = {
  tenant: string;
  caps: string[];
  version?: string;
};

export interface UserDetails {
    username: string;
    nome: string;
    cognome: string;
    ruolo: string;
    permissions: string[];
    immagini?: {
        avatar?: string;
        cover?: string;
    };
    [key: string]: any;
    authz?: AuthzPayload;
}

export interface UserState {
    token?: string;
    details?: UserDetails; // Può essere undefined, ma quando c'è ha tutti i campi obbligatori
}

export type UserContextType = [
    UserState | null,
    React.Dispatch<React.SetStateAction<UserState | null>>
];

declare module "../contexts/UserContext" {
    export const UserContext: React.Context<UserContextType>;
};