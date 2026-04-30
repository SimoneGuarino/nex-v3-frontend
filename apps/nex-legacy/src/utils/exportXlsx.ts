import * as XLSX from "xlsx";

/**
 * helper per generare ed esportare file XLSX lato client a partire da righe JS.
 *
 * obiettivi:
 * - controllo ordine colonne e header
 * - possibilita di forzare alcune colonne come testo (es. codici con zeri iniziali)
 */

export type XlsxExportOptions = {
    /** colonne da esportare (default: chiavi del primo record) */
    columns?: string[];
    /** converte i decimali col punto in virgola (default: false, non necessario in XLSX) */
    decimalComma?: boolean;
    /** include la riga header (default: true) */
    includeHeader?: boolean;
    /** base del nome file (senza estensione; verra aggiunto timestamp) */
    filenameBase?: string;
    /** nome foglio (default: "Sheet1") */
    sheetName?: string;
    /**
     * colonne da forzare come testo (es. "codice", "ean"):
     * i valori saranno mantenuti come stringa, evitando conversioni numeriche.
     */
    forcedTextCols?: string[];
    /** se true, sanitizza il filename (minuscolo, sostituzione caratteri non alfanumerici) */
    sanitizeFilename?: boolean;
};

const defaultOptions: Required<Omit<XlsxExportOptions, "columns" | "forcedTextCols" | "filenameBase">> = {
    decimalComma: false,
    includeHeader: true,
    sheetName: "Sheet1",
    sanitizeFilename: true,
};

/** rimuove caratteri non alfanumerici per un filename sicuro */
const sanitize = (s: string) =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "");

/** normalizza il valore per cella xlsx */
const formatValue = (val: unknown, decimalComma: boolean): unknown => {
    if (val == null) return "";

    if (val instanceof Date) return val;

    if (typeof val === "number" && Number.isFinite(val)) {
        if (!decimalComma) return val;
        const s = String(val);
        if (/e/i.test(s)) return s;
        return s.replace(".", ",");
    }

    const s = String(val);
    if (decimalComma && /^-?\d+\.\d+$/.test(s)) return s.replace(".", ",");
    return s;
};

/**
 * costruisce un workbook XLSX a partire da righe JS.
 *
 * @param rows    array di oggetti
 * @param options opzioni export (colonne, header, formattazione, ecc.)
 * @returns       { workbook, columns } dove `columns` sono quelle effettivamente esportate
 */
export function buildXlsxWorkbook(
    rows: any[],
    options: XlsxExportOptions = {}
): { workbook: XLSX.WorkBook; columns: string[] } {
    const {
        columns,
        decimalComma = defaultOptions.decimalComma,
        includeHeader = defaultOptions.includeHeader,
        sheetName = defaultOptions.sheetName,
        forcedTextCols = [],
    } = options;

    const cols =
        Array.isArray(columns) && columns.length > 0
            ? columns
            : (Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0] ?? {}) : []);

    const normalizedRows = Array.isArray(rows)
        ? rows.map((r) => {
            const out: Record<string, unknown> = {};
            cols.forEach((c) => {
                let value = formatValue((r as any)?.[c], decimalComma);
                if (forcedTextCols.includes(c) && value !== "") {
                    value = String(value);
                }
                out[c] = value;
            });
            return out;
        })
        : [];

    const worksheet = XLSX.utils.json_to_sheet(normalizedRows, {
        header: cols,
        skipHeader: !includeHeader,
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || "Sheet1");

    return { workbook, columns: cols };
}

/**
 * genera e scarica un file XLSX (.xlsx) a partire da righe JS.
 *
 * @param rows    array di record
 * @param options opzioni di export; `filenameBase` diventa `<base>-<timestamp>.xlsx`
 */
export function downloadXlsxFromRows(
    rows: any[],
    options: XlsxExportOptions = {}
): void {
    const { workbook } = buildXlsxWorkbook(rows, options);

    const {
        filenameBase = "export",
        sanitizeFilename = defaultOptions.sanitizeFilename,
    } = options;

    const base = sanitizeFilename ? sanitize(filenameBase) : filenameBase;
    const ts = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15); // "YYYYMMDDTHHMMSS"
    const filename = `${base || "export"}-${ts}.xlsx`;

    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
    }, 0);
}
