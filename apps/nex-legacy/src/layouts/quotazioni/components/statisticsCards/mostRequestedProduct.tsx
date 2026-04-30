import { motion } from "framer-motion";
import { clsx } from "components/UI/box/FDBox"
import FDIconButton from "components/UI/buttons/FDIconButton"
//icons
import { FaRegChartBar } from "react-icons/fa";
import { MdOutlineTrendingUp, MdOutlineTrendingDown } from "react-icons/md";
import { TbNumber3, TbNumber5, TbNumber10 } from "react-icons/tb";
import { useMemo, useState } from "react";
import BarChart from "./charts/BarChart";
import { NumberToEuro } from "utils";

// ——————————————————————————————————————————————————————————
// ICONS
// ——————————————————————————————————————————————————————————
const LineUp = MdOutlineTrendingUp as React.FC<{ size?: number; className?: string }>;
const LineDown = MdOutlineTrendingDown as React.FC<{ size?: number; className?: string }>;
const FaRegChartBarIcon = FaRegChartBar as React.FC<{ size?: number; className?: string }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
interface PannelloDomandaProps {
    mese: string;
    isClienteHidden: boolean;
    showChart: boolean;
    onShowChart: () => void;
    onHideChart: () => void;
    kpi?: any;
    loading?: boolean;
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const fmtPct = (n: any) => `${Math.round(Number(n ?? 0))}%`;


// ——————————————————————————————————————————————————————————
// COMPONENT
// ——————————————————————————————————————————————————————————
export function MostRequestedProduct({ mese, isClienteHidden, showChart, onShowChart, onHideChart, kpi, loading }: PannelloDomandaProps) {
    const [topN, setTopN] = useState<number>(10);

    const top = kpi?.topProduct ?? null;
    const label = top?.label ?? "—";

    const sharePct = typeof top?.sharePct === "number" ? top.sharePct : null;
    const trendPct = typeof top?.trendPct === "number" ? top.trendPct : null;

    const avg = kpi?.avgProductsPerQuotation ?? null;

    const isUp = typeof trendPct === "number" ? trendPct >= 0 : true;
    const trendText = trendPct === null ? "—" : fmtPct(Math.abs(trendPct));

    const shareText = sharePct === null ? "—" : fmtPct(sharePct);

    const topIcon =
        topN === 10 ? TbNumber10({}) : topN === 5 ? TbNumber5({}) : TbNumber3({});

    const cycleTopN = () => {
        setTopN((prev) => (prev === 10 ? 5 : prev === 5 ? 3 : 10));
    };

    const chartData = useMemo(() => {
        const arr = Array.isArray(kpi?.topProducts) ? kpi.topProducts : [];
        const mapped = arr.map((p: any) => ({
            label: String(p?.label ?? p?.productId ?? "—"),
            value: Number(p?.qty ?? 0),
        }));
        return mapped.slice(0, topN);
    }, [kpi, topN]);

    const CmpHeader = ({ hideTopRank }: { hideTopRank: boolean }) => {
        return <div className="flex items-center justify-between">
            <h1 className="text-sm">Domanda ({mese})</h1>

            <div className="flex items-center gap-1">
                {!hideTopRank && (
                    <FDIconButton
                        size="small"
                        icon={topIcon}
                        variant="secondary"
                        onClick={cycleTopN}
                        dataTooltipId="general-quotations-tooltip"
                        dataTooltipContent={`Top ${topN}`}
                    />
                )}
                <FDIconButton
                    size="small"
                    icon={<FaRegChartBarIcon />}
                    variant="secondary"
                    onClick={!hideTopRank ? onHideChart : onShowChart}
                    dataTooltipId="general-quotations-tooltip"
                    dataTooltipContent="Vedi Grafico"
                />
            </div>
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
                        <div className={`flex items-center justify-between`}>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400">Prodotto più richiesto:</span>
                                <span className="font-bold text-lg">{loading ? "…" : label}</span>
                            </div>
                            <span
                                data-tooltip-id="general-quotations-tooltip"
                                data-tooltip-content="Incremento % rispetto al mese precedente"
                                className={`flex items-center cursor-default border border-solid rounded-xl px-2 py-1 text-sm ${isUp ? "border-emerald-400 bg-emerald-500/40 text-emerald-700 dark:text-emerald-200" : "border-red-400 bg-red-500/40 text-red-700 dark:text-red-200"}`}
                            >
                                {isUp ? <LineUp className="mr-1.5" /> : <LineDown className="mr-1.5" />}
                                {loading ? "…" : trendText}
                            </span>
                        </div>

                        <div className={`text-xs mt-auto`}>
                            <ul>
                                <li>% sul totale richieste: <span className="font-bold">{loading ? "…" : shareText}</span></li>
                                <li>Media prodotti/quotazione: <span className="font-bold">{loading ? "…" : (avg === null ? "—" : NumberToEuro({convert: avg}))}</span></li>
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

                    <div className={` overflow-hidden ${isClienteHidden ? "h-0 opacity-0" : "h-auto opacity-100"}`}>
                        <BarChart
                            data={chartData}
                            valueFormatter={(v) => new Intl.NumberFormat("it-IT").format(v)}
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default MostRequestedProduct;
