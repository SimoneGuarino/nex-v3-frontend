import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTrendingUp, FiTrendingDown, FiRefreshCcw, FiAlertTriangle } from "react-icons/fi";
import { UserContext } from "context/UserContext";

// usa la stessa funzione che già adoperi nel dashboard classico
import { BuyersDataAPI } from "../fetchData/BuyersData";

const FiTrendingUpIcon = FiTrendingUp as React.FC<{ className?: string }>;
const FiTrendingDownIcon = FiTrendingDown as React.FC<{ className?: string }>;
const FiRefreshCcwIcon = FiRefreshCcw as React.FC<{ className?: string }>;
const FiAlertTriangleIcon = FiAlertTriangle as React.FC<{ className?: string }>;

type BuyerRow = {
  buyer: string;
  fatturatoTrimestreAttuale: number;
  fatturatoTrimestrePrecedente: number;
  stock: number;
  backorder: number;
  ocfb: number;
};

type OrderKey = "growth" | "backorder" | "ocfb";

const nfi = new Intl.NumberFormat("it-IT");
const eur0 = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function growthPct(now: number, prev: number) {
  if (!prev) return now > 0 ? 100 : 0;
  return ((now - prev) / Math.abs(prev)) * 100;
}

/* ----- data hook (cache+abort, stile Compare/Stocks) ----- */
function useBuyers() {
  const [userContext] = React.useContext<any>(UserContext) ?? [];
  const [rows, setRows] = React.useState<BuyerRow[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const acRef = React.useRef<AbortController | null>(null);

  const refetch = React.useCallback(() => {
    acRef.current?.abort();
    acRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      BuyersDataAPI({
        abortController: acRef,
        HandleComplete: (data: BuyerRow[]) => { setRows(data || []); setLoading(false); },
        HandleError: (msg?: string) => { setError(msg || "Errore inatteso"); setLoading(false); },
      });
    } catch (e: any) {
      setError(e?.message || "Errore inatteso");
      setLoading(false);
    }
  }, [userContext]);

  React.useEffect(() => { refetch(); return () => acRef.current?.abort(); }, [refetch]);

  return { rows: rows ?? [], loading, error, refetch };
}

/* ----- tiny bar chart (SVG) ----- */
const TinyBars: React.FC<{ values: number[]; activeIndex?: number }> = ({ values, activeIndex }) => {
  const max = Math.max(1, ...values);
  const W = 160, H = 56, gap = 10, barW = (W - gap * (values.length - 1)) / values.length;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {values.map((v, i) => {
        const h = (v / max) * (H - 8);
        const x = i * (barW + gap);
        const y = H - h;
        const active = i === activeIndex;
        return (
          <g key={i} transform={`translate(${x},0)`}>
            <rect x={0} y={y} width={barW} height={h} rx={8}
              className={active ? "fill-violet-400/60" : "fill-white/15"} />
            <rect x={0} y={y} width={barW} height={h} rx={8}
              className={active ? "stroke-violet-300/70" : "stroke-white/10"} fill="none" />
          </g>
        );
      })}
    </svg>
  );
};

