import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiTrendingUp, FiTrendingDown, FiShuffle, FiUserCheck, FiRefreshCcw, FiAlertTriangle
} from "react-icons/fi";
// Se nel tuo progetto esiste:
import { UserContext } from "context/UserContext"; // <-- usa il tuo
import { ProductsToEditAPI } from "../fetchData/CompareData";
import FDBox from "components/UI/box/FDBox";
import { useNavigate } from "react-router-dom";

const FiTrendingUpIcon = FiTrendingUp as React.FC<{ className?: string }>;
const FiTrendingDownIcon = FiTrendingDown as React.FC<{ className?: string }>;
const FiShuffleIcon = FiShuffle as React.FC<{ className?: string }>;
const FiUserCheckIcon = FiUserCheck as React.FC<{ className?: string }>;
const FiRefreshCcwIcon = FiRefreshCcw as React.FC<{ className?: string }>;
const FiAlertTriangleIcon = FiAlertTriangle as React.FC<{ className?: string }>;

type CompareStats = {
    highter: number;   // Focelda più ALTO
    lower: number;     // Focelda più BASSO
    exclution: number; // Totale esclusi
    totale: number;    // Totale assegnati
};

type Props = {
    // opzionale: override dei link
    links?: {
        highter?: string;
        lower?: string;
        exclution?: string;
        totale?: string;
    };
    className?: string;
};

const nf = new Intl.NumberFormat("it-IT");

function useCompareStats() {
    const [userContext] = React.useContext<any>(UserContext) ?? [];
    const [data, setData] = React.useState<CompareStats | null>(null);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);

    // Teniamo l'ultimo fetch attivo per abortire quello precedente
    const acRef = React.useRef<AbortController | null>(null);
    const mountedRef = React.useRef(true);

    React.useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const refetch = React.useCallback(() => {
        if (loading) return; // evita refetch multipli
        // abortisce eventuale richiesta precedente
        acRef.current?.abort();
        const ac = new AbortController();
        acRef.current = ac;

        setLoading(true);
        setError(null);

        ProductsToEditAPI({
            abortController: { current: ac },
            HandleComplete: (res: CompareStats) => {
                if (ac.signal.aborted || !mountedRef.current) return; // no-op se abort/unmount
                const mapped: CompareStats = {
                    highter: res.highter ?? 0,
                    lower: res.lower ?? 0,
                    exclution: res.exclution ?? 0,
                    totale: res.totale ?? 0,
                };
                setData(mapped);
                setLoading(false);
            },
            HandleError: (msg: string) => {
                if (ac.signal.aborted || !mountedRef.current) return;
                setError(msg);
                setLoading(false);
            },
        });
    }, [userContext]);

    // Auto-fetch al mount / al cambio utente
    React.useEffect(() => {
        refetch();
        return () => {
            acRef.current?.abort();
        };
    }, [refetch]);

    return { data, loading, error, refetch };
}

