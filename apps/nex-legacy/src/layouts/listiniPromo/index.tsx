// src/layouts/listiniPromo/index.tsx

import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from "react";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";
import { MdOutlineArrowForward } from "react-icons/md";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import { FDBox, FDButton, FDDate, FDSelect, type FDSelectOption } from "@nex/fd-ui";

import PromoProductCard from "./components/ProductCards";
import TopBar from "./components/TopBar";
import FiltersMenu from "./components/FiltersMenu";
import AdvancedSearch from "./components/AdvancedSearch";
import ProductDetailsPanel from "./components/ProductDetailsPanel";
import ProductTable from "./components/ProductTable";
import ViewMenu from "./components/ViewMenu";

import {
    fetchPromosList,
    type PromoListItem,
    type PromoListPeriod,
} from "./fetchdatas/promos/listData";
import {
    fetchPromoDetails,
    type PromoDetailsResponse,
    type PromoPeriod,
} from "./fetchdatas/promos/detailsData";
import { fetchPromoExportCsv } from "./fetchdatas/promos/exportCSV";
import { useUserContext } from "context/UserContext";
import { useSectionTour } from "tour/useSectionTour";
import { Role } from "tour/types";
import { useTour } from "tour/TourProvider";


const ForwardIcon = MdOutlineArrowForward as React.FC<{
    size?: number;
    className?: string;
}>;

const PAGE_SIZE = 20; //numero prodotti per pagina (paginazione BE)

// easing cubic-bezier (simile a ease-out)
const easeOutCurve = [0.25, 0.1, 0.25, 1] as const; //curva animazioni framer

// animazione griglia
const gridVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.35,
            ease: easeOutCurve,
            when: "beforeChildren",
            staggerChildren: 0.05,
            delayChildren: 0.02,
        },
    },
} as const; //varianti per animare l’entrata della griglia

const cardVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.25, ease: easeOutCurve },
    },
} as const; //varianti per animare l’entrata delle card


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Pagina Listini Promo:
 * 1) selezione periodo lista promo
 * 2) selezione promo e caricamento dettagli prodotti
 * 3) filtri (listino/prodotto) + export CSV
 * @returns
 */
