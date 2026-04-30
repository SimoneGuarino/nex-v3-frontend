import React from "react";
import { FetchData } from "examples/Fetch";
import { FormatDate } from "utils/date/getDate";

type AnyRecord = Record<string, any>;

function cn(...v: Array<string | false | null | undefined>) {
    return v.filter(Boolean).join(" ");
}

function apiBase(): string {
    const base = import.meta.env.VITE_API_CUSTOMERSFIDO || "";
    return base.endsWith("/") ? base : base + "/";
}

function cleanStr(val: any): string {
    const s = String(val ?? "").replace(/\s+/g, " ").trim();
    return s || "-";
}

function formatNumber(val: any): string {
    const n = Number(val);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("it-IT");
}

function formatCurrency(val: any): string {
    const n = Number(val);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function formatDateMaybe(val: any): string {
    const s = String(val ?? "").trim();
    if (!s) return "-";

    let d: Date;

    if (/^\d{8}$/.test(s)) {
        d = FormatDate({ date: s, actualFromat: "yyyymmdd" });
    } else if (/^\d{6}$/.test(s)) {
        d = FormatDate({ date: s, actualFromat: "yymmdd" });
    } else {
        // provo ISO/parse naturale
        d = new Date(s);
    }

    if (Number.isNaN(d.getTime())) return s;

    return d.toLocaleDateString("it-IT");
}


const Pill: React.FC<{ tone?: "neutral" | "ok" | "warn"; children: React.ReactNode }> = ({
    tone = "neutral",
    children,
}) => {
    const cls =
        tone === "ok"
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200"
            : tone === "warn"
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
                : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300";

    return (
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium", cls)}>
            {children}
        </span>
    );
};

const KV: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
    <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{k}</span>
        <span className="text-[11px] font-medium text-neutral-900 dark:text-neutral-100 text-right break-words max-w-[65%]">
            {v}
        </span>
    </div>
);

export type BackordersSummary = {
    totalRows: number;
    agg: AnyRecord | null; // attesi: RESIDUO, CONSEGNA, TOTALE (da /customers/backorders)
};

export type BackordersDetails = {
    total: number;
    items: AnyRecord[];
    nextOfs: number;
};

type Group = {
    key: string;
    tipo: string;
    codiceProduttore: string;
    codiceInterno: string;
    descrizione: string;
    magazzino: string;
    prezzo: any;

    rows: AnyRecord[];
    righe: number;

    qtyResidua: number;
    qtyConsegna: number;

    minData: string | null;
    maxData: string | null;
};

