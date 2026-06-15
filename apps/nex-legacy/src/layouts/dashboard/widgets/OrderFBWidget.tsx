import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiClock, FiXCircle, FiRefreshCcw, FiAlertTriangle } from "react-icons/fi";
import { FDBox } from "@nex/fd-ui";
import { UserContext } from "context/UserContext";

// 🔌 usa lo stesso stile di integrazione usato in index_v1.tsx
// (userContext, setState, abortRef, deleteFromLoadRef)
import { OrderFBAPI } from "../fetchData/OrderFB";

const FiClockIcon = FiClock as React.FC<{ className?: string }>;
const FiXCircleIcon = FiXCircle as React.FC<{ className?: string }>;
const FiRefreshCcwIcon = FiRefreshCcw as React.FC<{ className?: string }>;
const FiAlertTriangleIcon = FiAlertTriangle as React.FC<{ className?: string }>;

type FBStats = { pis: number; cnr: number }; // pis: prossimi 3gg, cnr: consegna non rispettata
type Props = {
    className?: string;
    // override delle destinazioni (se cambiano le route)
    links?: { pis?: string; cnr?: string };
};

const nf = new Intl.NumberFormat("it-IT");

function useOrderFB() {
    const [userContext] = React.useContext<any>(UserContext) ?? [];
    const [data, setData] = React.useState<FBStats | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // mantieni un solo fetch attivo
    const acRef = React.useRef<AbortController | null>(null);
    const mountedRef = React.useRef(true);
    React.useEffect(() => () => { mountedRef.current = false; }, []);

    const setFromApi = React.useCallback((res: any) => {
        // la tua API già restituisce { pis, cnr }; fallback a 0 se undefined
        const mapped: FBStats = {
            pis: Number(res?.pis ?? 0),
            cnr: Number(res?.cnr ?? 0),
        };
        if (!mountedRef.current) return;
        setData(mapped);
        setLoading(false);
    }, []);

    const refetch = React.useCallback(() => {
        if (loading) return;
        // aborta l’eventuale richiesta precedente
        acRef.current?.abort();
        acRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            OrderFBAPI({
                abortController: acRef, HandleComplete: (response: FBStats) => {
                    setFromApi(response);
                    setLoading(false);
                }, HandleError: (err: string) => {
                    setError(err);
                    setLoading(false);
                }
            });
            // in caso la funzione lanci errori sincroni:
        } catch (e: any) {
            setError(e?.message || "Errore inatteso");
            setLoading(false);
        }
    }, [userContext, loading, setFromApi]);

    React.useEffect(() => {
        refetch();
        return () => acRef.current?.abort();
    }, [userContext]);

    return { data, loading, error, refetch };
}

const StatCard: React.FC<{
    title: string;
    subtitle: string;
    value?: number | null;
    icon: React.ReactNode;
    accent?: "sky" | "rose";
    onClick?: () => void;
    loading?: boolean;
}> = ({ title, subtitle, value, icon, accent = "sky", onClick, loading }) => {
    const acc = {
        sky: "from-sky-400/15  to-sky-500/10  ring-sky-400/30",
        rose: "from-rose-400/15 to-rose-500/10 ring-rose-400/30",
    }[accent];

    const content = (
        <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${acc} ring-1 ring-inset p-3 shadow-sm backdrop-blur h-full`}>
            <div className="flex items-center gap-2 text-xs text-neutral-400 flex-wrap">
                <span className="dark:text-neutral-300 text-gray-700">{title}</span>
                {/* <span className="opacity-60">·</span> */}
                <span>{subtitle}</span>
            </div>
            <div className="mt-2 flex items-end justify-between flex-wrap">
                <div className="text-3xl font-semibold dark:text-neutral-50 text-gray-700 tabular-nums">
                    {loading ? (
                        <span className="inline-block h-7 w-20 animate-pulse rounded dark:bg-white/10 bg-black/10" />
                    ) : (
                        nf.format(value ?? 0)
                    )}
                </div>
                <div className="dark:text-neutral-300 text-gray-700 opacity-90">{icon}</div>
            </div>
        </div>
    );

    return (
        <motion.button
            type="button"
            onClick={onClick}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-2xl"
        >
            {content}
        </motion.button>
    );
};

const ErrorState: React.FC<{ message: string; onRetry: () => void; loading: boolean }> = ({ message, onRetry, loading }) => (
    <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm dark:text-red-200 text-red-300">
        <div className="flex items-center gap-2">
            <FiAlertTriangleIcon className="shrink-0" />
            <div className="flex-1">
                <p className="font-medium">Impossibile caricare i dati FB</p>
                <p className="text-xs opacity-80">{message}</p>
            </div>
            <button
                disabled={loading}
                onClick={onRetry}
                className="inline-flex items-center gap-1 rounded-md border border-red-400/40 
                bg-red-400/10 px-2 py-1 text-xs text-red-400 dark:text-red-100 hover:bg-red-400/20"
            >
                <FiRefreshCcwIcon /> Riprova
            </button>
        </div>
    </div>
);

/** Widget principale */
const OrderFBWidget: React.FC<Props> = ({ className, links }) => {
    const { data, loading, error, refetch } = useOrderFB();
    const navigate = useNavigate();

    return (
        <FDBox variant="ghost" pad="md" aria-busy={loading} aria-live="polite" className={`h-full ${className ?? ""} overflow-y-auto`}>
            {/* Header */}
            {!error && <div className="mb-3 flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold dark:text-neutral-100 text-neutral-800">Ordini FB</div>
                    <div className="text-xs text-neutral-400">Controllo scadenze e consegne</div>
                </div>
                <button
                    onClick={refetch}
                    disabled={loading}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs border 
                    disabled:opacity-40 disabled:cursor-not-allowed
                    border-black/20 dark:border-white/10 text-gray-700 dark:text-neutral-300 hover:bg-black/5"
                    title="Aggiorna"
                >
                    <FiRefreshCcwIcon className="opacity-80" />
                    <span className="hidden sm:block">Aggiorna</span>
                </button>
            </div>}

            {/* Errore */}
            <AnimatePresence>{error && <ErrorState message={error} onRetry={refetch} loading={loading} />}</AnimatePresence>

            {/* Stat cards */}
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <StatCard
                    title="FB in scadenza"
                    subtitle="nei prossimi 3 giorni"
                    value={data?.pis}
                    icon={<FiClockIcon />}
                    accent="sky"
                    loading={loading || !data}
                    onClick={() => navigate(links?.pis ?? "/commerciale/fb")}
                />
                <StatCard
                    title="Consegna non rispettata"
                    subtitle="ordini FB"
                    value={data?.cnr}
                    icon={<FiXCircleIcon />}
                    accent="rose"
                    loading={loading || !data}
                    onClick={() => navigate(links?.cnr ?? "/commerciale/fb_cnr")}
                />
            </div>
        </FDBox>
    );
};

export default React.memo(OrderFBWidget);