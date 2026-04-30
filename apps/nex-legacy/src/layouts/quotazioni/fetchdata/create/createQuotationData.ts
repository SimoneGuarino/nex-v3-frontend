import { FetchData } from "examples/Fetch";
import { filterTypeOptions } from "layouts/quotazioni/types/quotations";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";
import { OnCreateRequestType } from "../../pages";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export type Tipologia = "STANDARD" | "BID_ATTIVO" | "BID_PASSIVO" | "MEPA" | "CTO" | "ALTRA_GARA";

export interface CreateQuotationDataProps {
    abortController: AbortLike;
    user?: UserState | null;
    payload: OnCreateRequestType;
    HandleComplete: (payload: { _id: string; msg: string; titolo?: string; prog_num?: number }) => void; // il BE può restituire anche 'titolo'
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus?: (args: { from: string; bool: boolean }) => void;
};


// ——————————————————————————————————————————————————————————
// HELPERS
// ——————————————————————————————————————————————————————————
const norm = (s?: string) =>
    String(s ?? "")
        .normalize("NFD")
        // @ts-ignore unicode property escapes
        .replace(/\p{Diacritic}/gu, "")
        .trim()
        .toLowerCase();

const AGENT_ROLE_NAMES = new Set(["commerciale", "agente", "agent"].map(norm));

const isAgent = (user?: UserState | null): boolean => {
    const details: any = user?.details ?? {};
    if (AGENT_ROLE_NAMES.has(norm(details?.ruolo))) return true;

    const mr = details?.multiRuolo;
    if (Array.isArray(mr)) {
        for (const entry of mr) {
            if (typeof entry === "string" && AGENT_ROLE_NAMES.has(norm(entry))) return true;
            if (entry && typeof entry === "object" && AGENT_ROLE_NAMES.has(norm(entry.ruolo))) return true;
        }
    }
    return false;
};

// usa SOLO l'id utente (stringa)
const getAgenteId = (user?: UserState | null, override?: string) => {
    if (override && override.trim()) return override.trim();
    const details: any = user?.details ?? {};
    const id = details?._id ?? details?.id;
    return typeof id === "string" && id.trim() ? id.trim() : undefined;
};

const isValidTipologia = (t: unknown): t is Tipologia =>
    typeof t === "string" && filterTypeOptions.includes(t);

const safeTrim = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

const extractClienteCode = (customer: any): string | null => {
    if (!customer) return null;
    if (typeof customer === "string") return customer.trim() || null;

    // tentativi comuni (adatta se la DTO ha altri campi)
    const direct = customer?.codice ?? customer?.code ?? customer?.cliente ?? customer?.customerCode;
    if (typeof direct === "string" && direct.trim()) return direct.trim();

    const focelda =
        customer?.CodiceCliente?.Focelda ??
        customer?.codiceCliente?.Focelda ??
        customer?.codiceClienteFocelda ??
        customer?.codice_cliente_focelda;

    if (typeof focelda === "string" && focelda.trim()) return focelda.trim();

    return null;
};


// ——————————————————————————————————————————————————————————
// MAIN FUNCTION
// ——————————————————————————————————————————————————————————
export async function createQuotationData({
    abortController,
    user,
    payload,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: CreateQuotationDataProps): Promise<void> {
    const FROM = "createQuotationData";
    try {
        ChangeLoadStatus?.({ from: FROM, bool: true });

        // NB: il backend si aspetta "cliente" come stringa (codice), non l'oggetto customer.
        // Per BID_PASSIVO il cliente puo essere assente: il backend applichera il placeholder.
        const clienteCode = extractClienteCode((payload as any).customer);

        let body: Record<string, any> = {
            titolo: payload.titolo,
            tipologia: payload.type.replace(" ", "_") || "", // allinea con la nomenclatura standard
            // cliente: clienteCode,
        };

        // controllo ruolo
        if (!isAgent(user)) {
            HandleError("permesso negato: l’utente non ha il ruolo agente (Commerciale).");
            return;
        };

        // validazione titolo
        if (!body.titolo || !String(body.titolo).trim()) {
            HandleError('parametro "titolo" è obbligatorio.');
            return;
        };

        if (!body.titolo || String(body.titolo).trim().length < 3) {
            HandleError('parametro "titolo" deve essere lungo almeno 3 caratteri.');
            return;
        };

        //condizione di presenza del cliente
        // if (body.cliente === null) {
        //     HandleError('parametro "cliente" è obbligatorio.');
        //     return;
        // };

        // validazione tipologia
        if (!isValidTipologia(body.tipologia)) {
            HandleError('parametro "tipologia" non valido.');
            return;
        };

        // Regola cliente:
        // - BID_PASSIVO: cliente opzionale (fallback gestito dal backend)
        // - altre tipologie: cliente obbligatorio
        const isBidPassivo = body.tipologia === "BID_PASSIVO";
        if (!isBidPassivo && !clienteCode) {
            HandleError('parametro "cliente" è obbligatorio.');
            return;
        };

        // Inviamo il campo "cliente" solo quando valorizzato.
        // Se assente in BID_PASSIVO, il backend usa il placeholder.
        if (clienteCode) {
            body.cliente = clienteCode;
        };

        //controllo e sanificazione se è presente le note
        const noteTrim = safeTrim((payload as any).note);
        if (noteTrim !== "") {
            //controllo per evitare iniezioni da hacker
            if (RegExp(/[<>]/).test(noteTrim)) {
                HandleError('parametro "note" contiene caratteri non validi.');
                return;
            }
            // hard-cap (allinea col BE se hai messo un max lì)
            if (noteTrim.length > 2000) {
                HandleError('parametro "note" troppo lungo (max 2000 caratteri).');
                return;
            }
            body.note = noteTrim;
        };

        // La scadenza arriva dal form come stringa (es. YYYY-MM-DD).
        // Non la convertiamo in timestamp lato FE: inviamo il valore "as-is"
        // e lasciamo al BE la normalizzazione/persistenza ufficiale.
        const dateToTrim = safeTrim((payload as any).dateTo);
        if (dateToTrim !== "") {
            if (isNaN(Date.parse(dateToTrim))) {
                HandleError('parametro "dateTo" non è una data valida.');
                return;
            }
            body.dateTo = dateToTrim;
        };

        // aggiungo cig e rdo se presenti
        if ((payload as any).cig && safeTrim((payload as any).cig) !== "") {
            body.cig = safeTrim((payload as any).cig);
        };

        if ((payload as any).rdo && safeTrim((payload as any).rdo) !== "") {
            body.rdo = safeTrim((payload as any).rdo);
        };

        // base URL
        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/create`);

        // body: titolo + tipologia + SOLO id agente (stringa)
        const agenteId = getAgenteId(user);
        if (agenteId) body.agenteId = agenteId;

        // POST
        const res = await FetchData<{ _id: string; msg: string; titolo?: string; prog_num?: number }>(
            url.toString(),
            "POST",
            body,
            abortController
        );

        HandleComplete(res);
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any };
        if (e?.name !== "AbortError") {
            const backendMsg =
                typeof e?.message === "string"
                    ? e.message
                    : e?.message?.msg || "Errore durante la creazione della quotazione.";
            console.error("[createQuotationData] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    };
};


