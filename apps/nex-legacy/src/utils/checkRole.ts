/**
 * Converte un id numerico di ruolo nella sua etichetta (stringa) utilizzando
 * la mappa definita in `import.meta.env.VITE_ROLES`.
 *
 *
 * @param roleId - id numerico del ruolo (es. 1)
 * @returns la stringa del ruolo (es. "Admin") oppure `null` se non trovata o se l’ENV non è valido
 *
 * @example
 * // .env
 * // REACT_APP_ROLES='{"0":"Prova","1":"Ciao","2":"Casa"}'
 *
 * CheckRole(1);    // "Ciao"
 * CheckRole(999);  // null  (id non presente in mappa)
 *
 * @example
 * // fallback elegante se non c'è corrispondenza
 * const label = CheckRole(user.roleId) ?? 'Sconosciuto';
 *
 * @example
 * // controllo permessi semplice
 * const isAdmin = CheckRole(user.roleId) === 'Admin';
 * if (isAdmin) {
 *   // mostra elementi riservati
 * }
 */
export function CheckRole(roleId: number): string | null {
    try {
        const map = JSON.parse(import.meta.env.VITE_ROLES as string) as Record<string, string>;
        return map[String(roleId)] ?? null;
    } catch (e) {
        console.error('REACT_APP_ROLES non è un JSON valido o non è definito:', e);
        return null;
    }
}
