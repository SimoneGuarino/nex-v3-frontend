import { MessageBlock, TableData } from "context/AIContext";

/**
 * Tentativo di estrarre un blocco JSON dalla risposta testuale dell'AI.
 * Cerca prima un blocco ```json ... ```, altrimenti tenta di estrarre
 * un oggetto JSON bilanciato dal primo "{" valido.
 */
function extractJsonCandidate(raw: string): string | null {
    // 1. Cerca blocchi ```json ... ```
    const fenceRegex = /```json\s*([\s\S]*?)```/i;
    const fenceMatch = raw.match(fenceRegex);
    if (fenceMatch && fenceMatch[1]) {
        return fenceMatch[1].trim();
    }

    // 2. Fallback: trova il primo oggetto JSON bilanciato
    const firstBrace = raw.indexOf("{");
    if (firstBrace === -1) return null;

    let depth = 0;
    for (let i = firstBrace; i < raw.length; i++) {
        const ch = raw[i];
        if (ch === "{") depth++;
        else if (ch === "}") depth--;

        if (depth === 0) {
            const candidate = raw.slice(firstBrace, i + 1);
            return candidate;
        };
    };

    return null; // non trovato
};

/**
 * Validazione manuale di un oggetto che dovrebbe essere MessageBlock[].
 * Restituisce i blocchi validi e un eventuale array di errori.
 */
function validateBlocks(raw: any): { blocks: MessageBlock[]; errors: string[] } {
    const errors: string[] = [];
    const blocks: MessageBlock[] = [];

    if (!raw || typeof raw !== "object") {
        errors.push("Payload principale non è un oggetto.");
        return { blocks, errors };
    };

    if (!Array.isArray(raw.blocks)) {
        errors.push("Campo 'blocks' mancante o non è un array.");
        return { blocks, errors };
    };

    raw.blocks.forEach((b: any, idx: number) => {
        if (!b || typeof b !== "object" || typeof b.kind !== "string") {
            errors.push(`Block[${idx}]: formato non valido o manca 'kind'.`);
            return;
        }

        switch (b.kind) {
            case "text":
                if (typeof b.text === "string") {
                    blocks.push({ kind: "text", text: b.text });
                } else {
                    errors.push(`Block[${idx}] tipo 'text' senza campo 'text' stringa.`);
                }
                break;

            case "code":
                if (typeof b.code === "string") {
                    const block: any = { kind: "code", code: b.code };
                    if (typeof b.language === "string") block.language = b.language;
                    blocks.push(block);
                } else {
                    errors.push(`Block[${idx}] tipo 'code' senza campo 'code' stringa.`);
                }
                break;

            case "table":
                if (!b.table || typeof b.table !== "object") {
                    errors.push(`Block[${idx}] tipo 'table' senza campo 'table'.`);
                    break;
                }
                const table = b.table;
                // colonne
                if (!Array.isArray(table.columns) || table.columns?.length === 0 || table.columns.some((c: any) => typeof c !== "string")) {
                    errors.push(`Block[${idx}] 'columns' deve essere array di stringhe.`);
                    break;
                }
                // righe
                if (!Array.isArray(table.rows)) {
                    errors.push(`Block[${idx}] 'rows' non è un array.`);
                    break;
                }
                const colCount = table.columns.length;
                let rowsValid = true;
                const normalizedRows: (string | number | null)[][] = [];
                for (let ri = 0; ri < table.rows.length; ri++) {
                    const row = table.rows[ri];
                    if (!Array.isArray(row)) {
                        errors.push(`Block[${idx}] row[${ri}] non è array.`);
                        rowsValid = false;
                        continue;
                    }
                    if (row.length !== colCount) {
                        errors.push(
                            `Block[${idx}] row[${ri}] ha lunghezza ${row.length} ma ci si aspettava ${colCount}.`
                        );
                        rowsValid = false;
                    }
                    // cast e normalizzazione semplice
                    normalizedRows.push(
                        row.map((cell: any) => {
                            if (cell === null || cell === undefined) return null;
                            if (typeof cell === "string" || typeof cell === "number") return cell;
                            // fallback a stringa se è altro tipo (es. boolean)
                            try {
                                return String(cell);
                            } catch {
                                return null;
                            }
                        })
                    );
                }
                if (!rowsValid) break;

                const normalizedTable: TableData = {
                    columns: table.columns,
                    rows: normalizedRows,
                };
                if (table.meta && typeof table.meta === "object") {
                    const meta: any = {};
                    if (Array.isArray(table.meta.align)) {
                        meta.align = table.meta.align.filter(
                            (a: any) => a === "left" || a === "center" || a === "right"
                        );
                    }
                    if (Array.isArray(table.meta.types)) {
                        meta.types = table.meta.types.filter((t: any) =>
                            ["string", "number", "date"].includes(t)
                        );
                    }
                    if (Object.keys(meta).length > 0) normalizedTable.meta = meta;
                };
                blocks.push({ kind: "table", table: normalizedTable });
                break;

            default:
                errors.push(`Block[${idx}] ha 'kind' non riconosciuto: ${b.kind}`);
                break;
        }
    });

    return { blocks, errors };
};

/**
 * Funzione principale: data la risposta raw dell'AI, tenta di
 * parsare blocchi strutturati. Se fallisce, ritorna un array vuoto
 * e fornisce errori (da loggare).
 */
export function parseAgentResponse(
    rawResponse: string
): { blocks: MessageBlock[]; error?: string } {
    const candidate = extractJsonCandidate(rawResponse);
    if (!candidate) {
        return { blocks: [], error: "Nessun JSON strutturato trovato nella risposta." };
    }

    let parsed: any;
    try {
        parsed = JSON.parse(candidate);
    } catch (e) {
        return {
            blocks: [],
            error: `Parsing JSON fallito: ${(e as Error).message}. Contenuto candidato: ${candidate.slice(
                0,
                500
            )}...`,
        };
    };

    const { blocks, errors } = validateBlocks(parsed);
    if (errors.length > 0) {
        // Combina gli errori in uno solo per log
        return {
            blocks: blocks,
            error: `Validazione blocchi con errori: ${errors.join(" | ")}`,
        };
    };
    return { blocks, error: undefined };
};