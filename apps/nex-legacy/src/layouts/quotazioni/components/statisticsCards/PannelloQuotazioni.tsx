import { motion } from "framer-motion";
import { clsx } from "components/UI/box/FDBox"
import FDIconButton from "components/UI/buttons/FDIconButton"
import LineChart from "./charts/LineChart";
//icons
import { FaRegChartBar } from "react-icons/fa";
import { MdOutlineTrendingUp, MdOutlineTrendingDown } from "react-icons/md";

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
const fmtPct = (n: any) => `${Math.round(Number(n ?? 0))}%`;
const fmtCount = (n: number) => new Intl.NumberFormat("it-IT").format(Number(n ?? 0));
const pctChange = (curr: number, prev: number): number | null => {
    if (prev === 0) return curr === 0 ? 0 : null;
    return ((curr - prev) / prev) * 100;
};


// ——————————————————————————————————————————————————————————
// COMPONENT
// ——————————————————————————————————————————————————————————
export function PannelloQuotazioni({ mese, isClienteHidden, showChart, onShowChart, onHideChart, kpi, loading }: PannelloQuotazioniProps) {
    const statuses = (kpi?.statuses ?? {}) as Record<string, number>;

    const total = Number(kpi?.totalQuotations ?? 0);
    const trend = (kpi?.trendPct ?? null) as number | null;

    const bozze = Number(statuses?.BOZZA ?? 0);
    const validazione = Number(statuses?.VALIDAZIONE ?? 0);
    const aperte = Number(statuses?.APERTA ?? 0);
    const daChiudere = Number(statuses?.DA_CHIUDERE ?? 0);
    const ok = Number(statuses?.OK ?? 0);
    const ko = Number(statuses?.KO ?? 0);

    // Fallback legacy: se nei dati storici non ci sono ancora OK/KO,
    // usiamo CHIUSA/COMPLETATA come proxy per non perdere informazione in UI.
    const legacyChiusa = Number(statuses?.CHIUSA ?? 0);
    const legacyCompletata = Number(statuses?.COMPLETATA ?? 0);
    const annullate = Number(statuses?.ANNULLATA ?? 0);

    // Chiuse finali workflow attuale.
    // Se il BE ha giÃ  calcolato closedOutcomes lo usiamo direttamente,
    // altrimenti ricalcoliamo da OK+KO; in assenza totale usiamo fallback legacy.
    const closedOutcomesRaw = Number(kpi?.closedOutcomes ?? (ok + ko));
    const closedOutcomes = closedOutcomesRaw > 0 ? closedOutcomesRaw : (legacyChiusa + legacyCompletata);

    // KPI sintetici giÃ  restituiti dal BE.
    // Se mancanti, ricostruiamo localmente con la stessa logica ibrida (corrente + legacy)
    // per mantenere coerenza visiva del pannello in tutti gli ambienti.
    const negative = Number(kpi?.negative ?? (ko + annullate + legacyChiusa));
    const positive = Number(kpi?.positive ?? (ok + legacyCompletata));

    const prevPositiveRaw = kpi?.previousPositive;
    const positiveTrend = (typeof prevPositiveRaw === "number")
        ? pctChange(positive, prevPositiveRaw)
        : null;

    const isUp = typeof trend === "number" ? trend >= 0 : true;
    const trendText = trend === null ? "—" : fmtPct(Math.abs(trend));

    const posIsUp = typeof positiveTrend === "number" ? positiveTrend >= 0 : true;
    const posTrendText = positiveTrend === null ? null : fmtPct(Math.abs(positiveTrend));


    const CmpHeader = ({ hideTopRank }: { hideTopRank: boolean }) => {
        return <div className="flex items-center justify-between">
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
    };

    return (
        <div className="relative w-full" style={{ perspective: 1000 }}>
            <motion.div
                className={clsx(
                    "grid w-full p-2 px-3 pb- rounded-md",
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
                    className="col-start-1 row-start-1 flex flex-col overflow-hidden"
                    style={{ backfaceVisibility: "hidden", pointerEvents: showChart ? "none" : "auto" }}
                >
                    <CmpHeader hideTopRank={true} />

                    <div className={`flex flex-col h-full overflow-hidden ${isClienteHidden && "max-h-[0px]"}`}>
                        <div className={`flex items-center justify-between `}>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400">Quotazioni totali:</span>
                                <span className="font-bold text-lg">{loading ? "…" : fmtCount(total)}</span>
                            </div>
                            <span
                                data-tooltip-id="general-quotations-tooltip"
                                data-tooltip-content="Quantità % rispetto al mese precedente"
                                className={`flex cursor-default items-center border border-solid rounded-xl px-2 py-1 text-sm ${isUp ? "border-emerald-400 bg-emerald-500/40 text-emerald-700 dark:text-emerald-200" : "border-red-400 bg-red-500/40 text-red-700 dark:text-red-200"}`}
                            >
                                {isUp ? <LineUp className="mr-1.5" /> : <LineDown className="mr-1.5" />}
                                {loading ? "…" : trendText}
                            </span>
                        </div>

                        <div className="text-xs mt-auto">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Stati quotazioni:</span>
                            <ul>
                                <li>
                                    Bozze
                                    {": "}
                                    <span className="font-bold">{loading ? "…" : fmtCount(bozze)}</span>
                                </li>
                                {/* <li>
                                    Validazione
                                    {": "}
                                    <span className="font-bold">{loading ? "…" : new Intl.NumberFormat("it-IT").format(validazione)}</span>
                                </li> */}
                                <li>
                                    Aperte
                                    {": "}
                                    <span className="font-bold">{loading ? "…" : fmtCount(aperte)}</span>
                                </li>
                                <li>
                                    Da chiudere
                                    {": "}
                                    <span className="font-bold">{loading ? "…" : fmtCount(daChiudere)}</span>
                                </li>
                                {/* Riepilogo richiesto dal task:
                                    "quante quotazioni sono state chiuse, di cui quante OK e quante KO".
                                    Se OK/KO non sono presenti su dati storici, usiamo fallback legacy. */}
                                <li>
                                    Chiuse <span className="font-bold">{loading ? "…" : fmtCount(closedOutcomes)}</span> di cui:<br />
                                    {' '}Esito positivo (OK): <span className="font-bold">{loading ? "…" : fmtCount(ok || legacyCompletata)}</span><br />
                                    {' '}Esito negativo (KO): <span className="font-bold">{loading ? "…" : fmtCount(ko || legacyChiusa)}</span>
                                </li>
                                {/* <li>Esito negativo: <span className="font-bold">{loading ? "…" : fmtCount(negative)}</span></li> */}
                                <li className="flex items-center justify-between">
                                    {/* <div className="flex items-center gap-1">
                                        <span>Esito positivo:</span>
                                        <span className="font-bold">{loading ? "…" : fmtCount(positive)}</span>
                                    </div> */}
                                    {posTrendText ? (
                                        <span
                                            data-tooltip-id="general-quotations-tooltip"
                                            data-tooltip-content="Quantità % rispetto al mese precedente"
                                            className={`flex items-center border border-solid rounded-xl px-1 py-0.5 text-xs ${posIsUp ? "border-emerald-400 bg-emerald-500/40 text-emerald-700 dark:text-emerald-200" : "border-red-400 bg-red-500/40 text-red-700 dark:text-red-200"}`}
                                        >
                                            {posIsUp ? <LineUp className="mr-1.5" /> : <LineDown className="mr-1.5" />}
                                            {loading ? "…" : posTrendText}
                                        </span>
                                    ) : null}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div
                    className="col-start-1 row-start-1"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        pointerEvents: showChart ? "auto" : "none"
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
                                Caricamento…
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default PannelloQuotazioni;
