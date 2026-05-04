/** 
 * Funzione per accedere a una proprietà annidata di un oggetto 
 * @param obj oggetto da cui accedere alla proprietà
 * @param path percorso della proprietà da accedere
*/
export function getNestedProperty(obj: any, path: any) {
    // Verifica se path è una stringa valida
    if (typeof path === 'string') {
        // Se path è una stringa semplice, accede direttamente alla proprietà
        if (!path.includes('.')) {
            if (obj == null || obj == undefined) {
                return null;
            };

            return obj[path];
        }

        // Se path è un percorso annidato, lo suddividi in un array di proprietà
        const keys = path.split('.');
        return keys.reduce((acc, key) => acc && acc[key], obj);
    }
    return null;
};

export function parseRolesEnv(): Record<string, string> {
    try {
        const raw = process.env.REACT_APP_ROLES ?? "{}";
        return JSON.parse(raw);
    } catch { return {}; }
}