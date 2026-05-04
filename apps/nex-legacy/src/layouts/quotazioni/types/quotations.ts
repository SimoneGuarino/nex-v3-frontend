import { User } from "types/user";
import { Customer } from "./customers";

export type SortDir = 'asc' | 'desc';
export type LoadStatusKeys = "req_customersList" | "get_own_quotations" | "get_all_quotations" | "get_quotation_details" | "create_quotation" | "update_quotation" | "delete_quotation" | "get_cart_products" | "get_quotation_ok_links" ;
export type Tipologia = "STANDARD" | "BID_ATTIVO" | "BID_PASSIVO" | "MEPA" | "CTO" | "LICENZE";
export const filterTypeOptions = ["STANDARD", "BID_ATTIVO", "BID_PASSIVO", "MEPA", "CTO", "LICENZE"];

export type Scope = "TUTTI" | Tipologia;
export type Stato = "BOZZA" | "VALIDAZIONE" | "APERTA" | "ANNULLATA" | "DA_CHIUDERE" | "OK" | "KO";
export const filterStateOptions = ["BOZZA", "VALIDAZIONE", "APERTA", "ANNULLATA", "DA_CHIUDERE", "OK", "KO"];
export const STATE_COLOR_STYLES: Record<Stato, { text: string; bg: string; dot: string; dotDark: string }> = {
    "BOZZA": { text: "text-gray-800", bg: "bg-gray-200", dot: "bg-gray-500", dotDark: "dark:bg-gray-900" },
    "VALIDAZIONE": { text: "text-orange-800", bg: "bg-orange-200", dot: "bg-orange-500", dotDark: "dark:bg-orange-900" },
    "APERTA": { text: "text-blue-800", bg: "bg-blue-200", dot: "bg-blue-500", dotDark: "dark:bg-blue-900" },
    "KO": { text: "text-red-800", bg: "bg-red-200", dot: "bg-red-500", dotDark: "dark:bg-red-900" },
    "OK": { text: "text-green-800", bg: "bg-green-200", dot: "bg-green-500", dotDark: "dark:bg-green-900" },
    "ANNULLATA": { text: "text-red-800", bg: "bg-red-200", dot: "bg-red-500", dotDark: "dark:bg-red-900" },
    "DA_CHIUDERE": { text: "text-orange-800", bg: "bg-orange-200", dot: "bg-orange-500", dotDark: "dark:bg-orange-900" },
};

export type RigaStato = "ATTESA_VALUTAZIONE" | "VALUTAZIONE_COMPLETATA" | "VALUTAZIONE_RIFIUTATA" | "ATTESA_APPROVAZIONE"
    | "CONTROPROPOSTA_RICHIESTA" | "CONTROPROPOSTA_INVIATA" | "CONTROPROPOSTA_ACCETTATA" | "CONTROPROPOSTA_RIFIUTATA";

export const stateProductOptionsPalette: { [key in RigaStato]: string } = {
    ATTESA_VALUTAZIONE: "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700",
    VALUTAZIONE_COMPLETATA: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700",
    VALUTAZIONE_RIFIUTATA: "bg-red-50 text-red-700 border-red-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-700",
    ATTESA_APPROVAZIONE:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700",
    CONTROPROPOSTA_RICHIESTA:
        "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-700",
    CONTROPROPOSTA_INVIATA:
        "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-700",
    CONTROPROPOSTA_ACCETTATA:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700",
    CONTROPROPOSTA_RIFIUTATA:
        "bg-red-50 text-red-700 border-red-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-700",
};

export const stateProductLabels: { [key in RigaStato]: string } = {
    ATTESA_VALUTAZIONE: "In attesa di valutazione",
    VALUTAZIONE_COMPLETATA: "Valutazione completata",
    VALUTAZIONE_RIFIUTATA: "Valutazione rifiutata",
    ATTESA_APPROVAZIONE: "In attesa di approvazione",
    CONTROPROPOSTA_INVIATA: "Controproposta inviata",
    CONTROPROPOSTA_RICHIESTA: "Controproposta richiesta",
    CONTROPROPOSTA_ACCETTATA: "Controproposta accettata",
    CONTROPROPOSTA_RIFIUTATA: "Controproposta rifiutata",
};

/**Tabella delle conversioni label degli stati prodotto */
export const productStateTransitions: Record<string, string> = {
    "VALUTAZIONE_COMPLETATA": "QUOTAZIONE_CONFERMATA",
    "CONTROPROPOSTA_ACCETTATA": "QUOTAZIONE_CONFERMATA",
};

