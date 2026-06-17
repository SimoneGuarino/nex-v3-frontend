import React from "react";
import { FidiAPI } from "../fetchData/Fidi";
import { FDBox, FDButton } from "@nex/fd-ui";
import { useUserContext } from "context/UserContext";

type FidoStatus = "in lavorazione" | "in attesa" | "approvata" | "rifiutata";
export type FidoStatusItem = {
    status: FidoStatus;
    count: number;   // numero pratiche
    amount: number;  // valore in €
    trend?: number[];
};

type Metric = "count" | "amount";

type Props = {
    title?: string;
    timeframeLabel?: string;
    defaultMetric?: Metric;                 // default: "count"
    onBarClick?: (status: FidoStatus) => void;
};

const ORDER: FidoStatus[] = ["in lavorazione", "in attesa", "approvata", "rifiutata"];

const COLORS: Record<FidoStatus, { base: string }> = {
    "in lavorazione": { base: "#93c5fd" }, // blue-300
    "in attesa": { base: "#60a5fa" }, // blue-400
    "approvata": { base: "#3b82f6" }, // blue-500
    "rifiutata": { base: "#1d4ed8" }, // blue-700
};

// ───────────── util
const CHART_H = 160; // px (altezza area barre)
const fmtEuro = (v: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(v);
const fmtCompact = (v: number) =>
    new Intl.NumberFormat("it-IT", { notation: "compact", maximumFractionDigits: 1 }).format(v);

const niceMax = (x: number) => {
    const v = Math.max(0, x);
    if (v <= 10) return 10;
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const scaled = v / pow;
    const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
    return step * pow;
};

const FidiStatusWidget: React.FC<Props> = ({
    title = "Resoconto fidi",
    timeframeLabel,
    defaultMetric = "count",
    onBarClick,
}) => {
    const [userContext] = useUserContext();

    const [rows, setRows] = React.useState<FidoStatusItem[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [metric, setMetric] = React.useState<Metric>(defaultMetric);
    const [error, setError] = React.useState<string | null>(null);

    // Teniamo l'ultimo fetch attivo per abortire quello precedente
    const acRef = React.useRef<AbortController | null>(null);

    const refetch = React.useCallback(() => {
        if (loading) return; // evita refetch multipli
        // abortisce eventuale richiesta precedente
        acRef.current?.abort();
        const ac = new AbortController();
        acRef.current = ac;

        setLoading(true);
        setError(null);

        FidiAPI({
            abortController: acRef,
            HandleComplete: (resp: FidoStatusItem[]) => {
                const byStatus = new Map(resp.map(r => [r.status, r]));
                const normalized = ORDER.map(st => byStatus.get(st) ?? { status: st, count: 0, amount: 0 });
                setRows(normalized);
                setLoading(false);
            },
            HandleError: (err: string) => {
                setError(err);
                setLoading(false);
            },
        });
    }, [loading]);

    // Auto-fetch al mount / al cambio utente
    React.useEffect(() => {
        refetch();
        return () => {
            acRef.current?.abort();
        };
    }, [userContext]);

    // totali per intestazione + asse
    const total = React.useMemo(
        () => rows.reduce((a, r) => a + (metric === "amount" ? (r.amount || 0) : (r.count || 0)), 0),
        [rows, metric]
    );
    const yMax = React.useMemo(
        () => niceMax(Math.max(...rows.map(r => (metric === "amount" ? (r.amount || 0) : (r.count || 0))), 0)),
        [rows, metric]
    );

    // formatter dinamici
    const fmtTop = metric === "amount"
        ? (v: number) => fmtEuro(v)
        : (v: number) => v.toLocaleString("it-IT");

    const fmtAxis = metric === "amount"
        ? (v: number) => fmtCompact(v)
        : (v: number) => v.toLocaleString("it-IT");

    return (
        <div className="rounded-2xl h-full p-4">
            {/* HEADER */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{title}</div>
                    {!!timeframeLabel && <div className="text-[11px] text-neutral-500">{timeframeLabel}</div>}
                </div>

                {/* Switch metrica */}
                <FDBox color="neutral" variant="soft" radius='full' className="flex p-1">
                    <FDButton
                        variant={metric === "amount" ? "solid" : "ghost"}
                        size="small"
                        className="text-xs !rounded-full"
                        onClick={() => setMetric("amount")}
                        title="Valore monetario"
                    >
                        Valore
                    </FDButton>
                    <FDButton
                        variant={metric === "count" ? "solid" : "ghost"}
                        size="small"
                        className="text-xs !rounded-full"
                        onClick={() => setMetric("count")}
                        title="Numero pratiche"
                    >
                        Quantità
                    </FDButton>
                </FDBox>
            </div>

            {/* VALORE GRANDE */}
            {!loading ? <div className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                {fmtTop(total)}
            </div> : <div className="h-14 w-1/3 mt-2 rounded-[12px] bg-black/5 dark:bg-white/5 animate-pulse" />}

            {/* CHART */}
            <div className="mt-6 relative items-end">
                {/* Asse Y */}
                <div className="absolute top-0 flex h-[180px] flex-col justify-between text-[11px] text-neutral-400 select-none">
                    {[1, 0.8, 0.6, 0.4, 0.2, 0].map((t) => (
                        <span key={t}>{fmtAxis(Math.round(yMax * t))}</span>
                    ))}
                </div>

                {/* Barre */}
                <div className="ml-6 overflow-x-auto">
                    <div className="flex items-end gap-4 pr-1" style={{ height: 180 }}>
                        {(!!error || loading) &&
                            ORDER.map((st) => (
                                <div key={st} className="h-[180px] w-full rounded-[12px] bg-black/5 dark:bg-white/5 animate-pulse" />
                            ))}

                        {(!!!error && !loading) &&
                            ORDER.map((st) => {
                                const row = rows.find(r => r.status === st)!;
                                if (!row) return null; // non dovrebbe succedere
                                const value = metric === "amount" ? (row.amount || 0) : (row.count || 0);
                                const barH = value > 0 ? Math.max(6, Math.round((value / yMax) * CHART_H)) : 0;
                                const pctOfTotal = total > 0 ? Math.round((value / total) * 100) : 0;

                                return (
                                    <button
                                        key={st}
                                        onClick={onBarClick ? () => onBarClick(st) : undefined}
                                        className="group relative flex h-[180px] w-full flex-col items-center gap-1 focus:outline-none"
                                        aria-label={`${st}: ${metric === "amount" ? fmtEuro(value) : `${value} pratiche`} (${pctOfTotal}%)`}
                                        data-tooltip-id="general-dashboard-tooltip"
                                        data-tooltip-content={`${st} – ${metric === "amount" ? fmtEuro(value) : `${value} pratiche`} (${pctOfTotal}%)`}
                                    >
                                        <div className="relative h-[160px] w-14 min-w-0">
                                            {/* colonna guidata (tratteggio) */}
                                            <div
                                                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 rounded-[12px] border border-black/5 dark:border-white/10"
                                                style={{
                                                    height: CHART_H,
                                                    backgroundImage:
                                                        "repeating-linear-gradient(135deg, rgba(59,130,246,0.10) 0 6px, transparent 6px 12px)",
                                                    backgroundClip: "padding-box",
                                                }}
                                            />

                                            {/* barra piena */}
                                            <div
                                                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 shadow-sm transition-[height] duration-200"
                                                style={{
                                                    height: barH,
                                                    background: COLORS[st].base,
                                                    borderTopLeftRadius: "14px",
                                                    borderTopRightRadius: "14px",
                                                    borderBottomLeftRadius: "12px",
                                                    borderBottomRightRadius: "12px",
                                                }}
                                            >

                                                {/* bubble % del totale (della metrica selezionata) */}
                                                <div
                                                    className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full 
                                                    border-2 border-white dark:border-neutral-800
                                                    px-2 py-1 text-[11px] font-semibold text-white shadow-sm
                                                    bg-[#3b82f6] group-hover:scale-[1.03] transition-transform"
                                                >
                                                    {pctOfTotal}%
                                                </div>
                                            </div>

                                        </div>

                                        {/* X: pallino colorato */}
                                        <div className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: COLORS[st].base }} />
                                        <div className="sr-only">{st}</div>
                                    </button>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* legend compatta (opzionale) */}
            <div className="hidden sm:flex flex-wrap gap-2 text-[11px] text-neutral-600 dark:text-neutral-300 mt-6">
                {ORDER.map((st) => (
                    <span key={st} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/60 dark:bg-neutral-800/70 px-2 py-0.5">
                        <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[st].base }} />
                        {st}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default FidiStatusWidget;
