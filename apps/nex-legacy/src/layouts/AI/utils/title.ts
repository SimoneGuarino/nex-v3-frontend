// src/layouts/AI/utils/title.ts

// ——————————————————————————————————————————————————————————
// CONSTANTS
// ——————————————————————————————————————————————————————————
export const MAX_EDITABLE_TITLE_LENGTH = 20;

// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
export type TitleValidationResult = {
    value?: string;
    shouldClear: boolean;
    isBlankAfterTrim: boolean;
    isTooLong: boolean;
    isAtLimit: boolean;
};

// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/**
 * Valida un titolo opzionale mantenendo il comportamento esistente del layout:
 * - stringa vuota/null/undefined => clear del titolo
 * - solo spazi => errore
 * - oltre limite => blocco
 * - al limite => warning ma valore consentito
 */
export function validateEditableTitle(rawTitle: string | undefined | null): TitleValidationResult {
    if (rawTitle === undefined || rawTitle === null || rawTitle === "") {
        return {
            shouldClear: true,
            isBlankAfterTrim: false,
            isTooLong: false,
            isAtLimit: false,
        };
    }

    const trimmed = rawTitle.trim();
    const isBlankAfterTrim = trimmed.length === 0;
    const isTooLong = rawTitle.length > MAX_EDITABLE_TITLE_LENGTH;
    const isAtLimit = rawTitle.length === MAX_EDITABLE_TITLE_LENGTH;

    return {
        value: rawTitle,
        shouldClear: false,
        isBlankAfterTrim,
        isTooLong,
        isAtLimit,
    };
}
