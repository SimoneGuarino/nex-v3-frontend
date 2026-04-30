import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { format, startOfYear } from "date-fns";

import {
    AdminSeriesDataAPI,
    Granularity,
    type AdminSeriesResponse,
    type CompareMode,
    type Dimension,
} from "./fetchdata/admin/series";
import { AgentsSeriesDataAPI } from "./fetchdata/agents/series";
import {
    AdminBreakdownDataAPI,
    type AdminBreakdownResponse,
} from "./fetchdata/admin/breakdown";
import {
    AgentsBreakdownDataAPI,
    type AgentsBreakdownResponse,
} from "./fetchdata/agents/breakdown";
import { AdminExportDataAPI } from "./fetchdata/admin/export";
import { AgentsExportDataAPI } from "./fetchdata/agents/export";

import LineChart, { type LineChartPublicStats } from "./components/charts/LineChart";
import BreakdownBarChart, { type BreakdownTotals } from "./components/charts/BarChart";
import TopBar from "./components/TopBar";

import { useUserContext } from "context/UserContext";

import { Tooltip } from "react-tooltip";
import type { FDSelectOption } from "components/UI/input/FDSelect";

import { CheckAdminPermissions } from "utils/checkAdminPermissions";

import type { BrandFiltersOut } from "./components/BrandsPanel";

import TablePanel from "./components/TablePanel";
import StatsPanels from "./components/StatsPanels";
//tour
import { useSectionTour } from "tour/useSectionTour";
import { Role } from "tour/types";
import { ChangeLoadStatusArgs, LoadStatus } from "./types/load";
import { CustomerOption } from "types/customers";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type SysInfo = "FOCELDA" | "ADJ";
type Mode = "admin" | "agent";


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const COMPARE_OPTIONS: FDSelectOption[] = [
    { value: "none", label: "nessuno" },
    { value: "yoy", label: "anno su anno" },
    { value: "custom", label: "intervallo personalizzato" },
];

const SYSINFO_OPTIONS: FDSelectOption[] = [
    { value: "FOCELDA", label: "FOCELDA" },
    { value: "ADJ", label: "ADJ" },
];

const VALID_DIMENSIONS: Dimension[] = [
    "AGENT",
    "CLIENT",
    "CAPO",
    "CNV",
    "BUY",
    "PRF",
    "LIP",
    "GRU",
    "FAM",
    "ARG",
];

const PANEL_KEY = "fatturati";
const BREAKDOWN_PAGE_SIZE = 50;


/**
 * Risolve l'etichetta del ruolo a partire dal valore (numero/stringa) usando la mappa in env
 * @param rawRole
 * @returns
 */
function resolveRoleLabel(rawRole: unknown): string {
    try {
        const map = JSON.parse(
            String(import.meta.env.VITE_ROLES || "{}")
        ) as Record<string, string>;

        if (typeof rawRole === "number") return map[String(rawRole)] ?? String(rawRole);

        if (typeof rawRole === "string") {
            const n = Number(rawRole);
            if (!Number.isNaN(n) && map[String(n)]) return map[String(n)];
            return rawRole;
        }
    } catch {
    }
    return "";
};

/**
 * Verifica se l'utente può impersonare (modalità admin) per il pannello corrente
 * @param userState
 * @returns
 */
function canImpersonateForPanel(userState: any): boolean {
    const roleLabel = resolveRoleLabel(userState?.details?.ruolo);
    const permissions = userState?.details?.permissions;

    const hasPanelAdmin = CheckAdminPermissions({
        userRole: roleLabel,
        permissions,
        panelToCheck: PANEL_KEY,
        where: 0,
    });

    return (
        hasPanelAdmin ||
        roleLabel === "Amministrativo" ||
        roleLabel === "Admin" ||
        roleLabel === "Dev"
    );
};

/**
 * Determina la modalità (admin/agent) in base a ruolo e permessi
 * @param userState
 * @returns
 */
