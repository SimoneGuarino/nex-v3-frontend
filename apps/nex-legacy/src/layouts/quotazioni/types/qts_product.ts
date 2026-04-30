import { RigaStato } from "./quotations";

type filterFamigliaType = {
    _id: string;
    famiglia: string;
    desdcrizioneFamiglia: string;
};
type filterGruppoType = {
    _id: string;
    Gruppo: string;
    DescrizioneGruppo: string;
    Raggruppamento: string[];
    famiglie: filterFamigliaType[];
};
type filterLineType = {
    _id: string;
    Linea: string;
    DescrizioneLinea: string;
    SubCategory: filterGruppoType[];
};
type filterBrandType = {
    _id: string;
    Categories: filterLineType[];
    Marca: string;
    PrefissiFornitore: string[];
};
export type FiltersType = {
    marca: filterBrandType | null;
    linea: filterLineType | null;
    gruppo: filterGruppoType | null;
    famiglia: filterFamigliaType | null;
    raggruppamento: string | null;
};
export type QuoteProductKind = "PRODUCT" | "TEXT_REQUEST";
export type SearchResponse = { items: any[]; counts: { raw: number; flat: number } }; // adatta ai tuoi tipi
export type Pagination = {
    limit: number;
    mode: "offset" | "cursor";
    offset: number;

    nextOffset: number | null;
    hasMore: boolean;
    loadingInitial: boolean;
    loadingMore: boolean;
}

export type DecimalValue = string | number;

export type ProductEventType =
    | "CREAZIONE_QUOTAZIONE"
    | "RICHIESTA_PREZZO"
    | "PROPOSTA_PREZZO"
    | "ACCETTAZIONE_PREZZO"
    | "RIFIUTO_PREZZO"
    | "RICHIESTA_SOSTITUZIONE"
    | "PROPOSTA_SOSTITUZIONE"
    | "ACCETTAZIONE_SOSTITUZIONE"
    | "RIFIUTO_SOSTITUZIONE"
    | "CAMBIO_STATO"
    | "NOTA"
    // Evento usato dal pannello ProductDetailsReporting per tracciare
    // segnalazioni/correzioni della scheda prodotto nel contesto Quotazioni.
    | "SEGNALAZIONE_ANOMALIA_SCHEDA"
    | "CAMBIO_BUYER"
    | "SUGGERIMENTO_ALTERNATIVA_AGGIUNTO"
    | "SUGGERIMENTO_ALTERNATIVA_RIMOSSO"
    | "ALTRO";

// Singolo evento di timeline
export interface ProductEventDTO {
    id: string; // es. ObjectId o id locale "local-<timestamp>"
    type: ProductEventType;
    timestamp: string; // ISO string

    // chi ha effettuato l’azione
    actor: {
        name: string | null;
        username: string | null;
        role: "COMMERCIALE" | "BUYER" | "ADMIN" | "DEV" | "SYSTEM" | string;
    }

    // testo leggibile / nota rapida
    message?: string | null;

    // dettagli per UI/analisi (tutti opzionali, così non rompi BE esistente)
    meta?: {
        fromState?: RigaStato | null;
        toState?: RigaStato | null;

        prevPrice?: number | null;
        newPrice?: number | null;

        prevQty?: number | null;
        newQty?: number | null;

        originalKind?: QuoteProductKind | null;
        originalProductId?: string | null;      // prodotto iniziale
        substitutedProductId?: string | null;   // prodotto proposto
        substitutionId?: string | null;         // _id controproposta se serve
        alternativeSuggestionId?: string | null; // _id suggerimento commerciale
        alternativeProductSnapshot?: Record<string, any> | null;

        prevBuyerCode?: string | null;          // codice buyer precedente
        newBuyerCode?: string | null;           // codice buyer nuovo

        /**
         * Dati usati quando viene segnalata un'anomalia sulla scheda prodotto.
         * - anomalyOriginal: vista completa della scheda all'apertura del form (originale)
         * - anomalyPatch: solo i campi modificati dall'utente
         * - anomalyNote: nota obbligatoria con il contesto della segnalazione
         *
         * Nota: questi campi descrivono una richiesta di revisione,
         * non una modifica diretta della scheda prodotto.
         */
        anomalyOriginal?: Record<string, any> | null;
        anomalyPatch?: Record<string, any> | null;
        anomalyNote?: string | null;
    } | null;
}

export type QuotationeCart = {
    prezzo_base?: DecimalValue;
    sconto_percentuale?: DecimalValue;
    prezzo_finale?: DecimalValue;
    validita_offerta?: string; // ISO
    stato: RigaStato;
    scadenza?: string; // ISO
};



