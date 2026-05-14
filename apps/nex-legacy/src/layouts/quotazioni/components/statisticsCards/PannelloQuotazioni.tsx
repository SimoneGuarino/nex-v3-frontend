import { motion } from "framer-motion";
import { clsx } from "components/UI/box/FDBox";
import FDIconButton from "components/UI/buttons/FDIconButton";
import LineChart from "./charts/LineChart";
// icons
import { FaRegChartBar } from "react-icons/fa";
import { MdOutlineTrendingDown, MdOutlineTrendingUp } from "react-icons/md";

// ——————————————————————————————————————————————————————————
// ICONS
// ——————————————————————————————————————————————————————————
const LineUp = MdOutlineTrendingUp as React.FC<{ size?: number; className?: string }>;
const LineDown = MdOutlineTrendingDown as React.FC<{ size?: number; className?: string }>;
const FaRegChartBarIcon = FaRegChartBar as React.FC<{ size?: number; className?: string }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
interface PannelloQuotazioniProps {
    mese: string;
    isClienteHidden: boolean;
    showChart: boolean;
    onShowChart: () => void;
    onHideChart: () => void;
    kpi?: any;
    loading?: boolean;
}


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const fmtPct = (n: number) => `${Math.round(Math.abs(Number(n ?? 0)))}%`;
const fmtCount = (n: number) => new Intl.NumberFormat("it-IT").format(Number(n ?? 0));

const pctChange = (curr: number, prev: number): number | null => {
    if (prev === 0) return curr === 0 ? 0 : null;
    return ((curr - prev) / prev) * 100;
};

interface TrendBadgeProps {
    trend: number | null;
    loading?: boolean;
    tooltip: string;
    className?: string;
}

function TrendBadge({ trend, loading, tooltip, className }: TrendBadgeProps) {
    const isUp = typeof trend === "number" ? trend >= 0 : true;
    const trendText = trend === null ? "100" : fmtPct(trend);

    return (
        <span
            data-tooltip-id="general-quotations-tooltip"
            data-tooltip-content={tooltip}
            className={clsx(
                "flex items-center border border-solid rounded-xl px-2 py-1 text-xs cursor-default",
                isUp
                    ? "border-emerald-400 bg-emerald-500/40 text-emerald-700 dark:text-emerald-200"
                    : "border-red-400 bg-red-500/40 text-red-700 dark:text-red-200",
                className
            )}
        >
            {isUp ? <LineUp className="mr-1" /> : <LineDown className="mr-1" />}
            {loading ? "..." : trendText}
        </span>
    );
}


