import type { MepaLostReasonCode } from "../../../types/closure";

export const MEPA_LOST_REASONS: Array<{ code: MepaLostReasonCode; label: string }> = [
    { code: "PREZZO_NON_COMPETITIVO", label: "Prezzo non competitivo" },
    { code: "SPECHE_NON_CONFORMI", label: "Specifiche non conformi" },
    { code: "TEMPI_CONSEGNA", label: "Tempi di consegna non compatibili" },
    { code: "MANCANZA_STOCK", label: "Mancanza disponibilità / stock" },
    { code: "DOCUMENTAZIONE", label: "Problemi di documentazione" },
    { code: "ALTRO", label: "Altro" },
];