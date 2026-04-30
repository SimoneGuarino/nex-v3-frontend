/**
 * normalizza la struttura di un array
 * @param a 
 * @returns 
 */
export function safeArray<T>(a: T[] | undefined | null): T[] {
    return Array.isArray(a) ? a : [];
};