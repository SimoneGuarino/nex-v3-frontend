export type PurchaseDocumentLink = {
    available: boolean;
    fileName: string | null;
};

export type PurchaseRow = {
    environment: "FOCELDA" | "IOT";
    warehouse: string;
    documentNumber: string;
    articleCode: string;
    description: string;
    quantity: number;
    unitPrice: number;
    rowValue: number;
    brand: string;
    documentDate: number;
    customerCode: string;
    customerName: string;
    agentCode: string;
    invoice: PurchaseDocumentLink;
    deliveryNote: PurchaseDocumentLink;
};

export type PurchasesListResponse = {
    items: PurchaseRow[];
    total: number;
    page: number;
    pageSize: number;
};

export type PurchasesSummaryResponse = {
    totalRows: number;
    totalQty: number;
    totalValue: number;
    generatedAt: string | null;
    partial: boolean;
};

export type PurchasesFiltersResponse = {
    brands: Array<{ value: string; label: string }>;
    lines: Array<{ value: string; label: string }>;
    groups: Array<{ value: string; label: string }>;
    families: Array<{ value: string; label: string }>;
    agents: Array<{ value: string; label: string }>;
    customers: Array<{ value: string; label: string }>;
    /**
     * Relazioni gerarchiche prodotto (brand -> linea -> gruppo -> famiglia).
     *
     * NOTE IMPORTANTI:
     * - viene restituita dal backend come "fotografia" del perimetro attuale;
     * - serve al frontend per calcolare la cascata localmente senza richiamare
     *   l'endpoint lookup a ogni cambio selezione;
     * - è opzionale per retrocompatibilità (se assente usiamo fallback legacy).
     */
    taxonomy?: Array<{
        brandCode: string;
        lineCode: string;
        groupCode: string;
        familyCode: string;
    }>;
};

export type PurchasesSortField =
    | "dataDocumento"
    | "ambiente"
    | "magazzino"
    | "numeroDocumento"
    | "codiceArticolo"
    | "descrizione"
    | "quantita"
    | "prezzo"
    | "valore"
    | "brand"
    | "ragioneSociale";

export type PurchasesSortDirection = "asc" | "desc";

export type PurchasesHeaderSortPayload = {
    columnKey: string;
    sortDirection: number;
};

export type PurchasesQuery = {
    env: "" | "FOCELDA" | "IOT";
    agentCodes: string[];
    customerCodes: string[];
    brandCodes: string[];
    lineCodes: string[];
    groupCodes: string[];
    familyCodes: string[];
    dateFrom: string;
    dateTo: string;
    sortField: PurchasesSortField;
    sortDirection: PurchasesSortDirection;
};
