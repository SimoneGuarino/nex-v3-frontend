import type { MutableRefObject } from "react";

export type AbortLike = AbortController | MutableRefObject<AbortController | null>;

/** sanifica i tags lato FE: accetta stringhe e numeri, trim, rimuove vuoti e duplicati (case-sensitive) */
export function sanitizeTagsClient(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of raw) {
        let s: string | null = null;
        if (typeof v === "string") s = v.trim();
        else if (typeof v === "number" && Number.isFinite(v)) s = String(v);
        if (!s) continue;
        if (seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }
    return out;
}

export interface QueryAS400API {
    id: string;              // normalizzato da _id
    titolo: string;
    query: string;
    descrizione: string | null;
    tags?: string[];         // opzionale dal BE; se mancante ⇒ []
    createdAt: string;       // ISO
    updatedAt: string;       // ISO
}

export interface QueryAS400 extends Omit<QueryAS400API, "createdAt" | "updatedAt" | "tags"> {
    createdAt: Date;
    updatedAt: Date;
    tags: string[];          // sempre presente lato FE
}

export function normalizeQuery(api: any): QueryAS400 {
    const id = api.id ?? (typeof api._id === "string" ? api._id : api._id?.$oid);
    const tags = sanitizeTagsClient(api.tags);

    return {
        id: String(id ?? ""),
        titolo: api.titolo ?? "",
        query: api.query ?? "",
        descrizione: api.descrizione ?? null,
        tags, // [] se assente/invalidi
        createdAt: new Date(api.createdAt ?? api.created_at ?? api.created),
        updatedAt: new Date(api.updatedAt ?? api.updated_at ?? api.updated),
    };
}

export function normalizeQueriesMany(apiList: any[]): QueryAS400[] {
    return Array.isArray(apiList) ? apiList.map(normalizeQuery) : [];
}

/* ---------- exec responses ---------- */
export interface ExecAdHocResponse { count: number; rows: any[]; }
export interface ExecSavedResponse { queryId: string; titolo?: string; count: number; rows: any[]; }

/* ---------- delete response ---------- */
export interface DestroyQueryResponse { deleted: boolean; id: string; titolo?: string; }

/* ---------- payload helper ---------- */
export interface CreateQueryBody {
    titolo: string;
    query: string;
    descrizione?: string | null;
    tags?: string[]; // array di role_id come stringhe; omesso o [] => pubblica
}
export interface UpdateQueryPatch {
    titolo?: string;
    query?: string;
    descrizione?: string | null;
    tags?: string[] | null;  // [] o null per rendere pubblica; omesso per non toccare i tag
}
