import type { QuotazioneDTO, Tipologia } from "layouts/quotazioni/types/quotations";

/**
 * MOTIVAZIONI KO MEPA (esempio).
 * Nota: lato BE saranno una tabella/enum centralizzati.
 */
export type MepaLostReasonCode =
    | "PREZZO_NON_COMPETITIVO"
    | "SPECHE_NON_CONFORMI"
    | "TEMPI_CONSEGNA"
    | "MANCANZA_STOCK"
    | "DOCUMENTAZIONE"
    | "ALTRO";

/** Esito gara MEPA */
/** Esito finale quotazione (vale per tutte le tipologie) */
export type FinalOutcome = "OK" | "KO";

/** Mapping OC/FB per singola riga/prodotto quotato */
export type OcFbLink = {
    quotation_product_docId: string; // id riga carrello/prodotto (server-defined)
    oc?: string;                  // ordine cliente (o riferimento interno)
    fb?: string;                  // fido/extra fido / fallback business (dipende dal dominio)
};

/**
 * Estensione FE non-breaking della QuotazioneDTO.
 * Tutto opzionale: finché il BE non lo supporta, non rompiamo nulla.
 */
export type QuotazioneDTOExtended = QuotazioneDTO & {
    tipologia: Tipologia;

    // Range validità gara (MEPA)
    gara_valid_from?: string; // ISO
    gara_valid_to?: string;   // ISO

    // Chiusura finale quotazione (step 2, per tutte le tipologie)
    final_outcome?: {
        outcome?: FinalOutcome;
        note?: string;
        lost_reason_code?: MepaLostReasonCode; // opzionale anche qui, per uniformità (es. può essere utile anche fuori MEPA)
        closed_at?: string; // ISO
        closed_by?: string;
    };

    // Se OK: bisogna accoppiare almeno OC e/o FB per i prodotti
    final_ok_links?: OcFbLink[];
};

/**
 * Payload FE-first per salvataggio chiusura.
 * Nota: NON duplichiamo più esito MEPA e esito finale:
 * - MEPA: mepaOutcome (VINTA/PERSA) e, se VINTA => mapping OC/FB
 * - NON MEPA: finalOutcome (OK/KO) e, se OK => mapping OC/FB
 */
export type ClosureDraft = {
    // MEPA
    lost_reason_code?: string;

    // NON MEPA
    finalOutcome?: FinalOutcome;
    finalNote?: string;

    // mapping (solo se esito “positivo”)
    okLinks: OcFbLink[];
};