/**
 * Se la lunghezza del testo supera maxLength, lo tronca e aggiunge "..."
 * @param text string
 * @param maxLength massima lunghezza
 * @returns string troncata
 */
export const TruncateText = (text: string | null | undefined, maxLength: number) => {
    if (!text || text.length === 0 || typeof text !== "string") return "";
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + "...";
    }
    return text;
};