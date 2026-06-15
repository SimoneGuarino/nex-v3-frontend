import React, { useMemo } from "react";
import { FiRefreshCw, FiSearch } from "react-icons/fi";
import { StatusPill } from "../../components/StatusPill";
import { formatDate } from "../../utils/formatters";
import type { MepaTenderListItem } from "../../types";

export type TenderListScreenProps = {
    tenders: MepaTenderListItem[];
    query: string;
    setQuery: (value: string) => void;
    onOpenWorkspace: (tender: MepaTenderListItem) => void;
    onRefresh: () => void;
};

/**
 * Read-only tender portfolio screen.
 *
 * The list computes only lightweight KPI values and delegates workspace opening
 * to the page container. Keeping it pure makes it safe to memoize later and
 * prevents portfolio rendering from depending on workspace-level state.
 */
/**
 * Landing screen for MEPA tenders.
 *
 * This component is deliberately stateless with respect to data fetching: it
 * receives the list, search query and callbacks from useMepaWorkspaceController.
 * That separation allows the list UI to stay cheap and memoizable while the
 * controller owns polling, refresh and rate-limit behavior.
 */
export function TenderListScreen(props: TenderListScreenProps) {
    const { tenders, query, setQuery, onOpenWorkspace, onRefresh } = props;
    // Derived dashboard counters for the list header. They are memoized because
    // the list can grow over time and these aggregations should not be repeated
    // on every keystroke unrelated to the tender collection.
    const kpis = useMemo(() => {
        const active = tenders.filter((item) => item.status !== "CLOSED").length;
        const running = tenders.filter((item) => item.status === "ANALYSIS_RUNNING").length;
        const review = tenders.filter((item) => item.status === "READY_FOR_REVIEW").length;
        const converted = tenders.filter((item) => item.status === "QUOTATION_CREATED").length;
        return [["Gare attive", active, "Portfolio aperto"], ["In analisi AI", running, "Orchestratore in corso"], ["Da validare", review, "Dossier pronti"], ["Convertite", converted, "Quotazioni collegate"]];
    }, [tenders]);

    return (
        <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {kpis.map(([label, value, desc]) => (
                    <div key={String(label)} className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{label}</p>
                        <p className="mt-2 text-3xl font-semibold">{value}</p>
                        <p className="mt-1 text-xs text-slate-500">{desc}</p>
                    </div>
                ))}
            </div>

            <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-[280px] flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
                        <FiSearch className="text-slate-400" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca per CIG, RDO, ente o titolo gara..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
                    </div>
                    <button onClick={onRefresh} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-950">
                        <FiRefreshCw /> Aggiorna
                    </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-neutral-800">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-400 dark:bg-neutral-950">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Gara</th>
                                <th className="px-4 py-3 font-semibold">CIG / RDO</th>
                                <th className="px-4 py-3 font-semibold">Scadenza</th>
                                <th className="px-4 py-3 font-semibold">Stato</th>
                                <th className="px-4 py-3 font-semibold">GO</th>
                                <th className="px-4 py-3 font-semibold">Prodotti</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenders.map((tender) => (
                                <tr key={tender._id} onClick={() => onOpenWorkspace(tender)} className="cursor-pointer border-t border-slate-100 transition hover:bg-blue-50/40 dark:border-neutral-800 dark:hover:bg-blue-950/20">
                                    <td className="px-4 py-4">
                                        <p className="font-semibold">{tender.title}</p>
                                        <p className="mt-1 text-xs text-slate-500">{tender.ente ?? "Ente non valorizzato"} · {tender.ownerName ?? "Ufficio Gare"}</p>
                                    </td>
                                    <td className="px-4 py-4 text-xs text-slate-500"><p>{tender.cig ?? "—"}</p><p>{tender.rdo ?? "—"}</p></td>
                                    <td className="px-4 py-4 text-sm">{formatDate(tender.deadlineAt)}</td>
                                    <td className="px-4 py-4"><StatusPill value={tender.status} /></td>
                                    <td className="px-4 py-4"><StatusPill value={tender.goNoGo ?? "PENDING"} /></td>
                                    <td className="px-4 py-4 font-semibold">{tender.extractedItemsCount ?? 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
