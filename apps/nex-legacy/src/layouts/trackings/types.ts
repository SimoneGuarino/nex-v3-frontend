import type {
    Dispatch,
    MouseEvent as ReactMouseEvent,
    MutableRefObject,
    ReactNode,
    SetStateAction,
} from "react";

/** Campi supportati dal sort server-side del modulo trackings. */
export type TrackingsSortField =
    | "DATA_INSERIMENTO_TRACKING"
    | "ANNO"
    | "MAGAZZINO_PARTENZA"
    | "CORRIERE"
    | "COD_CLIENTE"
    | "DEN_SOC"
    | "INDIRIZZO_CLIENTE"
    | "CAP"
    | "LOCALITA"
    | "PROVINCIA"
    | "DESTINATARIO"
    | "INDIRIZZO_DESTINATARIO"
    | "CAP_DESTINATARIO"
    | "LOCALITA_DESTINATARIO"
    | "PROVINCIA_DESTINATARIO"
    | "PESO_KG"
    | "VOLUME_M3"
    | "NUMERO_COLLI"
    | "EMAIL_DESTINATARIO"
    | "TEL_DESTINATARIO"
    | "NUM_FB"
    | "DATA_ORDINE_FB"
    | "URL_TRACKING";

/** Direzioni supportate dal backend per il sort. */
export type TrackingsSortDirection = "asc" | "desc";

/** Range date usato dal filtro FDDate. */
export type TrackingsDateRange = {
    from?: string;
    to?: string;
};

/** Payload filtri inviato al backend trackings. */
export type UserChoose = {
    nfb?: string;
    ccd?: string[] | string | null;
    ccli?: Array<{ codice: string }>;
    ird?: string | null;
    erd?: string | null;
    dateRange?: boolean;
    ofs?: number;
    limit?: number;
    sortField?: TrackingsSortField;
    sortDirection?: TrackingsSortDirection;
    [key: string]: unknown;
};

/** Struttura minima dei clienti mostrati nel filtro multi-select. */
export type CustomerOption = {
    id?: string;
    codiceCliente: string;
    ragioneSociale: string;
    partitaIVA?: string | null;
    codiceFiscale?: string | null;
    fido?: {
        fidoTotale: number;
        saldoCliente: number;
        aScadere: number;
        scaduto: number;
        fuoriFido: number;
        insoluti: number;
        valoreFB: number;
        valoreOC: number;
        totaleMovimenti: number;
    } | null;
};

/** Riga generica restituita dalla tabella trackings. */
export type TrackingRow = {
    URL_TRACKING?: string | null;
    CORRIERE?: string | null;
    [key: string]: unknown;
};

/** Stato di caricamento coordinato tra tabella, ricerca e infinite scroll. */
export type TrackingsLoadStatus = {
    table: boolean;
    filters: boolean;
    search: boolean;
    infiniteScroll: boolean;
};

/** Chiavi consentite per aggiornare lo stato di caricamento. */
export type TrackingsLoadStatusKey = keyof TrackingsLoadStatus;

/** Payload usato per togglare o impostare uno specifico loader. */
export type ChangeLoadArgs = {
    from: TrackingsLoadStatusKey;
    bool?: boolean;
};

/** Payload emesso dall'header virtualizzato per il sort lato server. */
export type HeaderSortPayload = {
    columnKey: string;
    sortDirection: number;
};

/** Contratto minimo delle colonne usate da TableVirtualized nel modulo trackings. */
export type TrackingsTableColumn = {
    label?: string;
    key?: string | string[] | Record<string, unknown> | unknown;
    secKey?: string;
    width?: number;
    sort?: boolean;
    sortType?: string;
    type?: string;
    columnOnHover?: string;
    render?: (props: { row: TrackingRow }) => ReactNode;
    [key: string]: unknown;
};

/** Setter riusabile per l'array colonne della tabella. */
export type TrackingsColumnsSetter = Dispatch<SetStateAction<TrackingsTableColumn[]>>;

/** Ref usato per agganciare i context menu a un bottone. */
export type TrackingsMenuAnchorRef = MutableRefObject<HTMLButtonElement | null>;

/** Sottoinsieme del contesto utente letto da questo layout. */
export type TrackingsUserContext = {
    details?: Record<string, unknown> | null;
    token?: string;
};

/** Stato e azioni esposti al pannello filtri. */
export type TrackingsFiltersState = {
    isOpen: boolean;
    anchorRef: TrackingsMenuAnchorRef;
    fbNumber: string;
    setFbNumber: Dispatch<SetStateAction<string>>;
    dateRange: TrackingsDateRange;
    setDateRange: Dispatch<SetStateAction<TrackingsDateRange>>;
    clientFilterCodes: CustomerOption[];
    setClientFilterCodes: (values: CustomerOption[]) => void;
    customerOptions: CustomerOption[];
    customerLoading: boolean;
    onCustomerSearchChange: (value: string) => void;
    openMenu: () => void;
    closeMenu: () => void;
    resetFilters: () => void;
};

/** Stato e azioni del menu tracking associato a ogni riga della tabella. */
export type TrackingsOptionMenuState = {
    isOpen: boolean;
    anchorRef: TrackingsMenuAnchorRef;
    selectedTrackingUrl: string;
    selectedTrackingHref: string;
    openMenu: (event: ReactMouseEvent<HTMLButtonElement>, row: TrackingRow) => void;
    closeMenu: () => void;
    copyUrl: () => Promise<void>;
    openUrl: () => void;
};

/** Stato e azioni necessari al componente che incapsula TableVirtualized. */
export type TrackingsTableState = {
    columns: TrackingsTableColumn[];
    setColumns: TrackingsColumnsSetter;
    rows: TrackingRow[];
    setRows: Dispatch<SetStateAction<TrackingRow[]>>;
    total: number;
    loadStatus: TrackingsLoadStatus;
    serverSort: HeaderSortPayload;
    infiniteScroll: () => Promise<boolean>;
    onSortChange: (payload: HeaderSortPayload) => void;
};

/** Risultato completo restituito dall'hook che governa il layout. */
export type UseTrackingsStateResult = {
    filters: TrackingsFiltersState;
    table: TrackingsTableState;
    trackingMenu: TrackingsOptionMenuState;
    handleSearch: () => void;
};