export const Backorders: React.FC<{
    mode: "summary" | "details";
    customerCode: string | number;

    summary: BackordersSummary | null | undefined;

    // ✅ dati details già caricati dal pannello (1 sola chiamata a details)
    details?: BackordersDetails | null;

    onOpenDetails?: () => void;
}> = ({ mode, customerCode, summary, details, onOpenDetails }) => {
    const isSummary = mode === "summary";
    const base = apiBase();

    const totalRows = summary?.totalRows ?? details?.total ?? 0;
    const agg = summary?.agg ?? null;

    const residuoAgg = agg?.RESIDUO ?? agg?.residuo ?? null;
    const consegnaAgg = agg?.CONSEGNA ?? agg?.consegna ?? null;
    const totaleAgg = agg?.TOTALE ?? agg?.totale ?? null;

    // details state
    const PAGE_SIZE = 50;

    const [loading, setLoading] = React.useState(false);
    const [hasErr, setHasErr] = React.useState(false);

    // ✅ inizializzo dallo store (precaricato)
    const [items, setItems] = React.useState<AnyRecord[]>(() => details?.items ?? []);
    const [total, setTotal] = React.useState<number>(() => details?.total ?? 0);
    const [ofs, setOfs] = React.useState<number>(() => details?.nextOfs ?? 0);

    // inception: list -> item
    const [view, setView] = React.useState<"list" | "item">("list");
    const [selectedKey, setSelectedKey] = React.useState<string | null>(null);

    // se cambia "details" (es. riapri pannello con altro cliente) riallineo lo stato
    React.useEffect(() => {
        if (isSummary) return;
        setItems(details?.items ?? []);
        setTotal(details?.total ?? 0);
        setOfs(details?.nextOfs ?? 0);
    }, [isSummary, details?.items, details?.total, details?.nextOfs]);

    const groups = React.useMemo(() => buildGroups(items), [items]);

    const selectedGroup = React.useMemo(() => {
        if (!selectedKey) return null;
        return groups.find((g) => g.key === selectedKey) ?? null;
    }, [groups, selectedKey]);

    async function loadPage(nextOfs: number) {
        setLoading(true);
        setHasErr(false);

        try {
            const url = `${base}customers/backorders/details?ofs=${nextOfs}`;

            // ✅ IMPORTANTISSIMO: il BE legge ccli -> customerCode (body) NON viene parsato
            const payload = {
                limit: PAGE_SIZE,
                ccli: String(customerCode ?? "").trim(),
            };

            const res: any = await FetchData(url, "POST", payload, new AbortController());
            const newItems = Array.isArray(res?.items) ? res.items : [];
            const newTotal = Number(res?.total ?? 0);

            setTotal(Number.isFinite(newTotal) ? newTotal : 0);
            setItems((prev) => (nextOfs === 0 ? newItems : [...(prev || []), ...newItems]));
            setOfs(nextOfs + newItems.length);
        } catch (e: any) {
            console.error(e);
            setHasErr(true);
        } finally {
            setLoading(false);
        }
    }

    // reset view quando entro in details
    React.useEffect(() => {
        if (isSummary) return;
        setView("list");
        setSelectedKey(null);
    }, [isSummary]);

    if (isSummary) {
        const clickable = typeof onOpenDetails === "function";

        return (
            <div
                className={cn(
                    "rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80",
                    "bg-white/80 dark:bg-neutral-900/60 shadow-sm",
                    clickable ? "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/80 transition" : "",
                )}
                onClick={() => clickable && onOpenDetails?.()}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={(e) => {
                    if (!clickable) return;
                    if (e.key === "Enter" || e.key === " ") onOpenDetails?.();
                }}
            >
                <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" />
                            <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50 truncate">Backorders</h3>
                        </div>
                        <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                            Righe ordine aperte e residui (oc + fb)
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Pill tone={totalRows > 0 ? "warn" : "neutral"}>
                            righe: <span className="ml-1 font-semibold">{formatNumber(totalRows)}</span>
                        </Pill>

                        {clickable && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenDetails?.();
                                }}
                                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                            >
                                <span>Dettagli</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                        <KV k="Quantità residua" v={residuoAgg != null ? formatNumber(residuoAgg) : "-"} />
                        <KV k="In consegna" v={consegnaAgg != null ? formatNumber(consegnaAgg) : "-"} />
                        <KV k="Totale (aggregato)" v={totaleAgg != null ? formatCurrency(totaleAgg) : "-"} />
                    </div>

                    {totalRows === 0 && (
                        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-3">
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                Nessuna riga backorder rilevata per il cliente.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // details
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={(totalRows || total) > 0 ? "warn" : "neutral"}>
                        righe totali: <span className="ml-1 font-semibold">{formatNumber(totalRows || total)}</span>
                    </Pill>
                    {agg && (
                        <>
                            <Pill>residuo: <span className="ml-1 font-semibold">{formatNumber(residuoAgg)}</span></Pill>
                            <Pill>in consegna: <span className="ml-1 font-semibold">{formatNumber(consegnaAgg)}</span></Pill>
                            <Pill>totale: <span className="ml-1 font-semibold">{formatCurrency(totaleAgg)}</span></Pill>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {view === "item" && (
                        <button
                            type="button"
                            onClick={() => {
                                setView("list");
                                setSelectedKey(null);
                            }}
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                        >
                            <span>Torna alla lista</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => loadPage(0)}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                        disabled={loading}
                    >
                        <span>{loading ? "Aggiorno…" : "Ricarica"}</span>
                    </button>
                </div>
            </div>

            {hasErr && (
                <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-3">
                    <p className="text-[12px] font-semibold text-rose-800 dark:text-rose-200">Errore nel caricamento backorders</p>
                    <p className="mt-1 text-[11px] text-rose-700/80 dark:text-rose-200/80">
                        Controlla la console per dettagli.
                    </p>
                </div>
            )}

            {loading && items.length === 0 && (
                <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/40 p-4">
                    <div className="h-3 w-40 rounded bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse" />
                    <div className="mt-4 space-y-2">
                        <div className="h-2 w-full rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                        <div className="h-2 w-5/6 rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                    </div>
                </div>
            )}

            {!loading && items.length === 0 && !hasErr && (
                <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-4">
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Nessun backorder trovato.</p>
                </div>
            )}

            {/* view list (aggregata) */}
            {view === "list" && groups.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                    {groups.map((g) => (
                        <div
                            key={g.key}
                            className={cn(
                                "rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80",
                                "bg-white/80 dark:bg-neutral-900/60 shadow-sm",
                                "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/80 transition"
                            )}
                            onClick={() => {
                                setSelectedKey(g.key);
                                setView("item");
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    setSelectedKey(g.key);
                                    setView("item");
                                }
                            }}
                        >
                            <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                                        {cleanStr(g.descrizione)}
                                    </p>
                                    <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                                        {[
                                            g.tipo && `tipo: ${g.tipo}`,
                                            g.codiceProduttore !== "-" && `cod. prod.: ${g.codiceProduttore}`,
                                            g.codiceInterno !== "-" && `cod. int.: ${g.codiceInterno}`,
                                            g.magazzino !== "-" && `mag.: ${g.magazzino}`,
                                        ]
                                            .filter(Boolean)
                                            .join(" • ")}
                                    </p>
                                </div>

                                <div className="shrink-0 flex flex-col items-end gap-1">
                                    <Pill tone="neutral">
                                        righe: <span className="ml-1 font-semibold">{formatNumber(g.righe)}</span>
                                    </Pill>
                                    <Pill tone={g.qtyResidua > 0 ? "warn" : "neutral"}>
                                        residuo: <span className="ml-1 font-semibold">{formatNumber(g.qtyResidua)}</span>
                                    </Pill>
                                </div>
                            </div>

                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                                    <KV k="In consegna" v={formatNumber(g.qtyConsegna)} />
                                    <KV k="Prezzo (raw)" v={g.prezzo != null ? cleanStr(g.prezzo) : "-"} />
                                </div>

                                <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                                    <KV k="Prima data ordine" v={g.minData ? formatDateMaybe(g.minData) : "-"} />
                                    <KV k="Ultima data ordine" v={g.maxData ? formatDateMaybe(g.maxData) : "-"} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* load more */}
                    <div className="flex items-center justify-center">
                        <button
                            type="button"
                            disabled={loading || (total > 0 && items.length >= total)}
                            onClick={() => loadPage(ofs)}
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>
                                {total > 0 && items.length >= total ? "Tutti caricati" : loading ? "Carico…" : "Carica altri"}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* view item (righe del gruppo selezionato) */}
            {view === "item" && selectedGroup && (
                <div className="space-y-3">
                    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/60 shadow-sm">
                        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70">
                            <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
                                {cleanStr(selectedGroup.descrizione)}
                            </p>
                            <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                                {[
                                    selectedGroup.tipo && `tipo: ${selectedGroup.tipo}`,
                                    selectedGroup.codiceProduttore !== "-" && `cod. prod.: ${selectedGroup.codiceProduttore}`,
                                    selectedGroup.codiceInterno !== "-" && `cod. int.: ${selectedGroup.codiceInterno}`,
                                    selectedGroup.magazzino !== "-" && `mag.: ${selectedGroup.magazzino}`,
                                ]
                                    .filter(Boolean)
                                    .join(" • ")}
                            </p>
                        </div>

                        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                                <KV k="Righe" v={formatNumber(selectedGroup.righe)} />
                                <KV k="Residuo totale" v={formatNumber(selectedGroup.qtyResidua)} />
                            </div>
                            <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                                <KV k="In consegna totale" v={formatNumber(selectedGroup.qtyConsegna)} />
                                <KV k="Prezzo (raw)" v={selectedGroup.prezzo != null ? cleanStr(selectedGroup.prezzo) : "-"} />
                            </div>
                            <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                                <KV k="Prima data ordine" v={selectedGroup.minData ? formatDateMaybe(selectedGroup.minData) : "-"} />
                                <KV k="Ultima data ordine" v={selectedGroup.maxData ? formatDateMaybe(selectedGroup.maxData) : "-"} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {selectedGroup.rows.map((r, idx) => (
                            <div
                                key={`${r.TIPO ?? ""}-${r.NUMERO_ORDINE ?? ""}-${r.NUMERO_RIGA ?? ""}-${idx}`}
                                className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Pill>ordine: <span className="ml-1 font-semibold">{cleanStr(r.NUMERO_ORDINE)}</span></Pill>
                                        <Pill>riga: <span className="ml-1 font-semibold">{cleanStr(r.NUMERO_RIGA)}</span></Pill>
                                        <Pill>data: <span className="ml-1 font-semibold">{formatDateMaybe(r.DATA_ORDINE)}</span></Pill>
                                    </div>
                                    <Pill>tipo: <span className="ml-1 font-semibold">{cleanStr(r.TIPO)}</span></Pill>
                                </div>

                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                                        <KV k="Q.tà ordinata" v={formatNumber(r.QUANTITA_ODINATA ?? r.QUANTITA_ORDINATA)} />
                                        <KV k="Q.tà evasa" v={formatNumber(r.QUANTITA_EVASA)} />
                                        <KV k="Q.tà residua" v={formatNumber(r.QUANTITA_RESIDUA)} />
                                        <KV k="Q.tà in consegna" v={formatNumber(r.QUANTITA_IN_CONSEGNA)} />
                                    </div>
                                    <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                                        <KV k="Magazzino" v={cleanStr(r.CODICE_MAGAZZINO)} />
                                        <KV k="Prezzo (raw)" v={r.PREZZO != null ? cleanStr(r.PREZZO) : "-"} />
                                        <KV k="Cod. produttore" v={cleanStr(r.CODICE_PRODUTTORE)} />
                                        <KV k="Cod. interno" v={cleanStr(r.CODICE_INTERNO)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// -------- aggregation helper --------
function buildGroups(items: AnyRecord[]): Group[] {
    const map = new Map<string, Group>();

    for (const r of items || []) {
        const tipo = cleanStr(r.TIPO);
        const codProd = cleanStr(r.CODICE_PRODUTTORE);
        const codInt = cleanStr(r.CODICE_INTERNO);
        const desc = cleanStr(r.DESCRIZIONE_PRODOTTO);
        const mag = cleanStr(r.CODICE_MAGAZZINO);
        const prezzo = r.PREZZO;

        const key = [tipo, codProd, codInt, desc, mag, String(prezzo ?? "")].join("|");

        const qtyRes = Number(r.QUANTITA_RESIDUA ?? 0);
        const qtyCons = Number(r.QUANTITA_IN_CONSEGNA ?? 0);

        const dataOrd = r.DATA_ORDINE != null ? String(r.DATA_ORDINE) : null;

        const existing = map.get(key);
        if (!existing) {
            map.set(key, {
                key,
                tipo,
                codiceProduttore: codProd,
                codiceInterno: codInt,
                descrizione: desc,
                magazzino: mag,
                prezzo,
                rows: [r],
                righe: 1,
                qtyResidua: Number.isFinite(qtyRes) ? qtyRes : 0,
                qtyConsegna: Number.isFinite(qtyCons) ? qtyCons : 0,
                minData: dataOrd,
                maxData: dataOrd,
            });
        } else {
            existing.rows.push(r);
            existing.righe += 1;
            existing.qtyResidua += Number.isFinite(qtyRes) ? qtyRes : 0;
            existing.qtyConsegna += Number.isFinite(qtyCons) ? qtyCons : 0;

            if (dataOrd) {
                if (!existing.minData || String(dataOrd) < String(existing.minData)) existing.minData = dataOrd;
                if (!existing.maxData || String(dataOrd) > String(existing.maxData)) existing.maxData = dataOrd;
            }
        }
    }

    return Array.from(map.values()).sort((a, b) => {
        if (b.qtyResidua !== a.qtyResidua) return b.qtyResidua - a.qtyResidua;
        return b.righe - a.righe;
    });
}
