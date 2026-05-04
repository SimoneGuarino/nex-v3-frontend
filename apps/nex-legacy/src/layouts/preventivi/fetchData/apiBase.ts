/**
 * Normalizza la base URL condivisa da tutte le chiamate del layout Preventivi.
 *
 * Il backend può arrivare da env con o senza slash finale: centralizzare questa
 * logica evita di duplicarla nei fetcher e previene URL costruite in modo incoerente.
 */
export function getPreventiviApiBase(): string {
    const base = import.meta.env.VITE_API_API_CUSTOMERSFIDO || "";
    return base.endsWith("/") ? base : `${base}/`;
}
