import brtLogo from "assets/images/corrieri/brt.webp";
import glsLogo from "assets/images/corrieri/gls.webp";
import tntLogo from "assets/images/corrieri/tnt.webp";

import type {
    CustomerOption,
    HeaderSortPayload,
    TrackingsDateRange,
    TrackingsLoadStatus,
    TrackingsSortDirection,
    TrackingsSortField,
    UserChoose,
} from "../types";

/** Chiave tecnica della colonna fissa delle azioni tracking. */
export const TRACKINGS_OPTIONS_COLUMN_KEY = "__TRACKINGS_OPTIONS__";

/** Label mostrata per la colonna fissa delle azioni tracking. */
export const TRACKINGS_OPTIONS_COLUMN_LABEL = "Opzioni";

/** Chiave tecnica della colonna corriere normalizzata. */
export const TRACKINGS_COURIER_COLUMN_KEY = "CORRIERE";

/** Label mostrata per la colonna corriere. */
export const TRACKINGS_COURIER_COLUMN_LABEL = "CORRIERE";

/** Stato iniziale dei loader del layout trackings. */
export const TRACKINGS_INITIAL_LOAD_STATUS: TrackingsLoadStatus = {
    table: true,
    filters: false,
    search: true,
    infiniteScroll: false,
};

/** Mappa di sort server-side tra chiave colonna e campo backend. */
const SORT_FIELD_BY_COLUMN_KEY: Record<TrackingsSortField, TrackingsSortField> = {
    DATA_INSERIMENTO_TRACKING: "DATA_INSERIMENTO_TRACKING",
    ANNO: "ANNO",
    MAGAZZINO_PARTENZA: "MAGAZZINO_PARTENZA",
    CORRIERE: "CORRIERE",
    COD_CLIENTE: "COD_CLIENTE",
    DEN_SOC: "DEN_SOC",
    INDIRIZZO_CLIENTE: "INDIRIZZO_CLIENTE",
    CAP: "CAP",
    LOCALITA: "LOCALITA",
    PROVINCIA: "PROVINCIA",
    DESTINATARIO: "DESTINATARIO",
    INDIRIZZO_DESTINATARIO: "INDIRIZZO_DESTINATARIO",
    CAP_DESTINATARIO: "CAP_DESTINATARIO",
    LOCALITA_DESTINATARIO: "LOCALITA_DESTINATARIO",
    PROVINCIA_DESTINATARIO: "PROVINCIA_DESTINATARIO",
    PESO_KG: "PESO_KG",
    VOLUME_M3: "VOLUME_M3",
    NUMERO_COLLI: "NUMERO_COLLI",
    EMAIL_DESTINATARIO: "EMAIL_DESTINATARIO",
    TEL_DESTINATARIO: "TEL_DESTINATARIO",
    NUM_FB: "NUM_FB",
    DATA_ORDINE_FB: "DATA_ORDINE_FB",
    URL_TRACKING: "URL_TRACKING",
};

/** Loghi corriere associati ai relativi codici backend. */
const COURIER_LOGO_BY_CODE: Record<string, string> = {
    BART: brtLogo,
    TNT: tntLogo,
    GLSN: glsLogo,
};

type BuildTrackingsUserChooseArgs = {
    base?: UserChoose;
    clientFilterCodes: CustomerOption[];
    fbNumber: string;
    dateRange: TrackingsDateRange;
};

/**
 * Normalizza una chiave di sort eliminando spazi, accenti e caratteri non utili.
 */