function pickMode(userState: any): Mode {
    return canImpersonateForPanel(userState)
        ? "admin"
        : resolveRoleLabel(userState?.details?.ruolo) === "Commerciale"
            ? "agent"
            : "admin";
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Pagina Fatturati: gestisce filtri, fetch serie temporale, breakdown, export e visualizzazione
 * @returns
 */
export function Fatturati() {
    const [userState] = useUserContext();
    const [userContext] = useUserContext() as any;

    const today = new Date();
    const defaultFrom = format(startOfYear(today), "yyyy-MM-dd");
    const defaultTo = format(today, "yyyy-MM-dd");

    const searchParams = useMemo(() => {
        if (typeof window === "undefined") return new URLSearchParams("");
        return new URLSearchParams(window.location.search);
    }, []);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const sysInfoParam = searchParams.get("sysInfo") as SysInfo | null;
    const dimensionParamRaw = searchParams.get("dimension");
    const cliParam = searchParams.get("CLI");

    const initialDimension: Dimension =
        dimensionParamRaw && VALID_DIMENSIONS.includes(dimensionParamRaw as Dimension)
            ? (dimensionParamRaw as Dimension)
            : "AGENT";

    const initialSysInfo: SysInfo | string =
        sysInfoParam && (sysInfoParam === "FOCELDA" || sysInfoParam === "ADJ")
            ? sysInfoParam
            : "FOCELDA";

    const initialCliFilter: CustomerOption[] = cliParam ? [{ codiceCliente: cliParam, ragioneSociale: cliParam }] : [];

    const [from, setFrom] = useState<string>(fromParam || defaultFrom); //date applicate (BE + grafici)
    const [to, setTo] = useState<string>(toParam || defaultTo); //date applicate (BE + grafici)
    const [granularity, setGranularity] = useState<Granularity>("month"); //granularità serie

    const [compareMode, setCompareMode] = useState<CompareMode>("none"); //modalità confronto applicata
    const [compareFrom, setCompareFrom] = useState<string>(""); //inizio confronto custom applicato
    const [compareTo, setCompareTo] = useState<string>(""); //fine confronto custom applicato

    const [uiFrom, setUiFrom] = useState<string>(fromParam || defaultFrom); //date UI (bozza)
    const [uiTo, setUiTo] = useState<string>(toParam || defaultTo); //date UI (bozza)
    const [uiCompareMode, setUiCompareMode] = useState<CompareMode>("none"); //modalità confronto UI (bozza)
    const [uiCompareFrom, setUiCompareFrom] = useState<string>(""); //inizio confronto custom UI
    const [uiCompareTo, setUiCompareTo] = useState<string>(""); //fine confronto custom UI

    const [capo, setCapo] = useState<string[]>([]); //Filtro cash and carry 
    const [cli, setCli] = useState<CustomerOption[]>(initialCliFilter); //Filtro clienti
    const [mag, setMag] = useState<string[]>([]); //Filtro magazzino
    const [cnv, setCnv] = useState<string[]>([]); //Filtro canale di vendita
    const [arg, setArg] = useState<string[]>([]); //Filtro area geografica
    const [cca, setCca] = useState<string[]>([]); //Filtro causale di vendita
    const [age, setAge] = useState<string[]>([]); //Filtro agente (ADMIN)
    const [buy, setBuy] = useState<string[]>([]); //Filtro buyer (ADMIN)
    const [brandFilters, setBrandFilters] = useState<BrandFiltersOut>({}); //filtri brand applicati

    const [sysInfo, setSysInfo] = useState<SysInfo | string>(initialSysInfo); //sorgente dati (FOCELDA | ADJ)
    const [dimension, setDimension] = useState<Dimension>(initialDimension); //dimensione breakdown/tab
    const [mode, setMode] = useState<Mode>("admin"); //modalità effettiva (admin/agent)

    const [data, setData] = useState<AdminSeriesResponse | null>(null); //risposta serie temporale
    const [breakdown, setBreakdown] = useState<
        AdminBreakdownResponse | AgentsBreakdownResponse | null
    >(null); //risposta breakdown

    /** Stato di caricamento per le serie temporali e il breakdown */
    const [seriesLoading, setSeriesLoading] = useState<boolean>(false); //loading serie
    const [breakdownLoading, setBreakdownLoading] = useState<boolean>(false); //loading breakdown
    /** load status (export + altre azioni che richiedono feedback) */
    const [loadStatus, setLoadStatus] = useState<LoadStatus>({
        export_data: false, // export CSV
    });
    /** Funzione per cambiare lo stato di caricamento */
    const ChangeLoadStatus = ({ from, bool }: ChangeLoadStatusArgs) => {
        setLoadStatus((prev: LoadStatus) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }));
    };

    //const [refreshKey, setRefreshKey] = useState(0); //chiave per forzare reload
    const [lineStats, setLineStats] = useState<LineChartPublicStats | null>(null); //statistiche esposte dal grafico
    const [showCharts, setShowCharts] = useState<boolean>(true); //toggle visibilità grafici

    //stati per le action del tour
    const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [ctxOpenFor, setCtxOpenFor] = useState(false);

    const canImpersonate = useMemo(() => canImpersonateForPanel(userState), [userState]); //stato per definire se l'utente puo impersonare un agente

    const roleLabel = useMemo(
        () => resolveRoleLabel(userState?.details?.ruolo),
        [userState?.details?.ruolo]
    );

    const isAgentOnly = useMemo(
        () => roleLabel === "Commerciale" && !canImpersonate,
        [roleLabel, canImpersonate]
    );

    const effectiveDimension: Dimension = useMemo(() => {
        if (isAgentOnly && (dimension === "AGENT" || dimension === "BUY")) return "CLIENT";
        return dimension;
    }, [isAgentOnly, dimension]);


    const businessFilters = useMemo<Record<string, any>>(
        () => ({
            ...(capo.length ? { CAPO: capo } : {}),
            ...(cli.length ? { CLI: cli.map(c => c.codiceCliente) } : {}),
            ...(mag.length ? { MAG: mag } : {}),
            ...(cnv.length ? { CNV: cnv } : {}),
            ...(arg.length ? { ARG: arg } : {}),
            ...(cca.length ? { CCA: cca } : {}),
            ...(age.length ? { AGE: age } : {}),
            ...(buy.length ? { BUY: buy } : {}),
            ...(brandFilters.PRF?.length ? { PRF: brandFilters.PRF } : {}),
            ...(brandFilters.LIP?.length ? { LIP: brandFilters.LIP } : {}),
            ...(brandFilters.GRU?.length ? { GRU: brandFilters.GRU } : {}),
            ...(brandFilters.FAM?.length ? { FAM: brandFilters.FAM } : {}),
        }),
        [capo, cli, mag, cnv, arg, cca, age, buy, brandFilters]
    );

    /* TOUR SYSTEM  */
    // trick per aprire e chiudere il pannello filtri in base al ruolo commerciale o admin/amministrativo/dev
    // l'amministrativo ha uno step in più rispetto al commerciale perciò definisco i ruoli autorizzati
    // creo openFiltersStep e closeFiltersStep per gestire apertura e chiusura del pannello filtri in base al ruolo definito prima
    // chiamo openFiltersStep e closeFiltersStep direttamente dalle actions del tour
    const role = (userContext?.details?.ruolo as Role) ?? "Tester";
    const isAuthorized = role === "Admin" || role === "Dev" || role === "Amministrativo";
    const openFiltersStep = isAuthorized ? 8 : 7;
    const closeFiltersStep = isAuthorized ? 9 : 8;
    const openCtxStep = isAuthorized ? 17 : 16;
    const closeCtxStep = isAuthorized ? 16 : 17;

    const tour = useSectionTour({
        id: "nex_v2_fatturati",
        version: "2.0.0",
        user: {
            id: userContext?.details?._id ?? "",
            role: (userContext?.details?.ruolo as Role) ?? "Tester",
        },
        keys: "fatturati",
        actions: {
            2: () => { setCalendarMenuOpen(false); },
            3: () => { setCalendarMenuOpen(true); },
            4: () => { setCalendarMenuOpen(false); setFiltersOpen(false) },
            5: () => { setFiltersOpen(true) },
            [openFiltersStep]: () => { setFiltersOpen(true) },
            [closeFiltersStep]: () => { setFiltersOpen(false) },
            15: () => { setCtxOpenFor(false) },
            [openCtxStep]: () => { setCtxOpenFor(true) },
            [closeCtxStep]: () => { setCtxOpenFor(false) },
            18: () => { setCtxOpenFor(false) },
            // 6: () => setPreviewOpen(false),
            // 10: () => {
            //     const firstCategory = dataRef.current?.[0];
            //     const firstFile = firstCategory?.files?.[0] ?? null;

            //     if (firstCategory?.categoria) setPreviewCategoria(firstCategory.categoria);
            //     if (firstFile) setPreviewFile(firstFile);

            //     setPreviewOpen(true);
            // },
            // 11: () => setPreviewOpen(false),
        },
    });

    /**
     * Caricamento dati (serie + breakdown) in base ai filtri applicati
     * @param overrides Possibili override di granularità e dimensione
     * @return {Promise<void>} 
     */
    const loadData = useCallback(async (overrides?: {
        granularity?: Granularity;
        dimensionOverride?: Dimension;
        onlySeries?: boolean;
        // FIX BUG (doppio click su cerca per aggiornare i dati da intervallo date) 
        // Override dei parametri "applicati" (range + confronto) perché loadData viene chiamata nello stesso tick dei setState;
        // in React lo state non è immediatamente aggiornato, quindi senza override loadData leggerebbe ancora i valori precedenti "stale" (React applica i setState in modo asincrono).
        from?: string;
        to?: string;
        compareMode?: CompareMode;
        compareFrom?: string;
        compareTo?: string;
        // FIX BUG (Stesso problema di intervallo date->cerca: reset + loadData nello stesso tick)
        // Stessa logica applicata per intervallo date -> cerca
        sysInfo?: SysInfo | string;
        filters?: Record<string, any>;
    }) => {
        const ac = new AbortController();
        const onlySeries = overrides?.onlySeries === true;

        //setData(null);
        setLineStats(null);
        if (!onlySeries) setBreakdown(null);

        const m = pickMode(userState);
        setMode(m);

        const agentCode = String(userState?.details?.codici?.agente || "").toUpperCase();

        let dim: Dimension = overrides?.dimensionOverride ?? dimension;

        if (m === "agent" && (dim === "AGENT" || dim === "BUY")) {
            dim = "CLIENT";
        };

        if (dim !== dimension) {
            setDimension(dim);
        };

        const effectiveGran = overrides?.granularity ?? granularity;

        // Valori effettivi usati nelle chiamate API.
        // Se arrivano override (es. da "Cerca"), usiamo quelli; altrimenti lo stato attuale.
        const effectiveFrom = overrides?.from ?? from;
        const effectiveTo = overrides?.to ?? to;

        const effectiveCompareMode = overrides?.compareMode ?? compareMode;
        const effectiveCompareFrom = overrides?.compareFrom ?? compareFrom;
        const effectiveCompareTo = overrides?.compareTo ?? compareTo;

        const effectiveSysInfo = overrides?.sysInfo ?? sysInfo;
        const effectiveBusinessFilters = overrides?.filters ?? businessFilters;

        // Base params riutilizzabili per evitare duplicazioni.
        // In questo modo, se in futuro aggiungiamo/ritocchiamo un parametro del range, lo facciamo in un solo punto.
        // invece di aggiornare 10 fetch mano a mano, centralizziamo il range in 1 posto e poi nelle fetch cambiamo la riga params
        const seriesBaseParams = {
            from: effectiveFrom,
            to: effectiveTo,
            granularity: effectiveGran,
            compareMode: effectiveCompareMode,
            ...(effectiveCompareMode === "custom" && effectiveCompareFrom && effectiveCompareTo
                ? { compareFrom: effectiveCompareFrom, compareTo: effectiveCompareTo }
                : {}),
            sysInfo: effectiveSysInfo,
            dimension: dim,
            filters: effectiveBusinessFilters,
        };

        const breakdownBaseParams = {
            from: effectiveFrom,
            to: effectiveTo,
            sysInfo: effectiveSysInfo,
            dimension: dim,
            filters: effectiveBusinessFilters,
        };

        // La serie in modalità "agent" non passa dimension/filters (nel codice attuale),
        // quindi teniamo un params dedicato e minimale.
        const agentSeriesParams = {
            from: effectiveFrom,
            to: effectiveTo,
            granularity: effectiveGran,
            compareMode: effectiveCompareMode,
            ...(effectiveCompareMode === "custom" && effectiveCompareFrom && effectiveCompareTo
                ? { compareFrom: effectiveCompareFrom, compareTo: effectiveCompareTo }
                : {}),
            sysInfo: effectiveSysInfo,
        };


        if (m === "admin") {
            if (onlySeries) {
                console.log(" - only series");
                await AdminSeriesDataAPI({
                    userContext: userState,
                    abortController: ac,
                    params: seriesBaseParams,
                    setData: (res) => setData(res),
                    setStatus: (on) => setSeriesLoading(on),
                });
                return;
            }

            await Promise.all([
                AdminSeriesDataAPI({
                    userContext: userState,
                    abortController: ac,
                    params: seriesBaseParams,
                    setData: (res) => setData(res),
                    setStatus: (on) => setSeriesLoading(on),
                }),
                AdminBreakdownDataAPI({
                    userContext: userState,
                    abortController: ac,
                    params: {
                        ...breakdownBaseParams,
                        page: 1,
                        pageSize: BREAKDOWN_PAGE_SIZE,
                    },
                    setData: (res) => setBreakdown(res),
                    setStatus: (on) => setBreakdownLoading(on),
                }),
            ]);

            return;
        };

        const agentForBreakdown = agentCode || undefined;

        if (onlySeries) {
            await AgentsSeriesDataAPI({
                userContext: userState,
                abortController: ac,
                params: agentSeriesParams,
                setData: (res) => setData(res as AdminSeriesResponse),
                setStatus: (on) => setSeriesLoading(on),
            });
            return;
        }

        await Promise.all([
            AgentsSeriesDataAPI({
                userContext: userState,
                abortController: ac,
                params: agentSeriesParams,
                setData: (res) => setData(res as AdminSeriesResponse),
                setStatus: (on) => setSeriesLoading(on),
            }),
            AgentsBreakdownDataAPI({
                userContext: userState,
                abortController: ac,
                params: {
                    // usa effectiveFrom/effectiveTo (quindi 1 click su Cerca basta)
                    ...breakdownBaseParams,
                    agent: agentForBreakdown as string,
                },
                setData: (res) => setBreakdown(res),
                setStatus: (on) => setBreakdownLoading(on),
            }),
        ]);
    },
        [
            userState,
            from,
            to,
            granularity,
            compareMode,
            compareFrom,
            compareTo,
            sysInfo,
            dimension,
            businessFilters,
        ]
    );

    useEffect(() => {
        if (!userState?.token) return;
        loadData();
    }, [userState?.token]);

    const canLoad = useMemo(() => {
        if (!uiFrom || !uiTo || !sysInfo) return false;
        if (uiCompareMode === "custom") return !!uiCompareFrom && !!uiCompareTo;
        return true;
    }, [uiFrom, uiTo, sysInfo, uiCompareMode, uiCompareFrom, uiCompareTo]);

    /**
     * Prepara le serie per il grafico a linee, cioè estrae solo le serie (senza metadata)
     * e determina la granularità effettiva da passare al grafico
     * @returns {InputSeries[]}
     */
    const chartSeries = useMemo(() => data?.series ?? [], [data]);
    const chartGran = useMemo(
        () =>
            data?.granularity === "day" || data?.granularity === "month" || data?.granularity === "week"
                ? data.granularity
                : granularity,
        [data, granularity]
    );

    const agentCode = String(userState?.details?.codici?.agente || "").toUpperCase();

    const tabLabelMap: Record<Dimension, string> = {
        AGENT: "Agenti",
        CLIENT: "Clienti",
        CAPO: "Cash & Carry",
        CNV: "Canali",
        BUY: "Buyers",
        PRF: "Brand",
        LIP: "Linee",
        GRU: "Gruppi",
        FAM: "Famiglie",
        ARG: "Area geografica",
    };

    const currentTabLabel = tabLabelMap[effectiveDimension];

    const chartTitle = useMemo(() => {
        const range = `${format(new Date(from), "dd/MM/yyyy")} → ${format(new Date(to), "dd/MM/yyyy")}`;
        const dimSuffix = currentTabLabel ? ` • ${currentTabLabel}` : "";
        if (mode === "agent") {
            return `Fatturato (Agente${agentCode ? ` ${agentCode}` : ""})${dimSuffix} – ${range}`;
        }
        return `Fatturato (Tutti i commerciali)${dimSuffix} – ${range}`;
    }, [mode, from, to, agentCode, currentTabLabel]);

    const breakdownTitle = useMemo(() => {
        if (!currentTabLabel) return "Breakdown";
        return `Breakdown per ${currentTabLabel}`;
    }, [currentTabLabel]);


    // ——————————————————————————————————————————————————————————
    // FUNZIONI RESET
    // ——————————————————————————————————————————————————————————
    /** Reset UI dei filtri d'intervallo (cliccabile dal pannello intervallo "Reset") */
    const resetDatesUI = (t_?: Date, nextFrom?: string, nextTo?: string) => {
        const t = t_ || new Date();
        setUiFrom(nextFrom || format(startOfYear(t), "yyyy-MM-dd"));
        setUiTo(nextTo || format(t, "yyyy-MM-dd"));
        setUiCompareMode("none");
        setUiCompareFrom("");
        setUiCompareTo("");
    };

    /** Reset delle date applicate nei filtri d'intervallo */
    const resetDatesApplied = (t_?: Date, nextFrom?: string, nextTo?: string) => {
        const t = t_ || new Date();
        setFrom(nextFrom || format(startOfYear(t), "yyyy-MM-dd"));
        setTo(nextTo || format(t, "yyyy-MM-dd"));
        setCompareMode("none");
        setCompareFrom("");
        setCompareTo("");
    };

    /** Reset dei filtri business (contenuti all'interno della tab/pannello filtri) */
    const resetBusinessFilters = () => {
        setCapo([]);
        setCli([]);
        setMag([]);
        setCnv([]);
        setArg([]);
        setCca([]);
        setAge([]);
        setBuy([]);
        setBrandFilters({});
    };

    const resetAllFilters = () => {
        setSysInfo("FOCELDA");
        resetBusinessFilters();
    };

    /** Reset di tutti i filtri con reload dei dati */
    const resetAllAndReload = () => {
        const t = new Date();
        const nextFrom = format(startOfYear(t), "yyyy-MM-dd");
        const nextTo = format(t, "yyyy-MM-dd");

        // Reset applied range
        resetDatesUI(t, nextFrom, nextTo);
        resetDatesApplied(t, nextFrom, nextTo);
        resetAllFilters();

        // Override completo: evita qualsiasi valore "stale" (date + filtri + sysInfo)
        loadData({
            // date/compare reset (coerente con resetDatesApplied)
            from: nextFrom,
            to: nextTo,
            compareMode: "none",
            compareFrom: "",
            compareTo: "",
            // sysInfo + filtri business resettati
            sysInfo: "FOCELDA",
            filters: {},
        });
    };


    // ——————————————————————————————————————————————————————————
    // HANDLER
    // ——————————————————————————————————————————————————————————
    /**
     * Gestione toggle granularità grafico
     * @param next Granularity
     */
    const handleChartToggleGranularity = (next: Granularity) => {
        setGranularity(next);
        void loadData({ granularity: next, onlySeries: true });
    };

    const handleTabChange = (next: Dimension) => {
        if (isAgentOnly && (next === "AGENT" || next === "BUY")) return;
        if (next === dimension) return;
        setDimension(next);
        loadData({ dimensionOverride: next });
    };

    const applyFiltersAndSearch = () => {
        // "next" sono i valori scelti nella UI (bozza).
        // Li salviamo negli state applicati per coerenza dell'interfaccia,
        // ma passiamo anche gli override a loadData per evitare che la fetch legga lo stato "vecchio".
        const next = {
            from: uiFrom,
            to: uiTo,
            compareMode: uiCompareMode,
            compareFrom: uiCompareFrom,
            compareTo: uiCompareTo,
        };

        setFrom(next.from);
        setTo(next.to);
        setCompareMode(next.compareMode);
        setCompareFrom(next.compareFrom);
        setCompareTo(next.compareTo);

        // fondamentale: così la fetch usa subito i valori "next" al primo click.
        loadData(next);
    };

    /**
     * Gestione export CSV dei dati visualizzati
     * @returns void
     */
    const handleExport = () => {
        if (!breakdown) return;

        const ac = new AbortController();

        if (mode === "admin") {
            AdminExportDataAPI({
                userContext: userState,
                abortController: ac,
                params: {
                    from,
                    to,
                    sysInfo: String(sysInfo),
                    dimension,
                    filters: businessFilters,
                },
                setStatus: (on) => ChangeLoadStatus({ from: "export_data", bool: on }),
            });
            return;
        }

        const agentCodeExport = String(userState?.details?.codici?.agente || "").toUpperCase();
        if (!agentCodeExport) return;

        AgentsExportDataAPI({
            userContext: userState,
            abortController: ac,
            params: {
                from,
                to,
                sysInfo: String(sysInfo),
                agent: agentCodeExport,
                dimension,
                filters: businessFilters,
            },
            setStatus: (on) => ChangeLoadStatus({ from: "export_data", bool: on }),
        });
    };

    const canExport = useMemo(() => !!breakdown && !breakdownLoading, [breakdown, breakdownLoading]);

    const { filtersCount, filtersTooltip } = useMemo(() => {
        const labels: string[] = [];

        capo.forEach((value) => labels.push(`Capo: ${value}`));
        cli.forEach((value) => labels.push(`Cliente: ${value.ragioneSociale}`));
        mag.forEach((value) => labels.push(`Magazzino: ${value}`));
        cnv.forEach((value) => labels.push(`Canale: ${value}`));
        arg.forEach((value) => labels.push(`Arg: ${value}`));
        cca.forEach((value) => labels.push(`C&C: ${value}`));
        age.forEach((value) => labels.push(`Agente: ${value}`));
        buy.forEach((value) => labels.push(`Buyer: ${value}`));

        (brandFilters.PRF ?? []).forEach((value) => labels.push(`Brand: ${value}`));
        (brandFilters.LIP ?? []).forEach((value) => labels.push(`Linea: ${value}`));
        (brandFilters.GRU ?? []).forEach((value) => labels.push(`Gruppo: ${value}`));
        (brandFilters.FAM ?? []).forEach((value) => labels.push(`Famiglia: ${value}`));

        const count = labels.length;
        const tooltip = count
            ? `${count} filtr${count > 1 ? "i" : "o"} attiv${count > 1 ? "i" : "o"} - ${labels.join(", ")}`
            : "";

        return { filtersCount: count, filtersTooltip: tooltip };
    }, [capo, cli, mag, cnv, arg, cca, age, buy, brandFilters]);

    const breakdownTotals = useMemo<BreakdownTotals | null>(() => {
        const raw: any = (breakdown as any)?.totals;
        if (!raw) return null;
        return {
            qta: Number(raw.qta ?? raw.QTA ?? 0),
            revenue: Number(raw.revenue ?? raw.REVENUE ?? 0),
            profit: Number(raw.profit ?? raw.PROFIT ?? 0),
            marginPct: Number(raw.marginPct ?? raw.MARGINPCT ?? 0),
        };
    }, [breakdown]);


    // ——————————————————————————————————————————————————————————
    // RENDER
    // ——————————————————————————————————————————————————————————
    return (
        <DashboardLayout>
            <div className="w-full h-full flex flex-col gap-4 p-2">
                <TopBar
                    calendarMenuOpen={calendarMenuOpen}
                    setCalendarMenuOpen={setCalendarMenuOpen}
                    filtersOpen={filtersOpen}
                    setFiltersOpen={setFiltersOpen}
                    dimension={effectiveDimension}
                    onChangeDimension={handleTabChange}
                    canImpersonate={canImpersonate}
                    loading={seriesLoading || breakdownLoading}
                    loadStatus={loadStatus}
                    canLoad={canLoad}
                    onSearch={applyFiltersAndSearch}
                    canExport={canExport}
                    onExport={handleExport}
                    from={uiFrom}
                    to={uiTo}
                    compareMode={uiCompareMode}
                    compareFrom={uiCompareFrom}
                    compareTo={uiCompareTo}
                    setRange={(v) => {
                        if (typeof v.from === "string") setUiFrom(v.from || "");
                        if (typeof v.to === "string") setUiTo(v.to || "");
                    }}
                    setCompareMode={(m) => setUiCompareMode(m)}
                    setCompareRange={(v) => {
                        setUiCompareFrom(v.from ?? "");
                        setUiCompareTo(v.to ?? "");
                    }}
                    compareOptions={COMPARE_OPTIONS}
                    onResetDates={resetDatesUI}
                    sysInfo={sysInfo as string} setSysInfo={(s) => setSysInfo(s)}

                    capo={capo} setCapo={setCapo}

                    cli={cli} setCli={setCli}

                    mag={mag} setMag={setMag}
                    cnv={cnv} setCnv={setCnv}
                    arg={arg} setArg={setArg}
                    cca={cca} setCca={setCca}
                    age={age} setAge={setAge}
                    buy={buy} setBuy={setBuy}
                    brandFilters={brandFilters}
                    setBrandFilters={setBrandFilters}
                    sysInfoOptions={SYSINFO_OPTIONS}
                    onResetFilters={resetAllFilters}
                    onResetAllAndReload={resetAllAndReload}
                    hiddenDimensions={isAgentOnly ? ["AGENT", "BUY"] : []}
                    filtersCount={filtersCount}
                    filtersTooltip={filtersTooltip}
                />

                <StatsPanels
                    loading={seriesLoading || breakdownLoading}
                    data={data}
                    breakdownTotals={breakdownTotals}
                    lineStats={lineStats}
                    from={from}
                    to={to}
                    showCharts={showCharts}
                    onToggleCharts={() => setShowCharts((prev) => !prev)}
                />

                {showCharts && (
                    <div className="w-full flex flex-col lg:flex-row lg:flex-wrap gap-4">
                        <div className="flex-1 min-w-[320px] flex">
                            {(!data || seriesLoading) ? (
                                <div className="w-full h-full min-h-[350px] bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                            ) : (
                                <LineChart
                                    ctxOpenFor={ctxOpenFor}
                                    setCtxOpenFor={setCtxOpenFor}
                                    series={chartSeries}
                                    granularity={chartGran}
                                    title={chartTitle}
                                    valueType="currency"
                                    onToggleGranularity={handleChartToggleGranularity}
                                    from={from}
                                    to={to}
                                    compareMode={compareMode}
                                    compareFrom={compareFrom}
                                    compareTo={compareTo}
                                    onStatsChange={setLineStats}
                                />
                            )}
                        </div>

                        <div className="flex-1 min-w-[320px] flex">
                            {(!breakdown || breakdownLoading) ? (
                                <div className="w-full h-full min-h-[350px] bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                            ) : (
                                <BreakdownBarChart
                                    items={(breakdown as any).items}
                                    totals={(breakdown as any).totals}
                                    title={breakdownTitle}
                                    maxItems={20}
                                />
                            )}
                        </div>
                    </div>
                )}

                {(!breakdown || breakdownLoading) ? (
                    <div className="w-full h-full min-h-[350px] bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                ) : (
                    <TablePanel
                        breakdown={breakdown}
                        loading={breakdownLoading}
                        userState={userState}
                        mode={mode}
                        dimension={dimension}
                        sysInfo={String(sysInfo)}
                        from={from}
                        to={to}
                        businessFilters={businessFilters}
                    />
                )}
            </div>

            <Tooltip
                id="fatturati-tooltip"
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 999999,
                }}
            />
        </DashboardLayout>
    );
}

export default Fatturati;