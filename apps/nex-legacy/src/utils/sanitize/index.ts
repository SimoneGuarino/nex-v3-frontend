
export function SanitizeEmail(sstr : string) : boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(sstr);
    return isValid;
}

export function SanitizeOnlyNumber(sstr : string): boolean {
    const emailRegex = /^[0-9]+$/;
    const isValid = emailRegex.test(sstr);
    return isValid;
}

/**
 * Rimuove gli spazi all'inizio e alla fine di una stringa e sostituisce gli spazi multipli tra le parole con uno spazio singolo.
 * @param sstr string | null
 * @returns string | null
 */
export function RemoveSpaceText(sstr: string | null): string | null {
    if (sstr === null) {
        return null;
    }
    const trimmed = sstr.trim();
    if (trimmed.length === 0) {
        return null;
    }
    // Replace multiple spaces between words with a single space
    const cleaned = trimmed.replace(/\s+/g, ' ');
    return cleaned;
}