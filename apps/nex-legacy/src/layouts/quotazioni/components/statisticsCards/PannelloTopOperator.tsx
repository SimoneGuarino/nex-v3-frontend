import { motion } from "framer-motion";
import { clsx } from "components/UI/box/FDBox";
import FDIconButton from "components/UI/buttons/FDIconButton";
//icons
import { FaRegChartBar } from "react-icons/fa";
import { TbLetterA, TbLetterB, TbNumber3, TbNumber5, TbNumber10 } from "react-icons/tb";
import { MdOutlineTrendingUp, MdOutlineTrendingDown } from "react-icons/md";
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
interface PannelloTopOperatorProps {
    mese: string;
    isClienteHidden: boolean;
    userDetails?: any;
    showAgent: boolean;
    onToggleAgent: () => void;
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
export function PannelloTopOperator({
    mese,
    isClienteHidden,
    userDetails,
    showAgent,
    onToggleAgent,
    showChart,
    onShowChart,
    onHideChart,
    kpi,
    loading,
}: PannelloTopOperatorProps) {
    const [topN, setTopN] = useState<number>(10);

    const canSwitch =
        userDetails?.ruolo === "Dev" ||
        userDetails?.ruolo === "Admin" ||
        userDetails?.ruolo === "Amministrativo";

    const totalValue = Number(kpi?.totalValue ?? 0);
    const trend = (kpi?.trendPct ?? null) as number | null;

    const isUp = typeof trend === "number" ? trend >= 0 : true;
    const trendText = trend === null ? "—" : fmtPct(Math.abs(trend));

    const topByQ = kpi?.topByQuotations ?? null;
    const topByC = kpi?.topByCompleted ?? null;

    const topIcon = topN === 10 ? TbNumber10({}) : topN === 5 ? TbNumber5({}) : TbNumber3({});

    const cycleTopN = () => {
        setTopN((prev) => (prev === 10 ? 5 : prev === 5 ? 3 : 10));
    };

    // ✅ FIX: l’API ritorna i dati del grafico in kpi.ranking
    const chartData = useMemo(() => {
        const base = Array.isArray(kpi?.ranking) ? kpi.ranking : [];

        const mapped = base.map((x: any) => ({
            label: String(
                x?.label ??
                x?.name ??
                x?.fullName ??
                x?.buyerCode ??
                x?.agentName ??
                x?.code ??
                x?.id ??
                x?._id ??
                "—"
            ),
            value: Number(x?.value ?? 0),
        }));

        return mapped.slice(0, topN);
    }, [kpi, topN]);

    const CmpHeader = ({ hideTopRank }: { hideTopRank: boolean }) => {
        return <div className="flex items-center justify-between">
            <h1 className="text-sm"> {userDetails?.ruolo === "Buyer" ? (
                `Top Agent (${mese})`
            ) : userDetails?.ruolo === "Commerciale" ? (
                `${showAgent ? "Top Agent" : "Top Buyer"} (${mese})`
            ) : (
                `${showAgent ? "Top Agent" : "Top Buyer"} (${mese})`
            )}
            </h1>

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
                {canSwitch && (
                    <FDIconButton
                        size="small"
                        icon={showAgent ? TbLetterA({}) : TbLetterB({})}
                        variant="secondary"
                        onClick={onToggleAgent}
                        dataTooltipId="general-quotations-tooltip"
                        dataTooltipContent={showAgent ? "Passa a Buyer" : "Passa a Agenti"}
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
                                <span className="text-xs text-gray-600 dark:text-gray-400">Valore quotato:</span>
                                <span className="font-bold text-lg">{loading ? "…" : NumberToEuro({ convert: totalValue })}</span>
                            </div>
                            <span
                                data-tooltip-id="general-quotations-tooltip"
                                data-tooltip-content="Valore % rispetto al mese precedente"
                                className={`flex items-center cursor-default border border-solid rounded-xl px-2 py-1 text-sm ${isUp
                                    ? "border-emerald-400 bg-emerald-500/40 text-emerald-700 dark:text-emerald-200"
                                    : "border-red-400 bg-red-500/40 text-red-700 dark:text-red-200"
                                    }`}
                            >
                                {isUp ? <LineUp className="mr-1.5" /> : <LineDown className="mr-1.5" />}
                                {loading ? "…" : trendText}
                            </span>
                        </div>

                        <ul className="text-xs mt-auto">
                            <li>
                                Con + quotazioni totali:{" "}
                                <span className="font-bold">{loading ? "…" : topByQ?.label ?? "—"}</span>
                            </li>
                            <li>
                                Con + quotazioni completate:{" "}
                                <span className="font-bold">{loading ? "…" : topByC?.label ?? "—"}</span>
                            </li>
                        </ul>
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

                    <div className={`overflow-hidden ${isClienteHidden && "max-h-[0px]"}`} >
                        <BarChart data={chartData} valueFormatter={(v) => NumberToEuro({ convert: v })} />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default PannelloTopOperator;