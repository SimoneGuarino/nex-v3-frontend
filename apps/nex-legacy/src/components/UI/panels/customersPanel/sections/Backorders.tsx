import React from "react";
import { FetchData } from "examples/Fetch";
import type {
    AnyRecord,
    BackordersDetailsPayload,
    BackordersSummaryPayload,
    PanelMode,
} from "../types";
import {
    ensureTrailingSlash,
    formatCurrencyIt,
    formatDateMaybe,
    formatNumberIt,
    toDisplayText,
} from "../helpers/panelUtils";
import {
    SectionActionButton,
    SectionBlock,
    SectionContainer,
    SectionHeader,
    SectionKeyValue,
    SectionPill,
} from "../components/sectionUi";
import { FaPlus } from "react-icons/fa";

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
    mode: PanelMode;
    customerCode: string | number;

    summary: BackordersSummaryPayload | null | undefined;

    // ✅ dati details già caricati dal pannello (1 sola chiamata a details)
    details?: BackordersDetailsPayload | null;

    onOpenDetails?: () => void;
}> = ({ mode, customerCode, summary, details, onOpenDetails }) => {
    const isSummary = mode === "summary";
    const base = ensureTrailingSlash(import.meta.env.VITE_API_CUSTOMERSFIDO);

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
            <SectionContainer clickable={false} onActivate={onOpenDetails} dataTour="scheda-cliente-backorders">
                <SectionHeader
                    title="Backorders"
                    description="Righe ordine aperte e residui (oc + fb)"
                    rightContent={
                        <div className="flex items-center gap-2">
                            <SectionPill tone={totalRows > 0 ? "warn" : "neutral"}>
                                righe: <span className="ml-1 font-semibold">{formatNumberIt(totalRows)}</span>
                            </SectionPill>

                            {clickable && (
                                <SectionActionButton
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onOpenDetails?.();
                                    }}
                                    rightIcon={FaPlus({})}
                                >
                                    <span>Dettagli</span>
                                </SectionActionButton>
                            )}
                        </div>
                    }
                />

                <div className="p-4 space-y-3">
                    <SectionBlock contentClassName="space-y-2">
                        <SectionKeyValue k="Quantita residua" v={residuoAgg != null ? formatNumberIt(residuoAgg) : "-"} />
                        <SectionKeyValue k="In consegna" v={consegnaAgg != null ? formatNumberIt(consegnaAgg) : "-"} />
                        <SectionKeyValue k="Totale (aggregato)" v={totaleAgg != null ? formatCurrencyIt(totaleAgg) : "-"} />
                    </SectionBlock>

                    {totalRows === 0 && (
                        <SectionBlock className="bg-white/70 dark:bg-neutral-900/40">
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                Nessuna riga backorder rilevata per il cliente.
                            </p>
                        </SectionBlock>
                    )}
                </div>
            </SectionContainer>
        );
    }

    // details
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <SectionPill tone={(totalRows || total) > 0 ? "warn" : "neutral"}>
                        righe totali: <span className="ml-1 font-semibold">{formatNumberIt(totalRows || total)}</span>
                    </SectionPill>
                    {agg && (
                        <>
                            <SectionPill>residuo: <span className="ml-1 font-semibold">{formatNumberIt(residuoAgg)}</span></SectionPill>
                            <SectionPill>in consegna: <span className="ml-1 font-semibold">{formatNumberIt(consegnaAgg)}</span></SectionPill>
                            <SectionPill>totale: <span className="ml-1 font-semibold">{formatCurrencyIt(totaleAgg)}</span></SectionPill>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {view === "item" && (
                        <SectionActionButton
                            onClick={() => {
                                setView("list");
                                setSelectedKey(null);
                            }}
                        >
                            <span>Torna alla lista</span>
                        </SectionActionButton>
                    )}

                    <SectionActionButton
                        onClick={() => loadPage(0)}
                        disabled={loading}
                    >
                        <span>{loading ? "Aggiorno..." : "Ricarica"}</span>
                    </SectionActionButton>
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
                        <SectionContainer
                            key={g.key}
                            clickable
                            onActivate={() => {
                                setSelectedKey(g.key);
                                setView("item");
                            }}
                        >
                            <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                                        {toDisplayText(g.descrizione)}
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
                                    <SectionPill tone="neutral">
                                        righe: <span className="ml-1 font-semibold">{formatNumberIt(g.righe)}</span>
                                    </SectionPill>
                                    <SectionPill tone={g.qtyResidua > 0 ? "warn" : "neutral"}>
                                        residuo: <span className="ml-1 font-semibold">{formatNumberIt(g.qtyResidua)}</span>
                                    </SectionPill>
                                </div>
                            </div>

                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <SectionBlock contentClassName="space-y-2">
                                    <SectionKeyValue k="In consegna" v={formatNumberIt(g.qtyConsegna)} />
                                    <SectionKeyValue k="Prezzo (raw)" v={g.prezzo != null ? toDisplayText(g.prezzo) : "-"} />
                                </SectionBlock>

                                <SectionBlock contentClassName="space-y-2">
                                    <SectionKeyValue k="Prima data ordine" v={g.minData ? formatDateMaybe(g.minData) : "-"} />
                                    <SectionKeyValue k="Ultima data ordine" v={g.maxData ? formatDateMaybe(g.maxData) : "-"} />
                                </SectionBlock>
                            </div>
                        </SectionContainer>
                    ))}

                    {/* load more */}
                    <div className="flex items-center justify-center">
                        <SectionActionButton
                            disabled={loading || (total > 0 && items.length >= total)}
                            onClick={() => loadPage(ofs)}
                            className="px-4 py-2"
                        >
                            <span>
                                {total > 0 && items.length >= total ? "Tutti caricati" : loading ? "Carico..." : "Carica altri"}
                            </span>
                        </SectionActionButton>
                    </div>
                </div>
            )}

            {/* view item (righe del gruppo selezionato) */}
            {view === "item" && selectedGroup && (
                <div className="space-y-3">
                    <SectionContainer>
                        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70">
                            <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
                                {toDisplayText(selectedGroup.descrizione)}
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
                            <SectionBlock contentClassName="space-y-2">
                                <SectionKeyValue k="Righe" v={formatNumberIt(selectedGroup.righe)} />
                                <SectionKeyValue k="Residuo totale" v={formatNumberIt(selectedGroup.qtyResidua)} />
                            </SectionBlock>
                            <SectionBlock contentClassName="space-y-2">
                                <SectionKeyValue k="In consegna totale" v={formatNumberIt(selectedGroup.qtyConsegna)} />
                                <SectionKeyValue k="Prezzo (raw)" v={selectedGroup.prezzo != null ? toDisplayText(selectedGroup.prezzo) : "-"} />
                            </SectionBlock>
                            <SectionBlock contentClassName="space-y-2">
                                <SectionKeyValue k="Prima data ordine" v={selectedGroup.minData ? formatDateMaybe(selectedGroup.minData) : "-"} />
                                <SectionKeyValue k="Ultima data ordine" v={selectedGroup.maxData ? formatDateMaybe(selectedGroup.maxData) : "-"} />
                            </SectionBlock>
                        </div>
                    </SectionContainer>

                    <div className="space-y-2">
                        {selectedGroup.rows.map((r, idx) => (
                            <div
                                key={`${r.TIPO ?? ""}-${r.NUMERO_ORDINE ?? ""}-${r.NUMERO_RIGA ?? ""}-${idx}`}
                                className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <SectionPill>ordine: <span className="ml-1 font-semibold">{toDisplayText(r.NUMERO_ORDINE)}</span></SectionPill>
                                        <SectionPill>riga: <span className="ml-1 font-semibold">{toDisplayText(r.NUMERO_RIGA)}</span></SectionPill>
                                        <SectionPill>data: <span className="ml-1 font-semibold">{formatDateMaybe(r.DATA_ORDINE)}</span></SectionPill>
                                    </div>
                                    <SectionPill>tipo: <span className="ml-1 font-semibold">{toDisplayText(r.TIPO)}</span></SectionPill>
                                </div>

                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <SectionBlock contentClassName="space-y-2">
                                        <SectionKeyValue k="Q.tà ordinata" v={formatNumberIt(r.QUANTITA_ODINATA ?? r.QUANTITA_ORDINATA)} />
                                        <SectionKeyValue k="Q.tà evasa" v={formatNumberIt(r.QUANTITA_EVASA)} />
                                        <SectionKeyValue k="Q.tà residua" v={formatNumberIt(r.QUANTITA_RESIDUA)} />
                                        <SectionKeyValue k="Q.tà in consegna" v={formatNumberIt(r.QUANTITA_IN_CONSEGNA)} />
                                    </SectionBlock>
                                    <SectionBlock contentClassName="space-y-2">
                                        <SectionKeyValue k="Magazzino" v={toDisplayText(r.CODICE_MAGAZZINO)} />
                                        <SectionKeyValue k="Prezzo (raw)" v={r.PREZZO != null ? toDisplayText(r.PREZZO) : "-"} />
                                        <SectionKeyValue k="Cod. produttore" v={toDisplayText(r.CODICE_PRODUTTORE)} />
                                        <SectionKeyValue k="Cod. interno" v={toDisplayText(r.CODICE_INTERNO)} />
                                    </SectionBlock>
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
        const tipo = toDisplayText(r.TIPO);
        const codProd = toDisplayText(r.CODICE_PRODUTTORE);
        const codInt = toDisplayText(r.CODICE_INTERNO);
        const desc = toDisplayText(r.DESCRIZIONE_PRODOTTO);
        const mag = toDisplayText(r.CODICE_MAGAZZINO);
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








