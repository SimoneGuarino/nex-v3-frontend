/**
 * Helper per normalizzare il campo "anteprima" in un URL utilizzabile dal browser.
 * Convenzione consigliata in Mongo:
 * - URL assoluto: "https://..." (va bene anche CDN)
 * - root-relative: "/assets/..." (statici FE)
 * - public/: "public/logo.png" (lo trattiamo come "/logo.png")
 * - relativo semplice: "images/x.png" (lo trattiamo come "/images/x.png")
 *
 * Nota: "src/..." NON è servibile a runtime (è path del sorgente), quindi lo convertiamo
 * in root-relative togliendo "src/" come fallback.
 */

export function resolveAnteprimaUrl(v?: string | null): string {
    const s0 = (v ?? "").trim();
    if (!s0) return "";

    // URL assoluti e sorgenti speciali
    if (/^(https?:)?\/\//i.test(s0)) return s0; // include anche //cdn...
    if (/^(data:|blob:)/i.test(s0)) return s0;

    // supporto "public/..." -> "/..."
    let s = s0.replace(/^public\//i, "/");

    // se è già root-relative, NON attaccare nessuna base
    if (s.startsWith("/")) return s;

    // opzionale: se qualcuno mette "src/..." lo consideriamo non servibile a runtime
    // (puoi scegliere di fare fallback oppure provare a mappare)
    if (/^src\//i.test(s)) {
        // fallback sensato: prova a togliere "src/" e renderlo root-relative
        s = s.replace(/^src\//i, "");
    }

    // default: rendilo root-relative (statici del FE)
    return `/${s}`;
}
