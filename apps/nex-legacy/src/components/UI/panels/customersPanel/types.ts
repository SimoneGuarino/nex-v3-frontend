import type { PaymentRow } from "layouts/stocks/payments/fetchData/data";

export type AnyRecord = Record<string, any>;

export type PanelMode = "summary" | "details";

// Sezioni disponibili nel pannello secondario (details).
// Ogni nuovo valore richiede:
// - un case in `CustomersPanelDetailsContent`
// - metadati in `helpers/panelSections`
// - (opzionale) bottone summary che richiama `onOpenDetails`
export type DetailsSection =
    | "anagrafica"
    | "fido"
    | "credit"
    | "backorders"
    | "payments"
    | "profilazione"
    | "trackings"
    | "notes"
    | "sconti";

// Sezioni tracciate per loading/fetch-state.
// Note:
// - le chiavi possono differire da `DetailsSection` (es. "credits" -> details "fido")
// - mantenere allineamento con `createEmptyLoadingStates` e `createEmptySectionFetchStates`
export type LoadingSection = "anagrafica" | "credits" | "creditsYears" | "backorders" | "payments" | "profilazione" | "trackings" | "quotes" | "purchases" | "notes" | "sconti";

export type LoadingStates = Record<LoadingSection, boolean>;

export type SectionFetchState = "idle" | "success" | "error";

export type SectionFetchStates = Record<LoadingSection, SectionFetchState>;

export type BackordersDetailsPayload = {
    total: number;
    items: AnyRecord[];
    nextOfs: number;
};

export type BackordersSummaryPayload = {
    totalRows: number;
    agg: AnyRecord | null;
};

export type PaymentsDetailsPayload = {
    total: number;
    items: PaymentRow[];
    nextOfs: number;
};

export type TrackingPreviewRow = {
    DATA_INSERIMENTO_TRACKING?: string | null;
    CORRIERE?: string | null;
    NUM_FB?: string | number | null;
    URL_TRACKING?: string | null;
    [key: string]: any;
};

export type TrackingsDetailsPayload = {
    total: number;
    items: TrackingPreviewRow[];
    nextOfs: number;
};

export type ScontiDetailsPayload = {
    total: number;
    items: AnyRecord[];
};

export type ScontiViewType = "cliente" | "categoria";

export type ScontiPayload = {
    total: number;
    cliente: ScontiDetailsPayload;
    categoria: ScontiDetailsPayload;
};

/**
 * Preview minima dei preventivi usata nel CustomersPanel.
 * Non rappresenta la vista completa Preventivi: serve solo a mostrare
 * poche righe recenti e il totale complessivo del cliente.
 */
export type CustomerQuotesSummaryPayload = {
    total: number;
    items: AnyRecord[];
};

/**
 * Preview minima acquisti usata nel CustomersPanel.
 * Mostra massimo 10 righe recenti come punto di accesso rapido alla vista completa.
 */
export type CustomerPurchasesSummaryPayload = {
    total: number;
    items: AnyRecord[];
};

export type CustomerFullPayload = {
    // Payload centralizzato: summary e details leggono entrambi da qui.
    // Ogni nuova section con dati remoti dovrebbe avere il proprio campo dedicato.
    anagrafica: AnyRecord | null;
    creditsProfile: AnyRecord | null;
    creditsYears: AnyRecord | null;
    backordersSummary: BackordersSummaryPayload | null;
    backordersDetails: BackordersDetailsPayload | null;
    paymentsDetails: PaymentsDetailsPayload | null;
    quotesSummary: CustomerQuotesSummaryPayload | null;
    purchasesSummary: CustomerPurchasesSummaryPayload | null;
    profilazioneReport: AnyRecord | null;
    trackingDetails: TrackingsDetailsPayload | null;
    sconti: ScontiPayload | null;
    // warnings: string[]; @deprecated
};

export type CustomersPanelOpenFor = boolean | string | null;

export type CustomersPanelProps = {
    cliente: string | number; //numero cliente
    openFor: CustomersPanelOpenFor; //state per cui è aperto il pannello
    onClose: () => void; //state da aggiornare alla chiusura
    sizeClassName?: string; //classe per gestire la larghezza
    closeOnBackdrop?: boolean; //se false impedisce la chiusura con click esterno
    closeOnEsc?: boolean; //se false impedisce la chiusura con esc
    className?: string; //classi aggiuntive
    zIndexClassName?: string; //personalizza z-index
};
