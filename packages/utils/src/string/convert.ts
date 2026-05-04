/**
 * Funzione che converte una stringa separando le parole con la maiuscola, ad esempio "helloWorld" diventa "Hello World"
 * @param str stringa da convertire
 * @returns stringa convertita
 */
export const ConvertToReadableString = (str: string | null | undefined): string => {
    if (!str || str.length === 0 || typeof str !== "string") return "";
    const result = str.replace(/([A-Z])/g, ' $1').trim();
    return result.charAt(0).toUpperCase() + result.slice(1);
};