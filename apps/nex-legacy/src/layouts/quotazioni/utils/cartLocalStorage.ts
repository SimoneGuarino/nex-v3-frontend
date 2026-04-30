// src/layouts/quotazioni/agents/utils/cartLocalStorage.ts

const KEY_PREFIX = "cart:";

/** carica l'insieme di id prodotto dal localStorage per una data quotazione */
export function loadCartIds(quotationId: string): Set<string> {
    try {
        if (typeof window === "undefined") return new Set();
        const raw = localStorage.getItem(KEY_PREFIX + quotationId);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
            return new Set(arr.filter((x) => typeof x === "string"));
        }
        return new Set();
    } catch {
        return new Set();
    }
}

/** salva l'insieme di id prodotto nel localStorage per una data quotazione */
export function saveCartIds(quotationId: string, ids: Set<string>): void {
    try {
        if (typeof window === "undefined") return;
        localStorage.setItem(KEY_PREFIX + quotationId, JSON.stringify(Array.from(ids)));
    } catch {
        // silenzioso
    }
}

/** aggiunge un id al set e lo persiste */
export function addToCart(quotationId: string, ids: Set<string>, productId: string): void {
    ids.add(productId);
    saveCartIds(quotationId, ids);
}

/** rimuove un id dal set e lo persiste */
export function removeFromCart(quotationId: string, ids: Set<string>, productId: string): void {
    ids.delete(productId);
    saveCartIds(quotationId, ids);
}

/** svuota completamente il carrello della quotazione */
export function clearCart(quotationId: string): void {
    try {
        if (typeof window === "undefined") return;
        localStorage.removeItem(KEY_PREFIX + quotationId);
    } catch {
        // silenzioso
    }
}