type ExtraProps = {
    isEndUser?: boolean;
    type?: {
        CIG?: string;
        RDO?: string;
        ACCORDO_QUADRO?: string;
    };
    details?: {
        nome: string;
        partitaIva: string;
        riferimento?: string;
        telefono?: string;
        email?: string;
        sedeLegale?: string;
    };
};

export interface IQuotationBuyerProgress {
    buyerCode: string;
    total: number;
    toDo: number;
    waiting: number;
    done: number;
    hasToDo: boolean;
    hasWaiting: boolean;
    lastUpdate: Date;
};

export interface QuotazioneDTO {
    _id: string;
    titolo: string;
    tipologia: Tipologia;
    stato: Stato;
    agenteId: string;
    agente: Pick<User, "nome" | "cognome" | "username" | "immagini" | "biografia">;
    cliente: {
        ragione_sociale: string;
        codice: {
            [k: string]: string | undefined;
        };
    };
    buyersProgress?: IQuotationBuyerProgress[];
    valore?: number;
    note?: string; // nota del utente che ha creato la quotazione

    scadenza?: Date;      // ISO
    created_at?: Date;    // ISO
    updated_at?: Date;    // ISO
    prog_num?: number; // ide progressivo alla creazione di una nuova quotazione

    /* Stato della approval fatta dagli utenti autorizzati quando la quotazione è in fase di approval con tipologia BID_PASSIVO */
    approvazione?: {
        reason: string | null,
        timestamp: Date,
        action_by: string,
        stato: "APPROVATA" | "RIFIUTATA",
    };

    /** la finestra di validità fa riferimento al range di date che l'utente puo inserire nel momento della creazione della quotazione */
    finestraValidita?: {
        inizio?: Date;
        fine: Date;
    };

    extra: ExtraProps;

    /** 
     * Definsice il risultato finale se la controproposta è stata accettata e ha generato un link "OK" (es. ordine, MEPA, ecc.)
     * Può essere usato per mostrare un link diretto all'ordine creato o alla RDO MEPA, se applicabile.
    */
    okLinkedProducts?: {
        _id: string;
        final_ok_link: {
            oc?: string;
            fb?: string;
            linked_by: string; // userId di chi ha effettuato il link
            linked_at: Date;   // ISO
        }
    }[];
    [k: string]: any;
};

type InfinitePaginationState = {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    nextPage: number | null;
};

export interface QuotazioniListResponse {
    data: QuotazioneDTO[];
    pagination: InfinitePaginationState;
};

export interface QuotazioneDetailsResponse {
    data: QuotazioneDTO;
    cliente: Customer;
};

export type SortableField = "_id" | "created_at" | "updated_at";
export type SortOrderStr = "asc" | "desc";

export interface BaseQtsFilters {
    stato?: Stato;
    tipologia?: Tipologia;
    limit?: number;         // default 50, max 200
    page?: number;          // default 1
    sortBy?: SortableField; // default created_at
    order?: SortOrderStr;   // default desc
    // Questi filtri vengono inviati al BE: niente filtro locale "post-fetch".
    dateFrom?: string; // YYYY-MM-DD
    dateTo?: string;   // YYYY-MM-DD
    prog_num?: number; // numero progressivo
    valoreMin?: number; // valore minimo quotazione
    valoreMax?: number; // valore massimo quotazione
    buyerCode?: string; // filtro buyer (codice univoco)
    agenteId?: string;  // filtro agente (id Mongo)
    osf?: number; // offset for infinite scroll, se usato come filtro viene passato come "page" al BE, altrimenti è un parametro a parte per le API di infinite scroll che usano offset invece di page number
};

export interface GetOwnQtsFilters extends BaseQtsFilters {
    agenteIdOverride?: string; // per test/override manuale
};

export interface GetAllQtsFilters extends BaseQtsFilters {
};

export type Filters = {
    types?: string[];
    dateFrom?: string; // ISO
    dateTo?: string;   // ISO
    text?: string;
};

export type Pagination = {
    limit: number;
    mode: "offset" | "cursor";
    offset: number;
    totale?: number;
    page?: number;

    nextOffset: number | null;
    hasMore: boolean;
    loadingInitial: boolean;
    loadingMore: boolean;
};

export type ChangeLoadStatusArgs = {
    from: LoadStatusKeys;
    bool?: boolean;
};