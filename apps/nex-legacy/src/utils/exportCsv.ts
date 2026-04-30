/**
 * helper per generare ed esportare file CSV lato client a partire da righe JS.
 *
 * obiettivi:
 * - compatibilità Excel in locale IT (separatore `;`, virgola decimale, BOM UTF-8)
 * - escaping corretto dei campi con separatori, newline o doppi apici
 * - possibilità di forzare alcune colonne come testo (es. codici con zeri iniziali)
 *
 * quando usarlo:
 * - dataset piccoli/medi renderizzati in pagina (export immediato, nessuna chiamata server)
 * - per dataset molto grandi conviene un export server-side (stream), per evitare consumo di memoria in browser
 */

export type CsvExportOptions = {
    /** colonne da esportare (default: chiavi del primo record) */
    columns?: string[];
    /** separatore di campo (default: ';' per Excel IT) */
    delimiter?: string;
    /** converte i decimali col punto in virgola (default: true) */
    decimalComma?: boolean;
    /** include la riga header (default: true) */
    includeHeader?: boolean;
    /** antepone BOM UTF-8 per compatibilità Excel (default: true) */
    bom?: boolean;
    /** base del nome file (senza estensione; verrà aggiunto timestamp) */
    filenameBase?: string;
    /**
     * colonne da forzare come testo (es. "codice", "ean"):
     * i valori saranno emessi come ="00123" così Excel non rimuove zeri iniziali.
     */
    forcedTextCols?: string[];
    /** se true, sanitizza il filename (minuscolo, sostituzione caratteri non alfanumerici) */
    sanitizeFilename?: boolean;
};

const defaultOptions: Required<Omit<CsvExportOptions, "columns" | "forcedTextCols" | "filenameBase">> = {
    delimiter: ";",
    decimalComma: true,
    includeHeader: true,
    bom: true,
    sanitizeFilename: true,
};

/** rimuove caratteri non alfanumerici per un filename sicuro */
const sanitize = (s: string) =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "");

/**
 * applica l’escaping CSV:
 * - raddoppia i doppi apici
 * - racchiude tra virgolette se contiene separatore/newline/apici
 */
const escapeCsv = (raw: string, delimiter: string) => {
    const needsQuotes = raw.includes(delimiter) || raw.includes("\n") || raw.includes('"');
    const quoted = raw.replace(/"/g, '""');
    return needsQuotes ? `"${quoted}"` : quoted;
};

/**
 * formatta il valore per export:
 * - null/undefined -> stringa vuota
 * - number -> stringa, con sostituzione '.' -> ',' se `decimalComma` true (evita notazione scientifica)
 * - stringhe che “sembrano” decimali (123.45) -> sostituite in 123,45
 * - tutto il resto -> String(val)
 */
const formatValue = (val: unknown, decimalComma: boolean): string => {
    if (val == null) return "";
    if (typeof val === "number" && Number.isFinite(val)) {
        const s = String(val);
        if (!decimalComma || /e/i.test(s)) return s; // non modificare notazione scientifica
        return s.replace(".", ",");
    }
    const s = String(val);
    if (decimalComma && /^-?\d+\.\d+$/.test(s)) return s.replace(".", ",");
    return s;
};

/**
 * costruisce la stringa CSV a partire da un array di righe JS.
 *
 * @param rows   array di oggetti; i campi devono essere serializzabili con String()
 * @param options opzioni di export (separatore, intestazioni, colonne, ecc.)
 * @returns      { csv, columns } dove:
 *               - csv: stringa pronta da salvare
 *               - columns: array delle colonne effettivamente esportate
 *
 * complessità: O(n * m) dove n = numero righe, m = numero colonne
 */
export function buildCsvString(
    rows: any[],
    options: CsvExportOptions = {}
): { csv: string; columns: string[] } {
    const {
        columns,
        delimiter = defaultOptions.delimiter,
        decimalComma = defaultOptions.decimalComma,
        includeHeader = defaultOptions.includeHeader,
        bom = defaultOptions.bom,
        forcedTextCols = [],
    } = options;

    // nessuna riga: restituisci solo BOM (se richiesto)
    if (!Array.isArray(rows) || rows.length === 0) {
        return { csv: bom ? "\uFEFF" : "", columns: columns ?? [] };
        // NB: columns potrebbe essere utile per sapere quali colonne ci si aspettava
    }

    // colonne: o fornite, o ricavate dal primo record
    const cols = columns && columns.length > 0 ? columns : Object.keys(rows[0] ?? {});
    const header = includeHeader ? cols.map((c) => escapeCsv(String(c), delimiter)).join(delimiter) : null;

    // corpo: formatta, forza testo dove richiesto, applica escaping e unisci con separatore
    const body = rows
        .map((r) =>
            cols
                .map((c) => {
                    let v = formatValue((r as any)?.[c], decimalComma);

                    // forza testo per specifiche colonne (evita perdita zeri iniziali in Excel)
                    if (forcedTextCols.includes(c) && v !== "") {
                        v = `="${v}"`;
                    }

                    return escapeCsv(v, delimiter);
                })
                .join(delimiter)
        )
        .join("\n");

    const csv = (bom ? "\uFEFF" : "") + (header ? header + "\n" : "") + body;
    return { csv, columns: cols };
}

/**
 * genera e scarica un file CSV (.csv) a partire da righe JS.
 *
 * @param rows     array di record
 * @param options  opzioni di export; `filenameBase` diventa `<base>-<timestamp>.csv`
 *
 * note:
 * - usa `buildCsvString` per la serializzazione
 * - aggiunge timestamp ISO compattato (YYYYMMDDTHHMMSS) al filename
 * - per grandi volumi: valutare un endpoint server-side e usare stream
 */
export function downloadCsvFromRows(
    rows: any[],
    options: CsvExportOptions = {}
): void {
    const { csv } = buildCsvString(rows, options);

    const {
        filenameBase = "export",
        sanitizeFilename = defaultOptions.sanitizeFilename,
    } = options;

    const base = sanitizeFilename ? sanitize(filenameBase) : filenameBase;
    const ts = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15); // "YYYYMMDDTHHMMSS"
    const filename = `${base || "export"}-${ts}.csv`;

    // salva su disco creando un oggetto URL temporaneo
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
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