const Stat: React.FC<{
    title: string;
    subtitle: string;
    value?: number | null;
    icon: React.ReactNode;
    href?: string;
    accent?: "emerald" | "amber" | "violet" | "sky";
    loading?: boolean;
}> = ({ title, subtitle, value, icon, href, accent = "emerald", loading }) => {
    const navigate = useNavigate();

    const acc = {
        emerald: "from-emerald-400/15 to-emerald-500/10 ring-emerald-400/30",
        amber: "from-amber-400/15   to-amber-500/10   ring-amber-400/30",
        violet: "from-violet-400/15  to-violet-500/10  ring-violet-400/30",
        sky: "from-sky-400/15     to-sky-500/10     ring-sky-400/30",
    }[accent];

    const content = (
        <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${acc} ring-1 ring-inset p-3 shadow-sm backdrop-blur h-full`}>
            <div className="flex items-center gap-2 text-xs text-neutral-400 flex-wrap">
                <span className="dark:text-neutral-300 text-gray-600">{title}</span>
                {/* <span className="opacity-60">·</span> */}
                <span>{subtitle}</span>
            </div>
            <div className="mt-2 flex items-end justify-between flex-wrap">
                <div className="text-3xl font-semibold text-gray-700 dark:text-neutral-50 tabular-nums">
                    {loading ? (
                        <span className="inline-block h-7 w-20 animate-pulse rounded dark:bg-white/10 bg-black/10" />
                    ) : (
                        nf.format(value ?? 0)
                    )}
                </div>
                <div className="dark:text-neutral-300 text-gray-600 opacity-90">{icon}</div>
            </div>
        </div>
    );

    return <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={() => href && navigate(href)}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-2xl cursor-pointer">
        {content}
    </motion.div>
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
const CompareStatsWidget: React.FC<Props> = ({ links }) => {
    const { data, loading, error, refetch } = useCompareStats();

    // UserContext serve per capire se l'utente (admin) ha anche un buyerCode.
    // In quel caso, quando entra nel comparatore *dal widget*, vogliamo inizializzare la tabella
    // filtrando sui prodotti del suo buyer (via parametro `byid` in URL).
    const [userContext] = React.useContext<any>(UserContext) ?? [];

    // `byid` in URL deve essere scritto SOLO dal widget.
    // Serve esclusivamente a inizializzare il comparatore con il filtro buyer al primo ingresso.
    // L'utente può rimuovere la limitazione tramite "Reset tabella", che toglie `byid` dall'URL e ricarica globale.
    // Nota: i "filtri admin" NON devono scrivere `byid` nell'URL (impersonificazione temporanea UI).
    const buildCompareHref = React.useCallback(
        (rawHref: string) => {
            const url = new URL(rawHref, window.location.origin);

            // Coerenza con quanto fatto nel comparatore:
            // "entra come buyer dai widget" SOLO se l'utente ha buyerCode
            // (vale per buyer role=2 e per admin/dev con buyerCode).
            const buyerCode =
                userContext?.details?.buyerCode ??
                userContext?.details?.codici?.buyer ??
                null;

            if (buyerCode) {
                url.searchParams.set("widget", "true");
            }

            return url.pathname + url.search;
        },
        [
            userContext?.details?._id,
            userContext?.details?.id,
            userContext?.details?.buyerCode,
            userContext?.details?.codici?.buyer,
        ]
    );


    return (
        <FDBox
            variant="ghost"
            pad="md"
            aria-busy={loading}
            aria-live="polite"
            className="h-full"
        >
            {/* Header */}
            {!error && <div className="mb-3 flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold dark:text-neutral-100 text-neutral-800">Articoli da Modificare</div>
                    <div className="text-xs text-neutral-400">Panoramica per buyer</div>
                </div>
                <button
                    onClick={refetch}
                    disabled={loading}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs border 
                    disabled:opacity-40 disabled:cursor-not-allowed
                    border-black/20 dark:border-white/10 curosor-pointer
                    text-grey-300 dark:text-neutral-300 hover:bg-black/5"
                    data-tooltip-id="general-dashboard-tooltip"
                    data-tooltip-content="Aggiorna le statistiche"
                >
                    <FiRefreshCcwIcon className="opacity-80" />
                    <span className="hidden sm:block">Aggiorna</span>
                </button>
            </div>}

            {/* Error */}
            <AnimatePresence>{error && <ErrorState message={error} onRetry={refetch} loading={loading} />}</AnimatePresence>

            {/* Grid 2x2 */}
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Stat
                    title="Focelda"
                    subtitle="più ALTO dei fornitori"
                    value={data?.highter}
                    icon={<FiTrendingUpIcon />}
                    accent="emerald"
                    href={buildCompareHref(links?.highter ?? "/acquisti/comparatore?skip=0&disp=1&dfcat=0&dfval=0.1")}
                    loading={loading || !data}
                />
                <Stat
                    title="Focelda"
                    subtitle="più BASSO dei fornitori"
                    value={data?.lower}
                    icon={<FiTrendingDownIcon />}
                    accent="amber"
                    href={buildCompareHref(links?.lower ?? "/acquisti/comparatore?skip=0&disp=1&dfcat=0&dfval=-0.1")}
                    loading={loading || !data}
                />
                <Stat
                    title="Esclusi"
                    subtitle="Totale eccezioni"
                    value={data?.exclution}
                    icon={<FiShuffleIcon />}
                    accent="violet"
                    href={buildCompareHref(links?.exclution ?? "/acquisti/comparatore")}
                    loading={loading || !data}
                />
                <Stat
                    title="Assegnati"
                    subtitle="Articoli totali"
                    value={data?.totale}
                    icon={<FiUserCheckIcon />}
                    accent="sky"
                    href={buildCompareHref(links?.totale ?? "/acquisti/comparatore")}
                    loading={loading || !data}
                />
            </div>
        </FDBox>
    );
};

export default React.memo(CompareStatsWidget);