export function ListiniPromo() {
    const listAbortController = useRef<AbortController | null>(null); //abort per fetch lista promo
    const detailsAbortController = useRef<AbortController | null>(null); //abort per fetch dettagli promo
    const exportAbortRef = useRef<AbortController | null>(null); //abort per export CSV

    // periodo “effettivo” usato per caricare i dettagli della promo corrente
    // (serve per evitare mismatch quando listPeriod=CUSTOM ma la promo è SCADUTA/FUTURA)
    const effectiveDetailsPeriodRef = useRef<PromoPeriod>("ATTUALI"); //periodo dettagli realmente usato

    // scrollable grid container (solo per vista griglia)
    const scrollContainerRef = useRef<HTMLDivElement | null>(null); //ref container scroll per infinite grid
    const endRef = useRef<HTMLDivElement | null>(null); //sentinel per IntersectionObserver
    const loadMoreLockRef = useRef(false); //lock per evitare loadMore multipli ravvicinati

    // navigation step
    const [step, setStep] = useState<"PERIOD" | "LIST">("PERIOD"); //step wizard: scelta periodo -> lista

    // lista promo
    const [promos, setPromos] = useState<PromoListItem[]>([]); //lista promo caricate
    const [loading, setLoading] = useState(false); //loading lista promo
    const [error, setError] = useState<string | null>(null); //errore lista promo

    // periodo per i dettagli (solo ATTUALI/SCADUTE/FUTURE)
    const [period, setPeriod] = useState<PromoPeriod | null>(null); //periodo usato per dettagli promo (UI/state)

    // periodo per lista promo
    const [listPeriod, setListPeriod] = useState<PromoListPeriod | null>(null); //periodo usato per listare promo
    const [listCustomFrom, setListCustomFrom] = useState<string>(""); //from custom (lista promo)
    const [listCustomTo, setListCustomTo] = useState<string>(""); //to custom (lista promo)

    // pending selection iniziale (schermata PERIOD)
    const [pendingListPeriod, setPendingListPeriod] =
        useState<PromoListPeriod | null>(null); //selezione non ancora confermata
    const [pendingCustomFrom, setPendingCustomFrom] = useState<string>(""); //from custom pending
    const [pendingCustomTo, setPendingCustomTo] = useState<string>(""); //to custom pending

    // promo selezionata
    const [selectedPromoCode, setSelectedPromoCode] = useState<string | undefined>(
        undefined
    ); //promo code selezionato

    // listino filter (UI)
    const [selectedListino, setSelectedListino] = useState<string[]>([]); //listini selezionati nel pannello filtri
    // listino applicato al BE
    const [appliedListino, setAppliedListino] = useState<string[] | undefined>(
        undefined
    ); //listini applicati alla fetch dettagli (undefined = nessun filtro)

    // cache globale dei listini disponibili per la promo/period corrente
    const [listinoOptionsCache, setListinoOptionsCache] = useState<
        FDSelectOption<string>[]
    >([]); //opzioni listino ricavate dai prodotti (cache)

    // dettagli promo
    const [promoDetails, setPromoDetails] =
        useState<PromoDetailsResponse | null>(null); //dettagli promo (prodotti + meta)
    const [detailsLoading, setDetailsLoading] = useState(false); //loading dettagli
    const [detailsError, setDetailsError] = useState<string | null>(null); //errore dettagli

    // UI espansa (dopo submit)
    const [expanded, setExpanded] = useState(false); //true quando mostro pannello dettagli + risultati

    // animation state
    const [hasAnimatedResults, setHasAnimatedResults] = useState(false); //evita replay animazione su re-render

    // filters panel
    const [filtersOpen, setFiltersOpen] = useState(false); //menu filtri aperto/chiuso
    const filterBtnRef = useRef<HTMLDivElement | null>(null); //anchor ref menu filtri

    // view menu (grid/list)
    const [sortOpen, setSortOpen] = useState(false); //menu view aperto/chiuso
    const sortBtnRef = useRef<HTMLDivElement | null>(null); //anchor ref menu view

    // stato del layout: grid | list
    const [view, setView] = useState<"grid" | "list">("grid"); //tipo vista risultati

    // prodotto da ricerca mirata
    const [targetProductCode, setTargetProductCode] = useState<string | null>(
        null
    ); //codice prodotto target (ricerca avanzata)
    const [selectedProductFilter, setSelectedProductFilter] = useState<{
        code: string;
        label: string;
        codiceListino?: string;
    } | null>(null); //metadati filtro prodotto selezionato

    const [advancedOpen, setAdvancedOpen] = useState(false); //modale ricerca avanzata aperta/chiusa
    const [exportingCsv, setExportingCsv] = useState(false); //loading export CSV

    // filtri periodo validità (non usati ora)
    const [validityFrom, setValidityFrom] = useState<string>(""); //placeholder: filtro validità
    const [validityTo, setValidityTo] = useState<string>(""); //placeholder: filtro validità

    const [userContext] = useUserContext(); //contesto utente loggato

    // ---------------------------
    // UTILS (locali al componente)
    // ---------------------------
    const todayIsoLocal = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }; //ritorna oggi in YYYY-MM-DD (locale)

    const inferDetailsPeriodFromPromo = (p?: PromoListItem | null): PromoPeriod | null => {
        if (!p) return null;
        if (!p.startDate || !p.endDate) return null;

        const today = todayIsoLocal();
        const start = p.startDate;
        const end = p.endDate;

        // ISO yyyy-mm-dd è confrontabile lessicograficamente
        if (start <= today && today <= end) return "ATTUALI";
        if (end < today) return "SCADUTE";
        if (start > today) return "FUTURE";
        return null;
    }; //deduce ATTUALI/SCADUTE/FUTURE dalla promo selezionata

    const getSelectedPromoItem = (code?: string): PromoListItem | null => {
        if (!code) return null;
        return promos.find((p) => p.promoCode === code) ?? null;
    }; //recupera oggetto promo dalla lista in memoria

    // ---------------------------
    // LOAD PROMO LIST
    // ---------------------------
    useEffect(() => {
        if (!listPeriod) return;

        // guard: se CUSTOM ma range non completo → non fetcho (evito lista “sballata”)
        if (listPeriod === "CUSTOM") {
            const f = listCustomFrom.trim();
            const t = listCustomTo.trim();
            if (!f || !t) {
                setPromos([]);
                setSelectedPromoCode(undefined);
                setError(null);
                setLoading(false);
                return;
            }
        }

        // aborto sempre la richiesta precedente per evitare race condition
        listAbortController.current?.abort();
        listAbortController.current = new AbortController();

        setPromos([]); //reset lista promo prima del reload
        setSelectedPromoCode(undefined); //reset promo selezionata
        setError(null); //reset errore
        setLoading(true); //start loading

        const params: {
            abortController: React.MutableRefObject<AbortController | null>;
            period: PromoListPeriod;
            from?: string;
            to?: string;
        } = {
            abortController: listAbortController,
            period: listPeriod,
        }; //parametri fetch lista promo

        if (listPeriod === "CUSTOM") {
            params.from = listCustomFrom.trim();
            params.to = listCustomTo.trim();
        } //se CUSTOM aggiungo from/to

        fetchPromosList(params)
            .then((res) => {
                setPromos(res.items ?? []);
            })
            .catch((err: any) => {
                if (err?.name === "AbortError") return;
                console.error(err);
                setPromos([]);
                setError("Errore nel caricamento della lista promozioni.");
            })
            .finally(() => setLoading(false));

        return () => {
            listAbortController.current?.abort();
            detailsAbortController.current?.abort();
        };
    }, [listPeriod, listCustomFrom, listCustomTo]);

    const promoOptions: FDSelectOption<string>[] = useMemo(
        () =>
            promos.map((p) => ({
                value: p.promoCode,
                label: `${p.promoCode} – ${p.description}`,
            })),
        [promos]
    ); //trasformo promos in opzioni FDSelect

    useEffect(() => {
        setListinoOptionsCache([]);
    }, [selectedPromoCode, period]); //reset cache listini su cambio promo/periodo

    // ---------------------------
    // LOAD DETAILS PAGE
    // ---------------------------
    /**
     * Fetch paginata dei dettagli promo (prodotti).
     * Usa "effectivePeriod" (ATTUALI/SCADUTE/FUTURE) coerente con la promo selezionata.
     */
    const fetchPage = (
        promoCode: string,
        offset: number,
        append: boolean,
        listino?: string | string[],
        productCode?: string,
        effectivePeriod?: PromoPeriod
    ) => {
        const p = effectivePeriod ?? period ?? "ATTUALI";
        effectiveDetailsPeriodRef.current = p;

        setDetailsLoading(true);
        setDetailsError(null);

        if (!append && detailsAbortController.current) {
            detailsAbortController.current.abort();
        }
        if (
            !detailsAbortController.current ||
            detailsAbortController.current.signal.aborted
        ) {
            detailsAbortController.current = new AbortController();
        }

        fetchPromoDetails({
            abortController: detailsAbortController,
            promoCode,
            period: p,
            offset,
            limit: PAGE_SIZE,
            listino,
            productCode,
        })
            .then((details) => {
                setPromoDetails((prev) => {
                    if (!append || !prev || prev.promoCode !== details.promoCode) {
                        return details;
                    }
                    return {
                        ...details,
                        promoCode: prev.promoCode,
                        description: prev.description,
                        startDate: prev.startDate,
                        endDate: prev.endDate,
                        classification: prev.classification,
                        visibility: prev.visibility,
                        productsCount: details.pagination.total,
                        products: [...prev.products, ...details.products],
                        pagination: { ...details.pagination, offset },
                        metadata: details.metadata,
                    };
                });

                if (!listino && !productCode) {
                    setListinoOptionsCache((prev) => {
                        const seen = new Map<string, string>(
                            prev.map((o) => [o.value, o.label])
                        );
                        for (const pr of details.products) {
                            const value = pr.codiceListino;
                            const label = `${pr.codiceListino} – ${pr.descrizioneListino}`;
                            if (!seen.has(value)) {
                                seen.set(value, label);
                            }
                        }
                        return Array.from(seen.entries()).map(([value, label]) => ({
                            value,
                            label,
                        }));
                    });
                }
            })
            .catch((err: any) => {
                if (err?.name !== "AbortError") {
                    console.error(err);
                    setDetailsError("Errore nel caricamento dei dettagli della promozione.");
                }
            })
            .finally(() => setDetailsLoading(false));
    };

    // ---------------------------
    // SUBMIT FILTRI / CARICAMENTO DETTAGLI
    // ---------------------------
    const handleSubmit = () => {
        if (!selectedPromoCode) return;

        // calcolo periodo dettagli coerente con la promo selezionata
        const promoItem = getSelectedPromoItem(selectedPromoCode);
        const inferred = inferDetailsPeriodFromPromo(promoItem);
        const effective = inferred ?? period ?? "ATTUALI";

        setPeriod(effective); //sincronizzo state (utile anche per UI/future logiche)
        effectiveDetailsPeriodRef.current = effective; //sincronizzo ref (usato da loadMore/export)

        setExpanded(true);
        setPromoDetails(null);

        const newAppliedListino =
            selectedListino.length > 0 ? selectedListino : undefined;
        setAppliedListino(newAppliedListino);

        const newTargetProductCode = selectedProductFilter?.code ?? null;
        setTargetProductCode(newTargetProductCode);

        fetchPage(
            selectedPromoCode,
            0,
            false,
            newAppliedListino,
            newTargetProductCode ?? undefined,
            effective
        );

        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    };

    // ---------------------------
    // RESET FILTRI PANNELLO
    // ---------------------------
    const handleResetFilters = () => {
        setSelectedListino([]);
        setAppliedListino(undefined);
        setTargetProductCode(null);
        setSelectedProductFilter(null);

        if (!selectedPromoCode) return;

        const promoItem = getSelectedPromoItem(selectedPromoCode);
        const inferred = inferDetailsPeriodFromPromo(promoItem);
        const effective = inferred ?? period ?? effectiveDetailsPeriodRef.current ?? "ATTUALI";

        setPromoDetails(null);
        setDetailsError(null);

        fetchPage(selectedPromoCode, 0, false, undefined, undefined, effective);

        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    };

    // ---------------------------
    // INFINITE SCROLL (logica dati)
    // ---------------------------
    const loadMore = useCallback(async (): Promise<boolean> => {
        if (!promoDetails || !selectedPromoCode) return false;
        if (detailsLoading) return false;

        const loaded = promoDetails.products.length;
        const total = promoDetails.pagination?.total ?? promoDetails.productsCount;

        if (loaded >= total) return false;

        fetchPage(
            selectedPromoCode,
            loaded,
            true,
            appliedListino,
            targetProductCode ?? undefined,
            effectiveDetailsPeriodRef.current
        );

        return true;
    }, [
        promoDetails,
        selectedPromoCode,
        detailsLoading,
        appliedListino,
        targetProductCode,
    ]);

    const hasMore =
        !!promoDetails &&
        promoDetails.products.length <
        (promoDetails.pagination?.total ?? promoDetails.productsCount);

    // ---------------------------
    // INFINITE SCROLL GRID (IntersectionObserver)
    // ---------------------------
    useEffect(() => {
        if (!expanded || !hasMore || !promoDetails || view !== "grid") return;

        const root = scrollContainerRef.current;
        const target = endRef.current;
        if (!root || !target) return;

        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadMoreLockRef.current) {
                    loadMoreLockRef.current = true;
                    Promise.resolve(loadMore()).finally(() => {
                        requestAnimationFrame(() => {
                            loadMoreLockRef.current = false;
                        });
                    });
                }
            },
            { root, rootMargin: "0px 0px 400px 0px", threshold: 0.01 }
        );

        io.observe(target);
        return () => io.disconnect();
    }, [expanded, hasMore, promoDetails, loadMore, view]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const loadedCount = promoDetails?.products.length ?? 0;
    const totalCount =
        promoDetails?.pagination?.total ?? promoDetails?.productsCount ?? 0;

    const isFirstResultsRender =
        expanded && !!promoDetails && !hasAnimatedResults;

    useEffect(() => {
        if (expanded && promoDetails && !hasAnimatedResults) {
            setHasAnimatedResults(true);
        }
    }, [expanded, promoDetails, hasAnimatedResults]);

    const listinoOptions: FDSelectOption<string>[] = useMemo(() => {
        if (listinoOptionsCache.length > 0) return listinoOptionsCache;

        if (!promoDetails) return [];
        const seen = new Map<string, string>();

        for (const p of promoDetails.products) {
            if (!seen.has(p.codiceListino)) {
                seen.set(p.codiceListino, p.descrizioneListino);
            }
        }

        return Array.from(seen.entries()).map(([value, label]) => ({
            value,
            label: `${value} – ${label}`,
        }));
    }, [promoDetails, listinoOptionsCache]);

    const filteredProducts = useMemo(() => {
        if (!promoDetails) return [];
        let base = promoDetails.products;
        if (targetProductCode) {
            base = base.filter((p) => p.productCode === targetProductCode);
        }
        return base;
    }, [promoDetails, targetProductCode]);

    const activeFiltersLabels = useMemo(() => {
        const labels: string[] = [];

        if (appliedListino && appliedListino.length > 0) {
            const labelsListini = appliedListino.map((code) => {
                return listinoOptions.find((o) => o.value === code)?.label ?? code;
            });
            labels.push(`Listini: ${labelsListini.join(", ")}`);
        }

        if (selectedProductFilter) {
            labels.push(`Prodotto: ${selectedProductFilter.label}`);
        }

        if (validityFrom || validityTo) {
            labels.push(`Periodo: ${validityFrom || "…"} → ${validityTo || "…"}`);
        }

        return labels;
    }, [
        appliedListino,
        listinoOptions,
        selectedProductFilter,
        validityFrom,
        validityTo,
    ]);

    const handlePeriodChangeFromTopBar = (value: PromoPeriod) => {
        setPeriod(value);
        effectiveDetailsPeriodRef.current = value;
    };

    const handleListPeriodChangeFromTopBar = (value: PromoListPeriod) => {
        setListPeriod(value);
        if (value !== "CUSTOM") {
            setListCustomFrom("");
            setListCustomTo("");
        }
    };

    const handleListCustomRangeChangeFromTopBar = (range: { from?: string; to?: string }) => {
        setListCustomFrom(range.from ?? "");
        setListCustomTo(range.to ?? "");
    };

    const periodSelectOptions: FDSelectOption<PromoListPeriod>[] = [
        { value: "ATTUALI", label: "Attuali" },
        { value: "SCADUTE", label: "Scadute" },
        { value: "FUTURE", label: "Future" },
        { value: "CUSTOM", label: "Intervallo personalizzato" },
    ];

    const handlePeriodConfirm = () => {
        if (!pendingListPeriod) return;

        if (pendingListPeriod === "CUSTOM" && (!pendingCustomFrom || !pendingCustomTo)) {
            return;
        }

        setListPeriod(pendingListPeriod);

        if (pendingListPeriod === "CUSTOM") {
            setListCustomFrom(pendingCustomFrom);
            setListCustomTo(pendingCustomTo);
        } else {
            setListCustomFrom("");
            setListCustomTo("");
        }

        const detailsPeriod: PromoPeriod =
            pendingListPeriod === "CUSTOM" ? "ATTUALI" : pendingListPeriod;
        setPeriod(detailsPeriod);
        effectiveDetailsPeriodRef.current = detailsPeriod;

        setStep("LIST");
    };


    // ---------------------------
    // EXPORT CSV
    // ---------------------------
    const handleExportCsv = async () => {
        if (!selectedPromoCode) return;

        try {
            setExportingCsv(true);

            const res = await fetchPromoExportCsv({
                abortRef: exportAbortRef,
                promoCode: selectedPromoCode,
                period: effectiveDetailsPeriodRef.current, //✅ coerente con la promo caricata
                listino: appliedListino,
                productCode: targetProductCode ?? undefined,
            });

            if (res.kind === "blob") {
                const blobUrl = URL.createObjectURL(res.blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = res.filename || `promo_${selectedPromoCode}_details.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(blobUrl);
            } else {
                console.error("Export CSV ha restituito JSON:", res.json);
            }
        } catch (err) {
            console.error("Errore durante l'export CSV promo:", err);
        } finally {
            setExportingCsv(false);
        }
    };


    // _________________________________________
    // TOUR SYSTEM
    // _________________________________________
    //const per blocco interazioni durante gli step del tour
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && (tourIndex === 1);

    const lastStepRef = useRef(0);
    const later = (fn: () => void) => window.setTimeout(fn, 0);
    const jump = (skip: any, to: number) => later(() => skip?.(to));

    const ensurePeriodScreen = () => {
        setStep("PERIOD");
        setExpanded(false);
        setPromoDetails(null);
        setFiltersOpen(false);
        setSortOpen(false);
        setAdvancedOpen(false);
    };

    const ensureListScreen = () => {
        setStep("LIST");
        setFiltersOpen(false);
        setSortOpen(false);
        setAdvancedOpen(false);
    };

    const tour = useSectionTour({
        id: 'nex_v2_listiniPromo',
        version: '2.0.0',
        user: {
            id: userContext?.details?._id ?? '',
            role: (userContext?.details?.ruolo as Role) ?? 'Tester',
        },
        keys: 'listiniPromo',
        actions: {
            0: () => { lastStepRef.current = 0; ensurePeriodScreen(); },
            1: () => { lastStepRef.current = 1; ensurePeriodScreen(); },
            // quando il tour entra nello step 2 (Avanti) devo essere su PERIOD
            // se sto tornando da step 3 voglio saltare indietro allo step 1
            // il jump serve perché setState è async e il tour deve ricalcolare il selector
            2: (curr, skip) => {
                const prev = lastStepRef.current; const goingBack = prev > 2; lastStepRef.current = 2; ensurePeriodScreen(); if (goingBack) {
                    if (prev === 3) return jump(skip, 1); // 3 -> 1 quando si preme Indietro da 3
                    return jump(skip, 2);
                }
            },
            // azione step 3: non esegue salti automatici, mantiene lo stato di step 3
            3: (curr, skip) => { lastStepRef.current = 3; },
            // se ritorno da 5 a 4, voglio saltare da 5 direttamente al 3 (e mantenere focus corretto)
            4: (_curr?: number, skip?: (to: number) => void) => {
                const prev = lastStepRef.current; lastStepRef.current = 4; ensureListScreen();
                if (prev === 5) { setExpanded(false); setPromoDetails(null); setDetailsError(null); setHasAnimatedResults(false); detailsAbortController.current?.abort(); return jump(skip, 3); }
            },
            5: () => { lastStepRef.current = 5; },
            9: () => { setFiltersOpen(false) },
            10: () => { setFiltersOpen(true) },
            11: () => { setFiltersOpen(false); setAdvancedOpen(false) },
            12: () => { setAdvancedOpen(true) },
            13: () => { setAdvancedOpen(true) },
            14: () => { setAdvancedOpen(false) },
        },
    });

    // -----------------------------------------
    // RENDER
    // -----------------------------------------
    return (
        <DashboardLayout>
            <div className="flex flex-col h-full w-full" onKeyDown={handleKeyDown}>
                {step === "PERIOD" && (
                    <div className="flex flex-1 justify-center items-center">
                        <FDBox pad="lg" radius="xl" className="w-full sm:w-min min-w-[60%]" data-tour="listiniPromo-scegliPeriodo">
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col md:flex-row gap-2 items-stretch">
                                    <div className="flex-1">
                                        <FDSelect
                                            options={periodSelectOptions}
                                            value={pendingListPeriod ?? undefined}
                                            onChange={(v) =>
                                                setPendingListPeriod(
                                                    (typeof v === "string"
                                                        ? (v as PromoListPeriod)
                                                        : null) as PromoListPeriod | null
                                                )
                                            }
                                            placeholder="Scegli il periodo delle promo"
                                            fullWidth
                                            searchable={false}
                                            clearable
                                            radius="md"
                                        />
                                    </div>

                                    {pendingListPeriod === "CUSTOM" && (
                                        <div className="flex-1 min-w-[360px]">
                                            <FDDate
                                                range
                                                value={{
                                                    from: pendingCustomFrom || undefined,
                                                    to: pendingCustomTo || undefined,
                                                }}
                                                onChange={(range) => {
                                                    setPendingCustomFrom(range.from ?? "");
                                                    setPendingCustomTo(range.to ?? "");
                                                }}
                                                size="md"
                                                radius="md"
                                                variant="outline"
                                                color="neutral"
                                                fullWidth
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end relative">
                                        <FDButton
                                            data-tour="listiniPromo-scegliPeriodo-search"
                                            variant="solid"
                                            color="primary"
                                            size="medium"
                                            disabled={
                                                !pendingListPeriod ||
                                                (pendingListPeriod === "CUSTOM" &&
                                                    (!pendingCustomFrom || !pendingCustomTo))
                                            }
                                            onClick={handlePeriodConfirm}
                                        >
                                            Avanti
                                            <ForwardIcon className="ml-1.5" />
                                        </FDButton>
                                        {lockInteractions && (
                                            <div
                                                aria-hidden="true"
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    zIndex: 10,
                                                    pointerEvents: "auto",
                                                }}
                                                onClickCapture={(e) => e.stopPropagation()}
                                            />
                                        )}
                                    </div>
                                </div>

                                {!!error && (
                                    <div className="text-sm text-red-600 px-1">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </FDBox>
                    </div>
                )}

                {step === "LIST" && period && (
                    <>
                        <div className={expanded ? "mt-4" : "flex flex-1 justify-center items-center"}>
                            <TopBar
                                expanded={expanded}
                                period={period as PromoPeriod}
                                listPeriod={listPeriod ?? "ATTUALI"}
                                listCustomFrom={listCustomFrom}
                                listCustomTo={listCustomTo}
                                promoOptions={promoOptions}
                                loadingPromos={loading}
                                selectedPromoCode={selectedPromoCode}
                                onPromoChange={(value) => {
                                    setSelectedPromoCode(value);

                                    // sincronizzo il periodo dettagli in base alla promo scelta
                                    const promoItem = getSelectedPromoItem(value);
                                    const inferred = inferDetailsPeriodFromPromo(promoItem);
                                    if (inferred) {
                                        setPeriod(inferred);
                                        effectiveDetailsPeriodRef.current = inferred;
                                    }

                                    setSelectedListino([]);
                                    setAppliedListino(undefined);
                                    setTargetProductCode(null);
                                    setSelectedProductFilter(null);
                                }}
                                onPeriodChange={handlePeriodChangeFromTopBar}
                                onListPeriodChange={handleListPeriodChangeFromTopBar}
                                onListCustomRangeChange={handleListCustomRangeChangeFromTopBar}
                                onSubmit={handleSubmit}
                            />
                        </div>

                        {expanded && promoDetails && (
                            <ProductDetailsPanel
                                details={promoDetails}
                                activeFiltersLabels={activeFiltersLabels}
                                filterBtnRef={filterBtnRef}
                                sortBtnRef={sortBtnRef}
                                onOpenFilters={() => setFiltersOpen(true)}
                                onOpenAdvancedSearch={() => setAdvancedOpen(true)}
                                onOpenSort={() => setSortOpen(true)}
                                onExportCsv={handleExportCsv}
                                exportLoading={exportingCsv}
                            />
                        )}

                        {expanded && promoDetails && (
                            <div className="flex-1 w-full mt-2 min-h-0">
                                {view === "grid" && (
                                    <div ref={scrollContainerRef} className="w-full h-full overflow-auto">
                                        {detailsLoading && loadedCount === 0 && (
                                            <div className="text-sm text-neutral-500 px-2">
                                                Caricamento dettagli promozione...
                                            </div>
                                        )}

                                        {!!detailsError && (
                                            <div className="text-sm text-red-600 px-2">
                                                {detailsError}
                                            </div>
                                        )}

                                        <div className="max-h-[63vh] md:max-h-[75vh] h-full">
                                            <motion.div
                                                className="grid auto-rows-fr overflow-x-hidden grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                                variants={gridVariants}
                                                initial={isFirstResultsRender ? "hidden" : "visible"}
                                                animate="visible"
                                                layout
                                            >
                                                {filteredProducts.map((product) => (
                                                    <motion.div
                                                        key={`${product.productCode}-${product.codiceListino}-${product.denominazioneUscita}`}
                                                        variants={cardVariants}
                                                        layout
                                                        className="h-full"
                                                    >
                                                        <PromoProductCard product={product} />
                                                    </motion.div>
                                                ))}
                                            </motion.div>

                                            <div ref={endRef} className="h-1 w-full" />
                                        </div>
                                    </div>
                                )}

                                {view === "list" && (
                                    <>
                                        {detailsLoading && loadedCount === 0 && (
                                            <div className="text-sm text-neutral-500 px-2">
                                                Caricamento dettagli promozione...
                                            </div>
                                        )}

                                        {!!detailsError && (
                                            <div className="text-sm text-red-600 px-2">
                                                {detailsError}
                                            </div>
                                        )}

                                        <div className="max-h-[63vh] md:max-h-[75vh] h-full">
                                            <ProductTable
                                                products={filteredProducts}
                                                loading={detailsLoading && loadedCount === 0}
                                                loadMore={loadMore}
                                                totalCount={totalCount}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <ViewMenu
                open={sortOpen}
                anchorRef={sortBtnRef}
                view={view}
                onClose={() => setSortOpen(false)}
                onChangeView={(v) => setView(v)}
            />

            <FiltersMenu
                open={filtersOpen}
                anchorRef={filterBtnRef}
                onClose={() => setFiltersOpen(false)}
                listinoOptions={listinoOptions}
                selectedListino={selectedListino}
                onListinoChange={(v) => setSelectedListino(v ?? [])}
                selectedProductFilter={selectedProductFilter}
                onClearProductFilter={() => {
                    setTargetProductCode(null);
                    setSelectedProductFilter(null);
                }}
                onResetFilters={handleResetFilters}
            />

            <AdvancedSearch
                open={advancedOpen}
                promoCode={selectedPromoCode}
                period={period}
                onClose={() => setAdvancedOpen(false)}
                onProductPicked={({ productCode, label, codiceListino }) => {
                    setSelectedProductFilter({
                        code: productCode,
                        label,
                        codiceListino,
                    });
                    setAdvancedOpen(false);
                }}
            />

            <Tooltip
                id="ListiniPromo-tooltip"
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

export default ListiniPromo;
