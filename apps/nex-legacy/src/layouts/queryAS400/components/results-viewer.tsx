// src/layouts/queryAS400/components/results-viewer.tsx
/**
 * viewer tabellare dei risultati di esecuzione query (salvata o ad-hoc).
 *
 * responsabilità:
 * - mostra un riepilogo (conteggio righe, provenienza saved/adhoc, titolo)
 * - decide automaticamente se renderizzare la tabella "plain" oppure la versione virtualizzata
 * - espone un pulsante per scaricare in CSV i dati correntemente renderizzati (client-side)
 *
 * note:
 * - l’export usa l’helper `downloadCsvFromRows` che gestisce separatore, BOM, formattazione decimali in stile IT
 * - il pulsante download compare solo se esistono righe in `result.rows`
 * - le colonne esportate corrispondono alle chiavi del primo record (o a `columns` passate all’helper)
 * - per dataset molto grandi considera un export server-side (stream/endpoint dedicato)
 *
 * fix: il messaggio "nessun risultato da mostrare" veniva renderizzato due volte (top bar + body).
 *      ora il sottotitolo nella top bar compare solo se `result` esiste; il messaggio resta nel body.
 */

import React, { Suspense, useMemo } from "react";
import {
    Divider,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";
import { FDBox } from "@nex/fd-ui";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { icon_download } from "config/icons";
import { useSurfaceTokens } from "../hooks/use-surface-tokens";
import type { ExecSavedResponse, ExecAdHocResponse } from "../types";
import { downloadCsvFromRows } from "utils/exportCsv";

// caricamento lazy dell’adattatore della tabella virtualizzata
const LazyVirtualizedResults = React.lazy(
    () => import("./virtualized-results-adapter")
);

// tipo risultato unificato (saved/adhoc/null)
type ExecResult =
    | ({ mode: "saved"; title?: string; titolo?: string; queryId?: string } & ExecSavedResponse)
    | ({ mode: "adhoc" } & ExecAdHocResponse)
    | null;

type ResultsViewerProps = {
    result: ExecResult;
    mode?: "auto" | "plain" | "virtualized";
    virtualizeAt?: number; // soglia sopra la quale usare la versione virtualizzata quando mode=auto
    height?: number | string; // altezza massima della tabella
    style?: React.CSSProperties;
    className?: string;
};

function ResultsViewerBase({
    result,
    mode = "auto",
    virtualizeAt = 1200,
    height = "60vh",
    style,
    className,
}: ResultsViewerProps) {
    // righe/colonne correnti
    const rows = result?.rows ?? [];
    const cols = rows.length > 0 ? Object.keys(rows[0]) : [];

    // metadati
    const isSaved = result?.mode === "saved";
    const displayTitle = (result as any)?.title ?? (result as any)?.titolo ?? "";

    // token di superficie (colori/bordi)
    const {
        paperBg,
        stripeBg,
        stickyHeaderBg,
        stickyHeaderText,
        tableBorderColor,
        codeBg,
    } = useSurfaceTokens();

    // modalità virtualizzata automatica oltre una certa soglia
    const useVirtual =
        mode === "virtualized" || (mode === "auto" && rows.length >= virtualizeAt);

    // sottotitolo della top bar: MOSTRA SOLO SE result ESISTE (evita il doppione del messaggio)
    const topSubtitle = useMemo(() => {
        if (!result) return "";
        return `${result.count} righe • ${isSaved ? "query salvata" : "ad-hoc"}${displayTitle ? ` • ${displayTitle}` : ""
            }`;
    }, [result, isSaved, displayTitle]);

    // ------- export CSV -------
    const downloadCSV = React.useCallback(() => {
        if (!rows.length || !cols.length) return;

        const base =
            (displayTitle || (isSaved ? "query-salvata" : "query-adhoc"))
                .toString()
                .trim() || (isSaved ? "query-salvata" : "query-adhoc");

        downloadCsvFromRows(rows, {
            columns: cols,
            filenameBase: base,
            delimiter: ";", // stile IT
            decimalComma: true,
            bom: true, // BOM per Excel/Windows
            includeHeader: true,
        });
    }, [rows, cols, displayTitle, isSaved]);
    // --------------------------

    return (
        <FDBox
            radius="2xl"
            shadow="sm"
            className={`h-full ${className ?? ""}`}
            style={style}
        >
            {/* top bar: titolo + sottotitolo (se presente) + azione download */}
            <FDBox variant="ghost" className="p-3 flex items-start justify-between">
                <div>
                    <h3>risultati</h3>
                    {topSubtitle && (
                        <p className="text-sm text-neutral-500 mt-1">{topSubtitle}</p>
                    )}
                </div>

                {/* pulsante download visibile solo se ci sono righe */}
                {rows.length > 0 && (
                    <span
                        data-tt="btn"
                        data-tooltip-content="Scarica CSV"
                        className="self-start"
                        style={{ display: "inline-flex" }}
                    >
                        <FDIconButton
                            ariaLabel="Scarica CSV"
                            icon={icon_download({ width: "1.8em", height: "1.8em" })}
                            onClick={downloadCSV}
                            variant="text"
                            size="large"
                        />
                    </span>
                )}
            </FDBox>

            {/* corpo: messaggi / tabella virtualizzata / tabella standard */}
            <FDBox variant="ghost">
                {rows.length === 0 ? (
                    // unico punto dove mostriamo i messaggi "no data"
                    <FDBox variant="ghost" className="p-3 text-sm text-neutral-500">
                        {result ? "nessuna riga" : "nessun risultato da mostrare"}
                    </FDBox>
                ) : useVirtual ? (
                    <>
                        <Divider />
                        <Suspense
                            fallback={
                                <FDBox className="p-3 text-sm">caricamento tabella…</FDBox>
                            }
                        >
                            {/* adattatore per tabella virtualizzata (gestisce i tooltip cella internamente) */}
                            <LazyVirtualizedResults
                                rows={rows}
                                count={result?.count ?? rows.length}
                                height={height}
                            />
                        </Suspense>
                    </>
                ) : (
                    <>
                        <Divider />
                        <TableContainer sx={{ maxHeight: height, bgcolor: paperBg }}>
                            <Table
                                size="small"
                                stickyHeader
                                sx={{ "& td": { color: "inherit" } }}
                            >
                                <TableHead>
                                    <TableRow>
                                        {cols.map((c) => (
                                            <TableCell
                                                key={c}
                                                sx={{
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    fontSize: 12,
                                                    bgcolor: stickyHeaderBg,
                                                    color: stickyHeaderText,
                                                    borderBottomColor: tableBorderColor,
                                                }}
                                            >
                                                {c}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((r, idx) => (
                                        <TableRow
                                            key={idx}
                                            hover
                                            sx={{ "&:nth-of-type(odd)": { backgroundColor: stripeBg } }}
                                        >
                                            {cols.map((c) => {
                                                const value = String((r as any)?.[c] ?? "");
                                                return (
                                                    <TableCell
                                                        key={c}
                                                        sx={{
                                                            color: "inherit",
                                                            whiteSpace: "pre-wrap",
                                                            fontSize: 13,
                                                            borderBottomColor: tableBorderColor,
                                                            "& code": {
                                                                background: codeBg,
                                                                padding: "0 4px",
                                                                borderRadius: "4px",
                                                            },
                                                        }}
                                                    >
                                                        {value}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </FDBox>
        </FDBox>
    );
}

export default React.memo(ResultsViewerBase);
