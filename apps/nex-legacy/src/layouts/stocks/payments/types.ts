/** Tipi condivisi per il modulo payments */

export type UserChoose = {
    nmv?: string;
    acd?: string | null;
    ccd?: string | null;
    ird?: string | null; // "A" (dd/MM/yyyy)
    erd?: string | null; // "DAL" (dd/MM/yyyy)
    dateRange?: boolean;
    ofs?: number;
    limit?: number;
};

export interface Customer {
    CodiceAgente: string;
    RagioneSociale: string;
    CodiceCliente: string;
    CodiceFiscale: string;
    PartitaIVA: string;
}
