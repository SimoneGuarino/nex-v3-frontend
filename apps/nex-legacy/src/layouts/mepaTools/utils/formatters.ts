/**
 * Formats an ISO date for compact Italian business UI labels.
 * Invalid values are returned as-is to keep diagnostics visible instead of hiding data issues.
 */
export function formatDate(value?: string) {
    if (!value) return "—";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return value;
    return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

/**
 * Formats a normalized score in the 0..1 range as a percentage.
 */
export function scorePct(value?: number) {
    return `${Math.round((Number.isFinite(Number(value)) ? Number(value) : 0) * 100)}%`;
}

/**
 * Converts mixed numeric/string values returned by AS400, MongoDB or AI adapters
 * into a stable EUR label used by tender and product cards.
 */
export function formatEuro(value: unknown) {
    if (value === null || value === undefined || value === "") return "—";
    const numeric = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.,-]/g, "").replace(/,/g, "."));
    if (!Number.isFinite(numeric)) return String(value);
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(numeric);
}

/**
 * Formats byte values using compact B/KB/MB units for document lists.
 */
export function formatFileSize(value?: number | null) {
    const size = Number(value ?? 0);
    if (!Number.isFinite(size) || size <= 0) return "n.d.";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Normalizes FDSelect values when a single-select component can still return arrays.
 */
export function singleSelectValue(value: any, fallback = "ALL") {
    if (Array.isArray(value)) return String(value[0] ?? fallback);
    return String(value ?? fallback);
}