export function normalizeSortToken(value: string): string {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

/**
 * Traduce il payload dell'header virtualizzato nel formato di sort richiesto dal backend.
 */
export function normalizeTrackingsSort(sort: HeaderSortPayload): {
    sortField?: TrackingsSortField;
    sortDirection?: TrackingsSortDirection;
} {
    const rawKey = String(sort.columnKey || "").trim();
    const normalizedKey = normalizeSortToken(rawKey) as TrackingsSortField;
    const field =
        SORT_FIELD_BY_COLUMN_KEY[rawKey as TrackingsSortField] ||
        SORT_FIELD_BY_COLUMN_KEY[normalizedKey];

    if (!field) {
        return {};
    }

    if (sort.sortDirection === 1) {
        return { sortField: field, sortDirection: "asc" };
    }

    if (sort.sortDirection === 2) {
        return { sortField: field, sortDirection: "desc" };
    }

    return {};
}

/**
 * Normalizza l'URL tracking garantendo il protocollo per aperture e copia.
 */
export function toTrackingHref(url: string): string {
    const trimmed = String(url || "").trim();
    if (!trimmed) {
        return "";
    }
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return `https://${trimmed}`;
}

/**
 * Costruisce il payload filtri da inviare al backend partendo dallo stato corrente del layout.
 */
export function buildTrackingsUserChoose({
    base,
    clientFilterCodes,
    fbNumber,
    dateRange,
}: BuildTrackingsUserChooseArgs): UserChoose {
    const next: UserChoose = { ...(base ?? {}) };

    if (clientFilterCodes.length > 0) {
        const codes = clientFilterCodes.map((customer) => customer.codiceCliente);
        next.ccd = codes;
        next.ccli = codes.map((codice) => ({ codice }));
    } else {
        delete next.ccd;
        delete next.ccli;
    }

    const normalizedFbNumber = String(fbNumber || "").trim();
    if (normalizedFbNumber.length > 0) {
        next.nfb = normalizedFbNumber;
    } else {
        delete next.nfb;
    }

    const from = String(dateRange.from || "").trim();
    const to = String(dateRange.to || "").trim();

    if (from.length > 0) {
        next.ird = from;
    } else {
        delete next.ird;
    }

    if (to.length > 0) {
        next.erd = to;
    } else {
        delete next.erd;
    }

    if (from.length > 0 || to.length > 0) {
        next.dateRange = true;
    } else {
        delete next.dateRange;
    }

    return next;
}

/**
 * Unisce le opzioni clienti mantenendo un solo record per codice cliente.
 */
export function mergeCustomerOptions(
    currentOptions: CustomerOption[],
    nextOptions: CustomerOption[]
): CustomerOption[] {
    const map = new Map<string, CustomerOption>();
    currentOptions.forEach((item) => map.set(item.codiceCliente, item));
    nextOptions.forEach((item) => map.set(item.codiceCliente, item));
    return Array.from(map.values());
}

/**
 * Riporta in testa le opzioni clienti selezionate senza perdere l'ordine del resto.
 */
export function prioritizeSelectedCustomerOptions(
    options: CustomerOption[],
    selectedOptions: CustomerOption[]
): CustomerOption[] {
    const selectedCodes = new Set(selectedOptions.map((option) => option.codiceCliente));
    const selected = options.filter((option) => selectedCodes.has(option.codiceCliente));
    const unselected = options.filter((option) => !selectedCodes.has(option.codiceCliente));
    return [...selected, ...unselected];
}

/**
 * Restituisce il messaggio di errore piu affidabile disponibile nel payload errore.
 */
export function resolveTrackingsErrorMessage(error: unknown, fallback: string): string {
    const normalizedError = error as {
        msg?: string;
        message?: string | { msg?: string };
    };

    if (typeof normalizedError?.msg === "string" && normalizedError.msg.trim().length > 0) {
        return normalizedError.msg;
    }

    if (
        typeof normalizedError?.message === "string" &&
        normalizedError.message.trim().length > 0
    ) {
        return normalizedError.message;
    }

    if (
        typeof normalizedError?.message === "object" &&
        typeof normalizedError.message?.msg === "string" &&
        normalizedError.message.msg.trim().length > 0
    ) {
        return normalizedError.message.msg;
    }

    return fallback;
}

/**
 * Renderizza la cella del corriere con logo se disponibile.
 */
export function renderCourierCell(value: unknown) {
    const courierName = String(value || "").trim();

    if (!courierName) {
        return <span className="text-gray-400 dark:text-gray-500">/</span>;
    }

    const courierLogo = COURIER_LOGO_BY_CODE[courierName.toUpperCase()];

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
            }}
        >
            <span>{courierName}</span>
            {courierLogo ? (
                <img
                    src={courierLogo}
                    alt={`Logo ${courierName}`}
                    style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }}
                />
            ) : null}
        </div>
    );
}