// ——————————————————————————————————————————————————————————
// COMPONENT
// ——————————————————————————————————————————————————————————
export function PannelloQuotazioni({
    mese,
    isClienteHidden,
    showChart,
    onShowChart,
    onHideChart,
    kpi,
    loading,
}: PannelloQuotazioniProps) {
    const statuses = (kpi?.statuses ?? {}) as Record<string, number>;

    const total = Number(kpi?.totalQuotations ?? 0);
    const previousTotal = Number(kpi?.previousTotalQuotations ?? 0);
    const trend = (kpi?.trendPct ?? null) as number | null;

    const aperte = Number(statuses?.APERTA ?? 0);
    const daChiudere = Number(statuses?.DA_CHIUDERE ?? 0);
    const waitingForAgent = Number(kpi?.waitingForAgent ?? 0);
    const waitingForBuyer = Number(kpi?.waitingForBuyer ?? 0);
    const openAndToClose = aperte + daChiudere;

    const ok = Number(statuses?.OK ?? 0);
    const ko = Number(statuses?.KO ?? 0);

    // Fallback legacy per ambienti con storico precedente al workflow OK/KO.
    const legacyChiusa = Number(statuses?.CHIUSA ?? 0);
    const legacyCompletata = Number(statuses?.COMPLETATA ?? 0);

    const closedOutcomesRaw = Number(kpi?.closedOutcomes ?? (ok + ko));
    const closedOutcomes = closedOutcomesRaw > 0 ? closedOutcomesRaw : legacyChiusa + legacyCompletata;
    const previousClosedOutcomes = Number(kpi?.previousClosedOutcomes ?? 0);
    const closedTrend = pctChange(closedOutcomes, previousClosedOutcomes);

    const renderCount = (value: number) => (loading ? "..." : fmtCount(value));

    const CmpHeader = ({ hideTopRank }: { hideTopRank: boolean }) => {
        return (
            <div className="flex items-center justify-between">
                <h1 className="text-sm">Quotazioni ({mese})</h1>

                <FDIconButton
                    size="small"
                    icon={<FaRegChartBarIcon />}
                    variant="secondary"
                    onClick={!hideTopRank ? onHideChart : onShowChart}
                    dataTooltipId="general-quotations-tooltip"
                    dataTooltipContent="Vedi Grafico"
                />
            </div>
        );
    };

    return (
        <div className="relative w-full" style={{ perspective: 1000 }}>
            <motion.div
                className={clsx(
                    "grid w-full p-2 px-3 rounded-md",
                    "bg-gradient-to-br from-white/90 to-white/60 dark:from-neutral-900/80 dark:to-neutral-900/60",
                    "border border-black/5 dark:border-white/10",
                    "shadow-sm",
                    isClienteHidden ? "max-h-[56px]" : "h-[200px] max-h-[200px]"
                )}
                animate={{ rotateY: showChart ? 180 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
            >
                <div
                    className="col-start-1 row-start-1 flex flex-col overflow-hidden h-full"
                    style={{ backfaceVisibility: "hidden", pointerEvents: showChart ? "none" : "auto" }}
                >
                    <CmpHeader hideTopRank={true} />

                    <div className={`flex flex-col h-full overflow-auto ${isClienteHidden ? "max-h-[0px]" : ""}`}>
                        <div className="mt-1 h-full flex flex-col gap-2 text-xs">
                            <div className="rounded-md border border-black/10 bg-black/[0.03] p-1 dark:border-white/10 dark:bg-white/[0.04]">

                                <div className="flex justify-between">
                                    {/* <div className="min-w-0"> */}
                                    <p className="text-base">Quotazioni totali: <span className="truncate text-lg font-bold">{renderCount(total)}</span></p>
                                    <TrendBadge
                                        trend={trend}
                                        loading={loading}
                                        tooltip="Confronto percentuale con mese precedente"
                                    />

                                </div>
                                <p className="text-[11px] leading-4">
                                    Mese precedente:{" "}
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        {renderCount(previousTotal)}
                                    </span>
                                </p>


                            </div>

                            <div className="flex min-h-0 justify-between w-full gap-2">
                                <section className="w-full rounded-md border border-black/10 bg-black/[0.03] p-1 dark:border-white/10 dark:bg-white/[0.04] text-[11px] leading-4">
                                    <p>
                                        Aperte: <span className="font-semibold">{renderCount(aperte)}</span>
                                    </p>
                                    <p>
                                        Da chiudere: <span className="font-semibold">{renderCount(daChiudere)}</span>
                                    </p>
                                    <p>
                                        In attesa del commerciale:{" "}
                                        <span className="font-semibold">{renderCount(waitingForAgent)}</span>
                                    </p>
                                    <p>
                                        In attesa del buyer: <span className="font-semibold">{renderCount(waitingForBuyer)}</span>
                                    </p>
                                </section>

                                <section className=" w-full rounded-md border border-black/10 bg-black/[0.03] p-1 dark:border-white/10 dark:bg-white/[0.04]">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] leading-4">Chiuse: <span className="text-[11px] font-bold">{renderCount(closedOutcomes)}</span></p>
                                        <TrendBadge
                                            trend={closedTrend}
                                            loading={loading}
                                            tooltip="Confronto chiuse con mese precedente"
                                            className="px-1.5 py-0.5 text-[10px]"
                                        />
                                    </div>

                                    {/* <p className="text-base font-bold">{renderCount(closedOutcomes)}</p> */}

                                    <div className="text-[11px] leading-4">
                                        <p>
                                            OK: <span className="font-semibold">{renderCount(ok || legacyCompletata)}</span>
                                        </p>
                                        <p>
                                            KO: <span className="font-semibold">{renderCount(ko || legacyChiusa)}</span>
                                        </p>
                                        <p>
                                            Mese precedente:{" "}
                                            <span className="font-semibold">{renderCount(previousClosedOutcomes)}</span>
                                        </p>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="col-start-1 row-start-1"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        pointerEvents: showChart ? "auto" : "none",
                    }}
                >
                    <CmpHeader hideTopRank={false} />

                    <div className={`overflow-hidden ${isClienteHidden ? "h-0 opacity-0" : "h-auto opacity-100"}`}>
                        {!loading ? (
                            <LineChart
                                kpi={kpi}
                                labelCurrent={mese}
                                labelPrevious="Mese precedente"
                                isCollapsed={isClienteHidden}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                                Caricamento...
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default PannelloQuotazioni;