/* ----- chip + skeleton + error ----- */
const SegButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
      active ? "bg-white/10 text-neutral-100" : "text-neutral-300 hover:bg-white/5"
    }`}
  >
    {children}
  </button>
);

const SkeletonBlock: React.FC = () => (
  <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-3">
    <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
    <div className="mt-3 h-10 w-28 animate-pulse rounded bg-white/10" />
    <div className="mt-4 h-12 w-full animate-pulse rounded bg-white/10" />
  </div>
);

const ErrorCard: React.FC<{ msg: string; onRetry: () => void }> = ({ msg, onRetry }) => (
  <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
    <div className="flex items-center gap-2">
      <FiAlertTriangleIcon />
      <div className="flex-1">
        <div className="font-medium">Impossibile caricare i dati</div>
        <div className="text-xs opacity-80">{msg}</div>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1 rounded-md border border-red-400/40 bg-red-400/10 px-2 py-1 text-xs text-red-100 hover:bg-red-400/20"
      >
        <FiRefreshCcwIcon /> Riprova
      </button>
    </div>
  </div>
);

/* ----- Widget principale ----- */
const BuyersPulseWidget: React.FC = () => {
  const { rows, loading, error, refetch } = useBuyers();
  const [metric, setMetric] = React.useState<OrderKey>("growth");

  const enhanced = React.useMemo(() => {
    return rows.map(r => ({
      ...r,
      growth: growthPct(r.fatturatoTrimestreAttuale, r.fatturatoTrimestrePrecedente),
    }));
  }, [rows]);

  // KPI aggregati
  const totalNow = React.useMemo(
    () => enhanced.reduce((s, r) => s + (r.fatturatoTrimestreAttuale || 0), 0),
    [enhanced]
  );
  const totalPrev = React.useMemo(
    () => enhanced.reduce((s, r) => s + (r.fatturatoTrimestrePrecedente || 0), 0),
    [enhanced]
  );
  const deltaPct = growthPct(totalNow, totalPrev);

  // Top 4 buyers per metrica selezionata
  const top4 = React.useMemo(() => {
    const clone = [...enhanced];
    if (metric === "growth") clone.sort((a,b)=> (b.growth ?? 0) - (a.growth ?? 0));
    else if (metric === "backorder") clone.sort((a,b)=> (b.backorder ?? 0) - (a.backorder ?? 0));
    else clone.sort((a,b)=> (a.ocfb ?? 0) - (b.ocfb ?? 0));
    return clone.slice(0,4);
  }, [enhanced, metric]);

  const bars = React.useMemo(() => top4.map(r => {
    if (metric === "growth") return Math.max(0, r.growth || 0);
    if (metric === "backorder") return r.backorder || 0;
    return r.ocfb || 0 ? 1 / (r.ocfb || 1) : 0.0001; // invertiamo per avere barre “alte = meglio”
  }), [top4, metric]);

  return (
    <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-4 shadow-xl backdrop-blur">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-neutral-100">Andamento Buyers</div>
          <div className="text-xs text-neutral-400">Snapshot sintetico</div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/5 p-0.5">
          <SegButton active={metric==="growth"} onClick={()=>setMetric("growth")}>Crescita</SegButton>
          <SegButton active={metric==="backorder"} onClick={()=>setMetric("backorder")}>Backorder</SegButton>
          <SegButton active={metric==="ocfb"} onClick={()=>setMetric("ocfb")}>OC/FB</SegButton>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>{error && <ErrorCard msg={error} onRetry={refetch} />}</AnimatePresence>

      {/* Corpo */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <SkeletonBlock/><SkeletonBlock/><SkeletonBlock/>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* KPI principale */}
          <motion.div whileHover={{ y:-2 }} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-4 ring-1 ring-inset ring-white/10">
            <div className="text-xs text-neutral-400">Fatturato Trimestre</div>
            <div className="mt-1 text-4xl font-semibold text-neutral-50">{eur0.format(totalNow)}</div>
            <div className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs
              ${deltaPct>=0 ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
              {deltaPct>=0 ? <FiTrendingUpIcon/> : <FiTrendingDownIcon/>}
              {deltaPct.toFixed(1)}%
              <span className="text-neutral-400">vs prec.</span>
            </div>

            <div className="mt-4">
              <TinyBars values={bars} activeIndex={0}/>
              <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-neutral-400">
                {top4.map((r,i)=>(
                  <div key={r.buyer} className="truncate">{r.buyer}</div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Top buyers (2 colonne) */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {top4.map((r,i)=>(
              <motion.div key={r.buyer} whileHover={{ y:-2 }}
                className="rounded-2xl border border-white/10 bg-neutral-900/60 p-3 ring-1 ring-inset ring-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-xl bg-white/10 text-[11px] text-neutral-300">{r.buyer.slice(0,2)}</div>
                    <div className="truncate text-sm text-neutral-100">{r.buyer}</div>
                  </div>
                  <div className="text-sm text-neutral-200">
                    {metric==="growth" && <span className={ (r.growth??0)>=0 ? "text-emerald-300" : "text-amber-300"}>{(r.growth??0).toFixed(1)}%</span>}
                    {metric==="backorder" && nfi.format(r.backorder||0)}
                    {metric==="ocfb" && nfi.format(r.ocfb||0)}
                  </div>
                </div>
                <div className="mt-2">
                  {/* mini barra rapporto Attuale/Prec */}
                  <div className="h-2 w-full overflow-hidden rounded bg-white/10">
                    <div className="h-2 bg-sky-400/60" style={{
                      width: `${Math.min(100, Math.round(
                        (r.fatturatoTrimestreAttuale / Math.max(1, r.fatturatoTrimestreAttuale + r.fatturatoTrimestrePrecedente))*100))}%`
                    }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
                    <span>Att: {nfi.format(r.fatturatoTrimestreAttuale)}</span>
                    <span>Prec: {nfi.format(r.fatturatoTrimestrePrecedente)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(BuyersPulseWidget);