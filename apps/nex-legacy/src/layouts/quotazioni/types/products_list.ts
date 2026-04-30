// descrizione minimale (compatibile con il BE)
export interface ProductDescrizioneDTO {
    Corta?: string | null;
    Lunga?: string | null;
    Lista?: unknown[] | null;
}

// prodotto “light” per la UI quotazioni
export interface ProductLightDTO {
    _id: string;                 // obbligatorio
    inQuotation: boolean;        // obbligatorio: true se prodotto già presente nella quotazione corrente
    inCart: boolean;             // presente ma lato BE è sempre false (placeholder)

    Ci?: string | number | null; // nel BE è Mixed: qui lo accettiamo come string|number
    Da?: string | null;

    AssegnatoBuyer?: string | null;

    CodiceEAN?: string | null;
    CodiceProduttore?: string | null;
    CodicePulito?: string | null;
    CodiciGTIN?: Array<string | number>; // nel BE è unknown[]: tipizziamo ai casi comuni

    Descrizione?: ProductDescrizioneDTO;

    Famiglia?: string | null;
    Gruppo?: string | null;
    Linea?: string | null;
    Marca?: string | null;

    // opzionalmente puoi tenere anche questi se vuoi logiche extra in UI:
    // Aggiornato?: string;            // ISO
    // UltimoAggiornamento?: string;   // ISO
}

// risposta della rotta /quotations/:id/products-list
export interface ProductsListResponseDTO {
    success: boolean;
    limit: number;
    offset: number;
    nextOfs: number | null;
    hasMore: boolean;
    data: ProductLightDTO[];
}

// -------- mapper sicuro dal payload BE al nostro DTO “light” --------

export function mapToProductLightDTO(raw: any): ProductLightDTO {
    // fallback: se il BE non inviasse ancora inQuotation, usiamo inCart per non rompere la UI
    const safeInQuotation = raw?.inQuotation ?? raw?.inCart ?? false;

    return {
        _id: String(raw?._id),                          // forziamo sempre string
        inQuotation: Boolean(safeInQuotation),          // garantiamo boolean
        inCart: Boolean(raw?.inCart ?? false),          // BE: sempre false per design

        Ci: typeof raw?.Ci === "number" || typeof raw?.Ci === "string" ? raw.Ci : null,
        Da: raw?.Da ?? null,

        AssegnatoBuyer: raw?.AssegnatoBuyer ?? null,

        CodiceEAN: raw?.CodiceEAN ?? null,
        CodiceProduttore: raw?.CodiceProduttore ?? null,
        CodicePulito: raw?.CodicePulito ?? null,
        CodiciGTIN: Array.isArray(raw?.CodiciGTIN) ? (raw.CodiciGTIN as Array<string | number>) : [],

        Descrizione: raw?.Descrizione
            ? {
                Corta: raw.Descrizione.Corta ?? null,
                Lunga: raw.Descrizione.Lunga ?? null,
                Lista: Array.isArray(raw.Descrizione.Lista) ? raw.Descrizione.Lista : null,
            }
            : undefined,

        Famiglia: raw?.Famiglia ?? null,
        Gruppo: raw?.Gruppo ?? null,
        Linea: raw?.Linea ?? null,
        Marca: raw?.Marca ?? null,
    };
}
