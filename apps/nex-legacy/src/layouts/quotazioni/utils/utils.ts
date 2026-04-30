import { QuotazioneDTOExtended } from "../types/closure";

/**
 * Parsing safe ISO -> Date
 */
export function safeDate(iso?: string | null): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Stato derivato: la validità MEPA è scaduta?
 * Nota: lo facciamo lato UI per esperienza utente,
 * ma il BE deve SEMPRE far rispettare i lock.
 */
export function isMepaValidityExpired(qts?: QuotazioneDTOExtended | null, now = new Date()): boolean {
    if (!qts) return false;
    if (qts.tipologia !== "MEPA") return false;
    const to = safeDate(qts.gara_valid_to);
    if (!to) return false;
    return now.getTime() > to.getTime();
}

/**
 * Serve la chiusura MEPA? (scaduta e non ancora dichiarato VINTA/PERSA)
 */
export function requiresMepaClosure(qts?: QuotazioneDTOExtended | null, now = new Date()): boolean {
    if (!qts) return false;
    if (qts.tipologia !== "MEPA") return false;
    if (!isMepaValidityExpired(qts, now)) return false;
    return !qts.mepa_closure?.outcome;
}

/**
 * La UI deve bloccare azioni su prodotti/quotazioni?
 * Regola: se MEPA scaduta e in attesa di chiusura → blocco per buyers + commerciale.
 */
export function isInteractionLocked(qts?: QuotazioneDTOExtended | null, now = new Date()): boolean {
    return requiresMepaClosure(qts, now);
}

/**
 * Calcolo leggibile del countdown (ms -> stringa).
 */
export function formatCountdown(ms: number): string {
    const abs = Math.max(0, ms);
    const s = Math.floor(abs / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    if (d > 0) return `${d}g ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
}