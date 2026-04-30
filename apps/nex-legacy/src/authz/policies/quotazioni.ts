import { CAPS } from "../caps";

export type QuotazioneLike = {
    bidType?: "BID_PASSIVO" | "BID_ATTIVO" | string;
    stato?: "VALUTAZIONE" | string; // o phase / toState in base ai tuoi campi reali
};

export function canModerateLookInQuotazioni(opts: {
    hasCap: (cap: string) => boolean;
    quotation: QuotazioneLike;
}) {
    const { hasCap, quotation } = opts;

    if (!hasCap(CAPS.QUOTAZIONI_LOOK_MODERATE)) return false;

    const isBidPassivo = quotation.bidType === "BID_PASSIVO";
    const isValutazione = quotation.stato === "VALUTAZIONE";

    return isBidPassivo && isValutazione;
};