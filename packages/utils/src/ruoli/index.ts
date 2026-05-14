/* ruoli: letti dall'.env (senza fallback locale) */
export type RoleOption = { id: number; ruolo: string };

/**
 * Parsea la variabile d'ambiente REACT_APP_ROLES in una mappa id->ruolo
 * @returns 
 */
function parseRolesEnv(): Record<string, string> | null {
    const raw = import.meta.env.VITE_ROLES;
    if (!raw) return null;
    const s = raw.trim();
    const tries = [s, s.replace(/^'|'$/g, "").replace(/'/g, '"')];
    for (const t of tries) {
        try {
            const obj = JSON.parse(t);
            if (obj && typeof obj === "object") return obj as Record<string, string>;
        } catch {
            /* continua a tentare */
        }
    }
    console.warn("[roles] impossibile fare parse di REACT_APP_ROLES");
    return null;
};

/**
 * Restituisce un array di RoleOption letti da REACT_APP_ROLES
 * @returns 
 */
export function getRolesOptionsFromEnv(): RoleOption[] {
    const map = parseRolesEnv();
    if (!map) {
        console.warn("[roles] REACT_APP_ROLES non definita o non valida; nessun ruolo disponibile");
        return [];
    }
    return Object.entries(map)
        .map(([id, label]) => ({ id: Number(id), ruolo: String(label) }))
        .filter((o) => Number.isFinite(o.id))
        .sort((a, b) => a.id - b.id);
};

/**
 * Crea una mappa id->ruolo da un array di RoleOption oppure da REACT_APP_ROLES
 * @param options 
 * @returns
 */
export function getRolesMappedByIndex(options?: RoleOption[]): Record<string, string> {
    return Object.fromEntries((options ?? getRolesOptionsFromEnv()).map((r) => [String(r.id), r.ruolo]));
};

/**
 * Crea una mappa ruolo->id da un array di RoleOption oppure da REACT_APP_ROLES
 * @param options getRolesOptionsFromEnv()
 * @returns 
 */
export function getRolesMappedByLabel(options?: RoleOption[]): Record<string, string> {
    return Object.fromEntries((options ?? getRolesOptionsFromEnv()).map((r) => [r.ruolo, String(r.id)]));
};