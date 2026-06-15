import { motion } from "framer-motion";
import { clsx } from "clsx";
import { FDIconButton } from "@nex/fd-ui";
import { useMemo, useState } from "react";
import BarChart from "./charts/BarChart";
//icons
import { FaRegChartBar } from "react-icons/fa";
import { BiHide, BiShow } from "react-icons/bi";
import { MdOutlineTrendingUp, MdOutlineTrendingDown } from "react-icons/md";
import { TbNumber3, TbNumber5, TbNumber10 } from "react-icons/tb";
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
interface PannelloTopCustomerProps {
    mese: string;
    isClienteHidden: boolean;
    onToggleClienteVisibility: () => void;
    showChart: boolean;
    onShowChart: () => void;
    onHideChart: () => void;
    kpi?: any;
    loading?: boolean;
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const fmtInt = (n: any) => new Intl.NumberFormat("it-IT").format(Number(n ?? 0));
const fmtPct = (n: any) => `${Math.round(Number(n ?? 0))}%`;
const BID_PASSIVO_CLIENT_PLACEHOLDER = "__BID_PASSIVO_CLIENT_PLACEHOLDER__";


// ——————————————————————————————————————————————————————————
// COMPONENT
// ——————————————————————————————————————————————————————————
export function PannelloTopCustomer({
    mese,
    isClienteHidden,
    onToggleClienteVisibility,
    showChart,
    onShowChart,
    onHideChart,
    kpi,
    loading,
}: PannelloTopCustomerProps) {
    const [topN, setTopN] = useState<number>(10);

    const customer = kpi?.customer ?? null;
    const isPlaceholderCustomer = customer?.code === BID_PASSIVO_CLIENT_PLACEHOLDER;

    const label =
        (isPlaceholderCustomer ? "Cliente non ancora registrato" : customer?.label) ??
        (customer?.code ? `${customer.code}${customer?.name ? " | " + customer.name : ""}` : "—");

    const trend = (customer?.trendPct ?? null) as number | null;

    const isUp = typeof trend === "number" ? trend >= 0 : true;
    const trendText = trend === null ? "100" : fmtPct(Math.abs(trend));

    const quotations = Number(customer?.quotations ?? 0);
    const okQuotations = Number(customer?.okQuotations ?? 0);
    const maxValue = Number(customer?.maxValue ?? 0);
    const avgValue = Number(customer?.avgValue ?? 0);

    const topIcon = topN === 10 ? TbNumber10({}) : topN === 5 ? TbNumber5({}) : TbNumber3({});

    const cycleTopN = () => {
        setTopN((prev) => (prev === 10 ? 5 : prev === 5 ? 3 : 10));
    };

    const chartData = useMemo(() => {
        const arr = Array.isArray(kpi?.topCustomers) ? kpi.topCustomers : [];

        const mapped = arr.map((c: any) => {
            const code = String(c?.code ?? "—");
            const isPlaceholder = code === BID_PASSIVO_CLIENT_PLACEHOLDER;
            const q = Number(c?.quotations ?? 0);
            const tv = Number(c?.totalValue ?? 0);

            return {
                // Se il KPI restituisce il placeholder tecnico, mostriamo
                // una label business leggibile in chart.
                label: `${isPlaceholder ? "Cliente non ancora registrato" : code} • ${fmtInt(q)} quot.`,
                // la barra rappresenta il valore totale
                value: tv,
            };
        });

        return mapped.slice(0, topN);
    }, [kpi, topN]);

    const CmpHeader = ({ hideTopRank }: { hideTopRank: boolean }) => {
        return <div className="flex items-center justify-between">
            <h1 className="text-sm">Cliente più quotato ({mese})</h1>
            <div className="flex items-center gap-1">
                {!hideTopRank && <FDIconButton
                    size="small"
                    icon={topIcon}
                    variant="secondary"
                    onClick={cycleTopN}
                    dataTooltipId="general-quotations-tooltip"
                    dataTooltipContent={`Top ${topN}`}
                />}
                <FDIconButton
                    size="small"
                    icon={isClienteHidden ? BiShow({}) : BiHide({})}
                    variant="secondary"
                    onClick={onToggleClienteVisibility}
                    dataTooltipId="general-quotations-tooltip"
                    dataTooltipContent={isClienteHidden ? "Mostra Pannelli" : "Nascondi Pannelli"}
                />
                <FDIconButton
                    size="small"
                    icon={<FaRegChartBarIcon />}
                    variant="secondary"
                    onClick={!hideTopRank ? onHideChart : onShowChart}
                    dataTooltipId="general-quotations-tooltip"
                    dataTooltipContent={hideTopRank ? "Vedi Grafico" : "Torna Indietro"}
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
                    className={`col-start-1 row-start-1 flex flex-col overflow-hidden`}
                    style={{ backfaceVisibility: "hidden", pointerEvents: showChart ? "none" : "auto" }}
                >
                    <CmpHeader hideTopRank={true} />

                    <div className={`flex flex-col h-full overflow-hidden ${isClienteHidden && "max-h-[0px]"}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400">Cod. Cliente | Ragione Sociale:</span>
                                <span className="font-bold text-lg">{loading ? "…" : label}</span>
                            </div>
                            <span
                                data-tooltip-id="general-quotations-tooltip"
                                data-tooltip-content="Valore % rispetto al mese precedente"
                                className={`flex cursor-default items-center border border-solid rounded-xl px-2 py-1 text-sm ${isUp
                                    ? "border-emerald-400 bg-emerald-500/40 text-emerald-700 dark:text-emerald-200"
                                    : "border-red-400 bg-red-500/40 text-red-700 dark:text-red-200"
                                    }`}
                            >
                                {isUp ? <LineUp className="mr-1.5" /> : <LineDown className="mr-1.5" />}
                                {loading ? "…" : trendText}
                            </span>
                        </div>

                        <div className="text-xs mt-auto">
                            <ul>
                                <li>
                                    Quotazioni ultimi 31gg: <span className="font-bold">{loading ? "…" : fmtInt(quotations)}</span>
                                </li>
                                <li>
                                    Convertite in FB: <span className="font-bold">{loading ? "…" : fmtInt(okQuotations)}</span>
                                </li>
                                <li>
                                    Valore massimo: <span className="font-bold">{loading ? "…" : NumberToEuro({ convert: maxValue })}</span>
                                </li>
                                <li>
                                    Valore medio: <span className="font-bold">{loading ? "…" : NumberToEuro({ convert: avgValue })}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div
                    className={`col-start-1 row-start-1 flex flex-col overflow-hidden`}
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        pointerEvents: showChart ? "auto" : "none",
                    }}
                >
                    <CmpHeader hideTopRank={false} />

                    <div className={`overflow-hidden ${isClienteHidden && "max-h-[0px]"}`}>
                        <BarChart
                            data={chartData}
                            valueFormatter={(v) => NumberToEuro({ convert: v })}
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default PannelloTopCustomer;