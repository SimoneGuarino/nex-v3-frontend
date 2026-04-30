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