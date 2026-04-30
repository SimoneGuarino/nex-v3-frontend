export type CompanyCode = string;

export type DocumentItem = {
    id: string;                 // chiave stabile
    tp: string;                 // "NotaCredito" ...
    fileName: string;           // "DOC-NotaCredito-027320-POSTEITALIANESPA-97LSC-120224.PDF"
    date: Date;               // ISO "2024-02-12T00:00:00.000Z"
    ragione_sociale: string;    // "POSTEITALIANESPA"
    codice_cliente: string;     // "027320"
    numdoc: string;             // "97LSC"
    company?: string;           //  "Focelda" | "IOT"
    path?: string;              // "2024/FATTURE"
    favorite?: boolean;
    sharedWith?: { id: string; initials: string }[];
};

export type DocumentItemMapped = {
    id: string;
    tp: string;
    name: string;
    date: Date;               // ISO "2024-02-12T00:00:00.000Z"
    icon: React.ReactNode;      // icona file

    ragione_sociale: string;
    numdoc: string;
    company: "FOCELDA" | "IOT";
    codice_cliente: string;
    partita_iva?: string;
    codice_fiscale?: string;

    type?: "BOLLA" | "FATTURA";
    element_type: "DOCUMENT" | "PERSON";

    favorite?: boolean;
    sharedWith?: { id: string; initials: string }[];
    /**
     * Usato SOLO per i risultati della ricerca mirata (debounced).
     * Se un documento arriva da una ricerca "per codice prodotto", qui salviamo il cdar (normalizzato a 6 cifre).
     *
     * Serve per distinguere il click:
     * - se searchCdar è valorizzato => il click applica il filtro "Codice prodotto" (come accade per il cliente)
     * - se searchCdar non c'è => comportamento attuale (selezione singolo documento)
     */
    searchCdar?: string;
};

export type CustomerItem = {
    codice_cliente: string;
    name: string;
    partita_iva?: string;
    codice_fiscale?: string;
    email?: string;             // "<email>"
    company?: CompanyCode;      // "Focelda" | "IOT"
    /*favorite?: boolean;
    sharedWith?: { id: string; initials: string }[];
    ownerId?: string;*/
};

export type ScopeTab = 'all' | 'mine' | 'favorites' | 'shared' | 'deleted';

export type GroupBy = 'none' | 'date' | 'company' | 'type';
export type SortBy = 'date' | 'name' | 'type' | 'company';
export type SortDir = 'asc' | 'desc';

export type Filters = {
    types?: string[];
    companies?: CompanyCode[];
    dateFrom?: string; // ISO
    dateTo?: string;   // ISO
    text?: string;
};

export type Pagination = {
    limit: number;
    mode: "offset" | "cursor";
    offset: number;

    nextOffset: number | null;
    hasMore: boolean;
    loadingInitial: boolean;
    loadingMore: boolean;
}