export interface CommercialAlternativeSuggestionDTO {
    _id: string;
    quotation_id: string;
    quotation_product_docId: string;
    product_id: string;
    source: "COMMERCIALE";
    note?: string | null;
    dettagli_prodotto: {
        codiceProduttore?: string | null;
        codiceEAN?: string | null;
        descrizione?: string | null;
        anteprima?: string | null;
        marca?: string | null;
        linea?: string | null;
        gruppo?: string | null;
        famiglia?: string | null;
        descrizioneLinea?: string | null;
        descrizioneGruppo?: string | null;
        descrizioneFamiglia?: string | null;
    };
    createdBy: {
        nome: string | null;
        username: string | null;
        ruolo: string | null;
    };
    createdAt: Date;
    updatedAt: Date;
}

/** Controproposta associata a una quotazione del prodotto */
export interface ContropropostaDTO {
    _id: string;

    /** Testata quotazione (per query veloci per quotation) */
    quotation_id: string;

    /** Riferimento alla riga principale in quotations_products (non*/
    quotation_product_docId: string;

    /** Prodotto proposto in sostituzione */
    product_id: string;

    /** Quantità proposta */
    quantita: number;

    /** Buyer owner (se serve filtro in base al ruolo) */
    codice_buyer: string | null;

    approvato?: boolean;

    /**
     * Stato "workflow" della quotazione associata alla proposta (es. attesa valutazione prezzo).
     * Nota: NON usarlo per rappresentare la decisione (quella sta in decisionStatus).
     */
    stato: RigaStato;
    round?: number; // Numero di round di controproposta (1 = prima controproposta, 2 = controproposta alla controproposta, ecc.)

    /** Snapshot minimale (denormalizzazione per UI/exports senza join pesanti) */
    dettagli_prodotto: {
        codiceProduttore?: string | null;
        codiceEAN?: string | null;
        descrizione?: string | null;
        anteprima?: string | null;

        marca?: string | null;
        linea: string | null; descrizioneLinea?: string | null;
        gruppo: string | null; descrizioneGruppo?: string | null;
        famiglia: string | null; descrizioneFamiglia?: string | null;
    };

    /** Snapshot quotazione su proposta (prezzi e condizioni) */
    quotazione: {
        prezzo_base?: number;
        sconto_percentuale?: number;
        prezzo_finale: number;
        validita_offerta?: string | null; // ISO
        scadenza?: string | null;         // ISO
    };

    /** Audit leggero (opzionale, ma utile quando separi history dal doc principale) */
    createdBy: {
        nome: string | null;
        username: string | null;
        ruolo: string | null;
    };

    createdAt: Date;
    updatedAt: Date;
}

/** Prodotto nel carrello di una quotazione */
export interface CartDocumentDTO {
    _id: string;
    product_id: string;
    kind: QuoteProductKind;   // default "PRODUCT" se mancante
    textRequest: {
        titolo?: string | null;
        descrizione: string;
    };
    quantita: number;
    codice_buyer: string | null;
    approvato: boolean;
    /**Timeline eventi (già definita prima)*/
    eventi: ProductEventDTO[];
    highlight?: boolean;
    dettagli_prodotto: {
        codiceProduttore?: string | null;
        codiceEAN?: string | null;
        descrizione: string | null;
        anteprima?: string | null;
        marca: string | null;

        linea: string | null;
        gruppo: string | null;
        famiglia: string | null;
        descrizioneLinea?: string | null;
        descrizioneGruppo?: string | null;
        descrizioneFamiglia?: string | null;
    };
    controproposte?: ContropropostaDTO[];
    alternativeSuggestions?: CommercialAlternativeSuggestionDTO[];
    quotazione: QuotationeCart;
};

export interface ProductDoc {
    _id: string;
    codiceProduttore?: string | null;
    codiceEAN?: string | null;
    da?: string | null;                        // es. "Focelda"
    marca?: string | null;
    anteprima?: string | null | any;

    linea?: string | null;
    gruppo?: string | null;
    famiglia?: string | null;
    descrizioneLinea?: string | null;
    descrizioneGruppo?: string | null;
    descrizioneFamiglia?: string | null;

    codice_buyer: string | null;

    Aggiornato?: Date | null;
    Ci?: string | null;
    CodicePulito?: string | null;
    CodiceSettore?: string | null;
    CodiciGTIN?: string[];                     // array
    descrizione?: string | null;
    DescrizioneFamiglia?: string | null;
    Disabilitato?: boolean;
    Famiglia?: string | null;
    Gruppo?: string | null;
    Linea?: string | null;
    Marca?: string | null;
    PesiVolumi?: { Peso?: number | null } | null;
    Prefisso?: string | null;
    Raggruppamento?: string | null;
    Tipo?: string | null;
    UltimoAggiornamento?: Date | null;
    __v?: number;
};

export type TextRequestCartDTO = Omit<CartDocumentDTO, "dettagli_prodotto" | "quantita" | "product_id">;
export type CartProductDTO = Omit<CartDocumentDTO, "textRequest">;
