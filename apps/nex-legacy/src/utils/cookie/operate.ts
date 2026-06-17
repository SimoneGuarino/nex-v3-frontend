
/**
 * Scrive un array di stringhe come cookie JSON. Usato per la funzionalità Recent Search.
 * @param name nome del cookie
 * @param arr array di stringhe da salvare. Verrà serializzato come JSON e codificato con encodeURIComponent.
 */
export function writeRecent(name: string, arr: string[]) {
    const v = encodeURIComponent(JSON.stringify(arr));
    document.cookie = `${name}=${v}; max-age=${60 * 60 * 24 * 180}; path=/; SameSite=Lax`;
}