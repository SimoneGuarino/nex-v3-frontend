import type { MutableRefObject } from "react";
import { FetchData } from "examples/Fetch";
import type { JSONValue } from "examples/Fetch";

export type InviatoFlag = "S" | "N";
export type StatoFlag = "Approvato" | "Bocciato" | "In Revisione" | null;

export interface SelloutFile {
    id?: number | string;          // oppure: id?: number | string;  ← consigliato
    _id?: string;         // valutare rimozione dopo migrazione
    filename: string;
    prfor: string;
    settimana: number;
    anno: number;
    data_inizio: string | null;
    data_fine: string | null;
    data_creazione: string | null;
    inviato: InviatoFlag;

    mail_sellout?: string[] | null;
    filepath?: string | null;
    stato: StatoFlag;
}

export interface ListMeta {
    isPrivileged?: boolean;
    userEmailUsed?: string | null;
    appliedEmailFilter?: boolean;

    //campi per fare in modo che i buyer che non ricevono la mail possano solamente "vedere" i dati in base al loro codice buyer
    isBuyer?: boolean;
    buyerCodeUsed?: string | null;
    appliedBuyerFilter?: boolean;

    // nuovi campi di paginazione
    ofs?: number;          // offset richiesto/applicato lato BE
    limit?: number;        // limite effettivo (cap a 50)
    next_ofs?: number | null;
    hasMore?: boolean;
}

export interface ListResponse {
    ok: boolean;
    files: SelloutFile[];
    meta?: ListMeta;     // info dal backend (inclusa paginazione)
    error?: string;
}

export interface ListFilters {
    prfor?: string;
    anno?: number;
    settimana?: number;
    data_inizio?: string;
    data_fine?: string;
    inviato?: InviatoFlag;
    userEmail?: string;
    userRole?: number;
    isPrivileged?: 0 | 1; // forza privilegi lato BE

    // nuovi filtri di paginazione
    ofs?: number;         // default 0 se omesso
    lim?: number;         // cap a 50 lato BE
}

function getBase(): string {
    const raw = import.meta.env.VITE_API_PDF_READER || "";
    return raw.replace(/\/+$/, "");
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
    const qp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== "") {
            qp.set(k, String(v));
        }
    });
    const s = qp.toString();
    return s ? `?${s}` : "";
}

export async function fetchSelloutList(
    filters: ListFilters,
    abortLike: MutableRefObject<AbortController | null> | AbortController
): Promise<ListResponse> {
    const query = buildQuery({
        prfor: filters.prfor,
        anno: filters.anno,
        settimana: filters.settimana,
        data_inizio: filters.data_inizio,
        data_fine: filters.data_fine,
        inviato: filters.inviato,
        userEmail: filters.userEmail?.toLowerCase(),
        userRole: filters.userRole,
        isPrivileged: filters.isPrivileged, // passa il flag

        // paginazione
        ofs: typeof filters.ofs === "number" ? Math.max(0, Math.floor(filters.ofs)) : undefined,
        lim: typeof filters.lim === "number" ? Math.max(1, Math.floor(filters.lim)) : undefined,
    });

    const url = `${getBase()}/sellout/list${query}`;
    const res = await FetchData<ListResponse>(url, "GET", null as unknown as JSONValue, abortLike);

    if (!res || typeof res !== "object") {
        throw new Error("Risposta inattesa dal server.");
    }

    // normalizzazione minima con fallback
    const ok = Boolean((res as any).ok);
    const files = Array.isArray((res as any).files) ? (res as any).files : [];
    const meta = (res as any).meta as ListMeta | undefined;
    const error = (res as any).error as string | undefined;

    return { ok, files, meta, error };
}
