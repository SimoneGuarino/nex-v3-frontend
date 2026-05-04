/** Tipi condivisi per il modulo payments */

export type PaymentsSortField =
    | "NUMOV"
    | "DAMOV"
    | "CDCLI"
    | "CLIFO"
    | "RASCL"
    | "CDAGE"
    | "IMPMO"
    | "CAUSA"
    | "DERIG";

export type PaymentsSortDirection = "asc" | "desc";

export type UserChoose = {
    nmv?: string;
    acd?: string | null;
    ccd?: string | null;
    ird?: string | null; // "A" (dd/MM/yyyy)
    erd?: string | null; // "DAL" (dd/MM/yyyy)
    dateRange?: boolean;
    ofs?: number;
    limit?: number;
    sortField?: PaymentsSortField;
    sortDirection?: PaymentsSortDirection;
};

export interface Customer {
    CodiceAgente: string;
    RagioneSociale: string;
    CodiceCliente: string;
    CodiceFiscale: string;
    PartitaIVA: string;
}
