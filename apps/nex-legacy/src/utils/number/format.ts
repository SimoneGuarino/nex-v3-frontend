/**
 * Formatta un numero con locale italiano per i KPI.
 */
export function FormatNumber(value: number): string {
    return new Intl.NumberFormat("it-IT", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);
};