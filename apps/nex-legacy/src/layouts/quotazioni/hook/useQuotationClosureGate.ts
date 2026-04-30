import { useEffect, useMemo, useState } from "react";
import type { QuotazioneDTOExtended } from "../types/closure";
import { formatCountdown } from "../utils/utils";

/**
 * Converte un valore “date-like” (legacy safe) in una Date valida oppure null.
 *
 * Perché serve:
 * - Le quotazioni legacy possono NON avere `finestraValidita`.
 * - Anche quando esiste, `inizio/fine` possono arrivare come stringa ISO (JSON) e non come oggetto Date.
 * - Senza normalizzazione, chiamare `getTime()` genera crash (`validTo.getTime is not a function`).
 */
function toValidDate(input: unknown): Date | null {
    if (input == null) return null;

    // 1) Già Date
    if (input instanceof Date) {
        return Number.isFinite(input.getTime()) ? input : null;
    }

    // 2) Stringa (ISO o parseabile)
    if (typeof input === "string") {
        const d = new Date(input);
        return Number.isFinite(d.getTime()) ? d : null;
    }

    // 3) Timestamp numerico
    if (typeof input === "number") {
        const d = new Date(input);
        return Number.isFinite(d.getTime()) ? d : null;
    }

    return null;
};

export function useExpiryCountdown(input?: unknown) {
    const validTo = useMemo(() => toValidDate(input), [input]);
    const [now, setNow] = useState(() => new Date());

    const shouldTick = useMemo(() => {
        if (!validTo) return false;
        return now.getTime() <= validTo.getTime();
    }, [validTo, now]);

    useEffect(() => {
        if (!shouldTick) return;
        const t = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(t);
    }, [shouldTick]);

    const expired = useMemo(() => {
        if (!validTo) return false;
        return now.getTime() > validTo.getTime();
    }, [validTo, now]);

    const countdownLabel = useMemo(() => {
        if (!validTo) return null;
        const diff = validTo.getTime() - now.getTime();
        if (diff <= 0) return "Scaduta";
        return formatCountdown(diff);
    }, [validTo, now]);

    return { validTo, expired, countdownLabel, shouldTick };
}

/**
 * Hook “gatekeeper”:
 * - calcola lock + countdown in base alla finestra di validità (finestraValidita) e/o al completamento prodotti
 * - espone flags per UI (banner, wizard, disable azioni)
 *
 * REGOLE (aggiornate):
 * 1) La quotazione diventa "readyToClose" se:
 *    - è scaduta (finestraValidita.fine < now), oppure
 *    - tutti i prodotti sono completati, oppure
 *    - stato quotazione è già "DA_CHIUDERE"
 *
 * 2) Se la quotazione è readyToClose ma NON è stata finalizzata => requiresClosure = true.
 *    In questo caso:
 *    - locked = true (blocca azioni operative per TUTTI i ruoli)
 *    - la navigazione resta permessa (il lock lo userai solo per disabilitare handler / CTA operative)
 *
 * 3) Se MEPA e (readyToClose) e manca mepa_closure.outcome => needsMepaClosure = true.
 *    (lo step MEPA è logico, ma il lock resta comunque su requiresClosure)
 */
export function useQuotationClosureGate(qts?: QuotazioneDTOExtended | null, allProductsDone?: boolean) {
    const [now, setNow] = useState(() => new Date());

    /**
     * Fonte unica di verità per il range date:
     * ESISTE SOLO finestraValidita.inizio/fine.
     *
     * ✅ Normalizzazione Date | null per evitare crash con legacy data / stringhe ISO.
     */
    const { validFrom, validTo } = useMemo(() => {
        const startRaw = qts?.finestraValidita?.inizio;
        const endRaw = qts?.finestraValidita?.fine;

        return {
            validFrom: toValidDate(startRaw),
            validTo: toValidDate(endRaw),
        };
    }, [qts?.finestraValidita?.inizio, qts?.finestraValidita?.fine]);

    /**
     * Tick leggero (1s) SOLO se:
     * - esiste validTo (Date valida)
     * - non è ancora scaduta
     *
     * Nota: se la quotazione non ha finestra validità, non tickiamo (zero overhead).
     */
    const shouldTick = useMemo(() => {
        if (!validTo) return false;
        return now.getTime() <= validTo.getTime();
    }, [validTo, now]);

    useEffect(() => {
        if (!shouldTick) return;
        const t = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(t);
    }, [shouldTick]);

    /**
     * EXPIRED:
     * - se non ho validTo => expired = false
     * - se ho validTo => expired quando now > validTo
     */
    const expired = useMemo(() => {
        if (!validTo) return false;
        return now.getTime() > validTo.getTime();
    }, [validTo, now]);

    /**
     * Countdown (se ho una validTo).
     */
    const countdownLabel = useMemo(() => {
        if (!validTo) return null;
        const diff = validTo.getTime() - now.getTime();
        if (diff <= 0) return "Scaduta";
        return formatCountdown(diff);
    }, [validTo, now]);

    /**
     * READY TO CLOSE:
     * - scaduta, oppure
     * - tutti prodotti completati, oppure
     * - già in stato "DA_CHIUDERE"
     */
    const readyToClose = useMemo(() => {
        return Boolean(expired || (allProductsDone && qts?.stato !== "KO" && qts?.stato !== "OK") || qts?.stato === "DA_CHIUDERE");
    }, [expired, allProductsDone, qts?.stato]);

    /**
     * FINALIZZATA?
     * - MEPA: esiste mepa_closure.outcome
     * - NON MEPA: esiste final_outcome.outcome
     */
    const isFinalized = useMemo(() => {
        if (!qts) return false;
        if (qts.tipologia === "MEPA") return Boolean(qts.mepa_closure?.outcome);
        return Boolean((qts as any)?.final_outcome?.outcome);
    }, [qts]);

    /**
     * requiresClosure:
     * - quando siamo pronti a chiudere ma NON è ancora finalizzata
     */
    const requiresClosure = useMemo(() => {
        return Boolean(readyToClose && !isFinalized);
    }, [readyToClose, isFinalized]);

    /**
     * LOCK GLOBALE:
     * - blocca azioni operative quando requiresClosure è true.
     * - non blocca la navigazione.
     */
    const locked = useMemo(() => requiresClosure, [requiresClosure]);

    /**
     * Motivo lock (utile per banner e messaggi UX).
     */
    const lockReason = useMemo<"VALIDITY_EXPIRED" | "ALL_PRODUCTS_DONE" | "READY_TO_CLOSE" | null>(() => {
        if (!requiresClosure) return null;
        if (expired) return "VALIDITY_EXPIRED";
        if (allProductsDone) return "ALL_PRODUCTS_DONE";
        return "READY_TO_CLOSE";
    }, [requiresClosure, expired, allProductsDone]);

    /**
     * Step extra MEPA:
     * - se MEPA e siamo in requiresClosure e manca outcome => serve chiusura MEPA
     */
    const needsMepaClosure = useMemo(() => {
        if (!qts) return false;
        if (qts.tipologia !== "MEPA") return false;
        if (!requiresClosure) return false;
        return !qts.mepa_closure?.outcome;
    }, [qts, requiresClosure]);

    return {
        now,

        // finestra validità (solo queste esistono)
        validFrom,
        validTo,
        countdownLabel,
        expired,

        // progress
        allProductsDone: Boolean(allProductsDone),

        // gating
        readyToClose,
        isFinalized,
        requiresClosure,
        locked,
        lockReason,

        // extra MEPA
        needsMepaClosure,
    };
};