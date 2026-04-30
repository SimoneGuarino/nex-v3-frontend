export type Customer = {
    CodiceCliente: {
        "Focelda": string | null;
        "IOT": string | null;
    };
    CodiceFiscale: string;
    PartitaIVA: string;
    RagioneSociale: string;
    CanaleVendita?: string;
    Email?: string;
    NumCell?: string;
    Pagamento?: string;
    Pec?: string;
    [k: string]: any;
};

export interface CustomerQuickDetailsDTO {
    id: string;
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