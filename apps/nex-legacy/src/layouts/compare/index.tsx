import React, {
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
    Fragment,
} from "react";
import { SearchDataContext } from "context/SearchDataContext";

import { ComposeFilters } from "./filter/composeFilters";
import { useFiltersContext } from "context/filtersContext";

import { UserContext } from "context/UserContext";

//  components
import Loader from "../../Loader";
import ExportFornitori from "./components/ExportFortnitori";
import ExportConfrontatore from "./components/ExportConfrontatore";
import SearchHere from "./filter/Search/searchHere";

//  Layouts components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

// MUI Component
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import { Stack } from "@mui/material";
import { Tooltip } from "react-tooltip";

import FiltersPanel from "./filter/panel/index";
//import { GeneralError } from "components/NoData/generalError";
import { icon_download, icon_filter, icon_update, icon_upload } from "config/icons";
import { InfiniteScrollAPI } from "./virtualziedTable/fetchData/InfiniteScrollAPI";
import { enqueueSnackbar } from "components/MessageBox";

import { VirtualizedTable } from "./virtualziedTable";

//Sistema logico per il fetch dei relativi dati
import { DataRetrive } from "./virtualziedTable/fetchData/data";
import { WarehouseData } from "./virtualziedTable/fetchData/warehouse";
import { CategoriesData } from "./virtualziedTable/fetchData/categories";
import { CSVDataRequest } from "./virtualziedTable/fetchData/CSVDataRequest";
import { CSVUploadRequest } from "./virtualziedTable/fetchData/CSVUpload";

import CircularWithValueLabel from "./virtualziedTable/CircularWithValueLabel";
import { TagFilter } from "./virtualziedTable/tag";
import { SendFilters } from "./virtualziedTable/fetchData/sendFilters";
import { DownloadDistFileAPI } from "./virtualziedTable/fetchData/distListExport";
import { ContextMenu } from "components/UI/menu/ContextMenu";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { FDBox } from "@nex/fd-ui";
import { useSectionTour } from "tour/useSectionTour";
import { Role } from "tour/types";
import { Variation } from "./virtualziedTable/distVariations";
import { Buyer, useGeneralDataContext } from "context/GeneralDataContext";
import { UserState } from "types/UserContext";
import { useNexTheme } from "@nex/theme-system";

// ---------------- tipi locali ----------------
export type SearchDataContextLike = {
    dati?: any[];
    dataLength?: number;
    warehouseToT?: number | string;
    brand?: unknown[];
    categories?: unknown[];
    [k: string]: any;
};

type PriceListOption = { codice?: string | number; descrizione: string };

// ---------------------------------------------------------

function Tables() {
    // 1) contesti
    const { globalData } = useGeneralDataContext();
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const [userContext] = useContext(UserContext) as [
        UserState,
        React.Dispatch<React.SetStateAction<UserState>>
    ];

    const [searchDataContext, setSearchDataContext] = useContext(
        SearchDataContext
    ) as unknown as [SearchDataContextLike, React.Dispatch<React.SetStateAction<SearchDataContextLike>>];

    const {
        brandSelected,
        setBrandSelected,
        brandPrefix,
        setBrandPrefix,
        categorySelected,
        setCategorySelected,
        subcategorySelected,
        setSubCategorySelected,
        buyerTarget,
        setBuyerTarget,
        buyerTargetObject,
        setBuyerTargetObject,
        priceFilter,
        setPriceFilter,
        DispWithout0,
        setDispWithout0,
        dfValue,
        panelMode,
        setPanelMode,
        noteWith,
        setNoteWith,
    } = useFiltersContext();

    // 2) stati locali
    const [variationData, setVariationData] = React.useState<Variation[]>([]); //contenitore dati variazioni per pannello distVariation
    const [codicePromo, setCodicePromo] = useState<string | null>(null);
    const [codiceListino, setCodiceListino] = useState<PriceListOption>({
        codice: "03",
        descrizione: "03 - Dealer",
    });
    const [lastDateDist, setLastDateDist] = useState<any[]>([]);
    const [progressUpload, setProgressUpload] = useState<number>(0);
    // Lista dei progressi di caricamento dei vari componenti
    const [loadStatus, setLoadStatus] = React.useState<{ [key: string]: any }>({
        table: true,
        search: true,
        variance: true,
        distList: true,
        filters: true,
        warehouse: true,
        categories: true,
    });

    const [err, setErr] = useState<boolean>(false);
    const [impTableStatus, setImpTableStatus] = useState<boolean>(false);
    const [hintsBoxActive, setHintBoxActive] = useState<boolean>(false);
    const [infinteScrollAnim, setInfiniteSCrollAnim] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [filterPanelStatus, setFilterPanelStatus] = useState<boolean>(false);
    const [variationPanel, setVariationPanel] = useState<boolean>(false);
    const [visibilityPanel, setVisibilityPanel] = useState<boolean>(false);

    const [downloadModalOpen, setDownloadModalOpen] = useState(false);
    const [confrontatoreModalOpen, setConfrontatoreModalOpen] = useState(false);

    const [distList, setDistList] = useState<string[]>([]);

    const abortController = useRef<AbortController | null>(null);
    const offset = useRef<number>(0);

    const [openLatestNotes, setOpenLatestNotes] = useState(false);
    const anchorEl = useRef<HTMLDivElement | null>(null);

    //tour-system 
    const commentsCloseRef = useRef<() => void>();

    type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";

    const tour = useSectionTour({
        id: "nex_v2_comparator",
        version: "2.0.0",
        user: { id: userContext?.details?.id ?? "", role: (userContext?.details?.ruolo as Role) ?? "Tester" },
        keys: "comparator",
        actions: {
            5: () => { setFilterPanelStatus(false) },
            6: () => { setFilterPanelStatus(true) },
            11: () => { setFilterPanelStatus(true) },
            12: () => { setFilterPanelStatus(false); closeDlMenu() },
            14: () => { openDlMenu() },
            15: () => { openDlMenu(); setDownloadModalOpen(false) },
            16: () => { closeDlMenu(); setDownloadModalOpen(true) },
            17: () => { openDlMenu(); setDownloadModalOpen(false); setConfrontatoreModalOpen(false) },
            18: () => { closeDlMenu(); setConfrontatoreModalOpen(true) },
            19: () => { setConfrontatoreModalOpen(false) },
            22: () => { commentsCloseRef.current?.(); setVariationPanel(false) },
            23: () => {
                setVariationPanel(true); setVariationData([{
                    "_id": "692084fe48e7b2cab12b8a88",
                    "id_prodotto": "67c88241ed5d80eb733b0903",
                    "prezzo": 332.5,
                    "prezzo_listino": 332.5,
                    "disponibilita": 4,
                    "timestamp": "2025-11-21T15:26:10.798Z",
                    "distributore": {
                        "nome": "Esprinet"
                    },
                }]); ChangeLoadStatus({ from: 'variance', bool: false });
            },
            30: () => { setVariationPanel(true) }
        }
    });


    const openDlMenu = () => { setOpenLatestNotes(true); setVisibilityPanel(true); };
    const closeDlMenu = () => { setOpenLatestNotes(false); setVisibilityPanel(false); };
    const lockDownloadListino = tour.isOpen;
    const lockDownloadConfrontatore = tour.isOpen;

    const shouldIgnoreClose = (reason?: CloseReason) => {
        if (!tour.isOpen) return false;
        // se chiudo da codice (no reason) → NON bloccare
        if (!reason) return false;
        // durante il tour: ignora solo click fuori ed ESC
        return (
            reason === "backdropClick" ||
            reason === "clickAway" ||
            reason === "escapeKeyDown" ||
            reason === "itemClick"
        );
    };

    const guardedToggleFromFiltersPanel = useCallback((force: boolean = false) => {
        setFilterPanelStatus(prev => {
            // se forzo (viene dalla X): chiudi sempre
            if (force) return false;

            const next = !prev;
            const staChiudendo = prev && !next;

            // durante il tour blocca le chiusure NON forzate (es. Cerca/Escludi/toggle)
            if (staChiudendo && tour.isOpen) return prev;

            return next;
        });
    }, [tour.isOpen]);

    useEffect(() => {
        if (!userContext?.details) return;
        setBuyerTargetObject(null); // resetta il filtro buyer all'inizio per evitare conflitti con i parametri URL in caso di cambio utente
        const query = AssaignURLParametsToState();
        UpdateTablePrice(query, { reset: true });
        return () => cancelRequest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userContext?.details]);

    useEffect(() => {
        // se nel url è contenuto il parametro widget, popola il filtro admin
        const searchParams = new URLSearchParams(window.location.search);
        const widget = searchParams.get("widget"); //buyer code

        if (widget) {
            //popola il filtro con l'oggetto buyer completo corrispondente
            const buyerFromGlobal = globalData.buyers.find((buyer: Buyer) => buyer?.codici?.buyer === userContext.details?.codici?.buyer);
            // controlla se il buyer esiste nella globalData prima di settarlo nel contesto, confermando quindi che è un buyer valido
            if (buyerFromGlobal) {
                setBuyerTarget(buyerFromGlobal._id);
                setBuyerTargetObject(buyerFromGlobal ?? null); // sarà il filtro admin a popolare l'oggetto buyer completo
                //una volta caricato togli widget dall'url per evitare side effect
                const url = new URL(window.location.href);
                url.searchParams.delete("widget");
                window.history.replaceState({}, "", url.toString());
            };
        };
    }, [globalData.buyers])

    // 4) helpers
    const cancelRequest = () => {
        if (abortController.current) abortController.current.abort();
    };

    // ChangeLoadStatus viene passato ai componenti figli per aggiornare lo stato di caricamento
    // da cui dipende la visualizzazione del loader principale
    // se tutti i componenti hanno caricato, il loader principale scompare
    const ChangeLoadStatus = ({ from, bool }: { from: string, bool: boolean }) => {
        setLoadStatus((prev) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }))
    };

    const ChangeFilterPanelStatus = () => setFilterPanelStatus((v) => !v);

    const handleMenuClick = () => {
        setOpenLatestNotes(true);
        setVisibilityPanel(true);
    };

    const handleMenuDownloadClose = () => {
        setOpenLatestNotes(false);
        setVisibilityPanel(false);
    };

    function AssaignURLParametsToState(): string {
        const searchParams = new URLSearchParams(window.location.search);
        const composeQuery: string[] = [];

        for (const [key, value] of searchParams.entries()) {
            composeQuery.push(`${key}=${value}`);
        }

        if (composeQuery.length < 1) {
            composeQuery.push("disp=1");
        }

        composeQuery.forEach((e) => {
            const [key, val] = e.split("=");
            if (key === "dfval" || key === "dfcat") {
                setPriceFilter(parseFloat(val));
            }
        });

        return composeQuery.filter(Boolean).join("&");
    };

    const ResetFilters = (filtersToReset: string[]) => {
        // mantiene la semantica originale basata su eval
        filtersToReset.forEach((state) => (eval as any)(state)(null));
    };

    const composeFiltersFunc = (
        from?: "csv" | "changeBuyer" | null,
        obj?: Record<string, boolean> | null
    ) => {
        const query = ComposeFilters({
            brandSelected: obj?.setBrandSelected ? null : (brandSelected as any),
            brandPrefix: obj?.setBrandPrefix ? null : brandPrefix,
            categorySelected: obj?.setCategorySelected ? null : (categorySelected as any),
            subcategorySelected: obj?.setSubCategorySelected ? null : (subcategorySelected as any),
            priceFilter: obj?.setPriceFilter ? 0 : priceFilter,
            DispWithout0: obj?.setDispWithout0 ? false : DispWithout0,
            dfValue,
            noteWith: obj?.setNoteWith ? false : noteWith,

        });

        if (from === "csv") {
            CSVRequest(query);
        } else {
            console.log(obj);
            SendFiltersAPI_TAG(query, (obj as Record<string, boolean>) || null);
        }
    };

    const onSelectCSV: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0];
        if (!file || (file.type !== "text/csv" && file.type !== "application/vnd.ms-excel")) {
            enqueueSnackbar("Per favore inserisci un file CSV.", {
                title: "Ops..",
                type: "error",
            });
            return;
        }
        const formData = new FormData();
        formData.append("csvFile", file);
        if (userContext?.token) formData.append("tk", userContext.token);
        setProgressUpload(20);
        CSVUpload(formData);
        e.currentTarget.value = "";
    };

    /**
     * Recupera i dati della tabella in base alla query composta e aggiorna il contesto con i nuovi dati.
     */
    const UpdateTablePrice = useCallback((query: string, opts?: { reset?: boolean }) => {
        offset.current = 0;
        abortController.current = new AbortController();
        ChangeLoadStatus({ from: "table", bool: true });

        DataRetrive({
            buyerTarget: opts?.reset ? null : buyerTarget ?? null,
            abortController,
            query,
            offset,
            setSearchDataContext,
            setPanelMode,
            ChangeLoadStatus,
            WarehouseRetriveData,
            setImpTableStatus,
            setErr,
        });
    },
        [userContext, buyerTarget, setPanelMode, setSearchDataContext]
    );

    /**
     * Recupera i dati valore del magazzino totale in base alla query composta e aggiorna il contesto con i nuovi dati.
     */
    const WarehouseRetriveData = useCallback(({ queryColumns, query, opt }:
        { queryColumns: { Name: string }[]; query: string; opt?: { buyerFilterValue?: string } }) => {
        ChangeLoadStatus({ from: 'warehouse', bool: true });
        WarehouseData({
            userContext: (userContext as unknown) as { token: string; details?: any | null },
            buyerTarget: opt?.buyerFilterValue ?? null,
            abortController,
            query,
            queryColumns,
            setSearchDataContext,
            setLastDateDist,
            CategoriesRetriveData,
            ChangeLoadStatus
        });
    },
        [userContext, buyerTarget, setSearchDataContext]
    );

    /**
     * Recupera i dati delle categorie in base alla query composta e aggiorna il contesto con i nuovi dati.
     */
    const CategoriesRetriveData = useCallback((queryColumns: unknown, opt?: { buyerFilterValue?: string }) => {
        ChangeLoadStatus({ from: "categories", bool: true })
        CategoriesData({
            setSearchDataContext,
            userContext: (userContext as unknown) as { token: string; details?: any | null },
            buyerTarget: opt?.buyerFilterValue ?? null,
            ChangeLoadStatus,
            abortController,
            queryColumns
        });
    }, [userContext, buyerTarget, setSearchDataContext]);

    /** Funzione per l'upload del file CSV nel comparatore */
    const CSVUpload = useCallback(
        (formData: FormData) => {
            // CSVUploadRequest richiede una ref come abortController
            CSVUploadRequest(
                (userContext as unknown) as { token: string; details?: any | null },
                abortController,
                formData,
                setProgressUpload
            );
        },
        [userContext]
    );

    const SendFiltersAPI_TAG = useCallback(
        (query: string, buyrTrg: Record<string, boolean> | null) => {
            offset.current = 0;
            ChangeLoadStatus({ from: 'table', bool: true });
            const buyerTargetTAG_cond = ((buyrTrg && buyrTrg?.setBuyerTargetObject) || !buyrTrg) ? null : buyerTarget ?? null;
            SendFilters({
                userContext: (userContext as unknown) as { token: string; details?: any | null },
                buyerTarget: buyerTargetTAG_cond,
                query,
                abortController,
                offset,
                setSearchDataContext,
                setPanelMode,
                WarehouseRetriveData,
                ChangeLoadStatus,
            });
        },
        [userContext, buyerTarget, setPanelMode, setSearchDataContext]
    );


    // funzione che viene chiamata per scaricare il CSV della tabella
    // viene chiamata da composeFiltersFunc
    const CSVRequest = useCallback(
        (query: string) => {
            CSVDataRequest(
                (userContext as unknown) as { token: string; details?: any | null },
                buyerTarget ?? null,
                abortController,
                query
            );
        },
        [userContext, buyerTarget]
    );

    // funzione che viene chiamata dallo scroll della tabella virtualizzata
    // per caricare più dati
    const infiniteScroll = () => {
        const params = ComposeFilters({
            brandSelected,
            brandPrefix,
            categorySelected,
            subcategorySelected,
            priceFilter,
            DispWithout0,
            dfValue,
            noteWith,
        });

        return InfiniteScrollAPI({
            abortController,
            setData: setSearchDataContext as any,
            params,
            offset: offset.current,
            userContext: (userContext as unknown) as { token: string; details?: any | null },
            buyerTarget: buyerTarget ?? null,
        } as any);
    };

    // 6) azioni confrontatore
    const openConfrontatoreDialog = () => {
        if (!distList || distList.length === 0) {
            enqueueSnackbar("Nessun fornitore disponibile per l’esportazione.", {
                title: "Info",
                type: "info",
            });
            return;
        }
        setConfrontatoreModalOpen(true);
    };


    // ----------------------------------------
    // CONTEXT RELEASE NOTES MENU
    // ----------------------------------------
    const contextMenuDownload = [
        {
            title: "Scarica CSV tabella",
            icon: icon_download(),
            "data-tour": "comp-select-download-menu-tab-1",
            //onClick: () => composeFiltersFunc("csv", null),
            //nuovo onClick per menu aperto durante Scarica CSV tabella
            onClick: () => {
                composeFiltersFunc("csv", null);
                // mantieni il menu visibile durante il tour per evitare sfarfallii
                if (tour.isOpen) {
                    openDlMenu();
                }
            },
        },
        {
            title: "Scarica listino fornitore",
            icon: icon_download(),
            "data-tour": "comp-select-download-menu-tab-2",
            onClick: () => setDownloadModalOpen(true),
        },
        {
            title: "Esporta confrontatore (CSV/Excel)",
            icon: icon_download(),
            "data-tour": "comp-select-download-menu-tab-3",
            onClick: () => openConfrontatoreDialog(),
        },
    ];


    // ----------------------------------------
    // INFO LEGEND
    // ----------------------------------------
    const legendHTML = `
        <div class="flex flex-col text-sm">
          <div class="flex items-start gap-2">
            <span class="w-[10px] h-[10px] rounded-full bg-red-200 shrink-0 self-start mt-[2px]"></span>
            <span class="leading-snug">Almeno un fornitore ha un prezzo minore o uguale a Focelda</span>
          </div>
          <div class="flex items-start gap-2 mt-1">
            <span class="w-[10px] h-[10px] rounded-full bg-blue-200 shrink-0 self-start mt-[2px]"></span>
            <span class="leading-snug">Focelda ha il prezzo più basso</span>
          </div>
        </div>
    `;


    // 7) JSX (render)
    return userContext?.details === null ? (
        "Error Loading User details"
    ) : !userContext?.details ? (
        <div>
            <Loader />
        </div>
    ) : (
        <Fragment>
            <DashboardLayout>
                {/* PATCH: contenitore principale responsive */}
                <FDBox
                    variant="ghost"
                    className="flex flex-col gap-3 h-[calc(100vh-160px)] min-h-[420px] overflow-hidden h-full"
                >
                    {/* PATCH: barra superiore responsive e wrappabile */}
                    <FDBox
                        variant="ghost"
                        className="flex flex-wrap items-start md:items-center gap-2 md:gap-3"
                    >
                        <span data-tour="comp-search">
                            <SearchHere
                                hintsBoxActive={hintsBoxActive}
                                setHintBoxActive={setHintBoxActive}
                                setInfiniteSCrollAnim={setInfiniteSCrollAnim}
                                infiniteScrollAnim={infinteScrollAnim}
                                filterPanelStatus={filterPanelStatus || variationPanel}
                                visibilityPanel={visibilityPanel}
                                loadStatus={loadStatus.table}
                            /></span>
                        <span data-tour="comp-tagfilter">
                            <TagFilter
                                filterSelected={{
                                    setBrandSelected: (brandSelected as any)?.Brand,
                                    setBrandPrefix: brandPrefix,
                                    setCategorySelected: (categorySelected as any)?.DescrizioneLinea,
                                    setSubCategorySelected: (subcategorySelected as any)?.DescrizioneGruppo,
                                    setBuyerTargetObject: buyerTargetObject as any,
                                    setPriceFilter: priceFilter,
                                    setDispWithout0: DispWithout0,
                                    setNoteWith: noteWith,
                                }}
                                setBrandSelected={setBrandSelected as any}
                                setBrandPrefix={setBrandPrefix}
                                setCategorySelected={setCategorySelected as any}
                                setSubCategorySelected={setSubCategorySelected as any}
                                setBuyerTargetObject={setBuyerTargetObject as any}
                                setBuyerTarget={setBuyerTarget}
                                composeFiltersFunc={composeFiltersFunc}
                                setPriceFilter={setPriceFilter}
                                setDispWithout0={setDispWithout0}
                                setNoteWith={setNoteWith}
                            /></span>
                        {/* PATCH: solo className per controllare il layout con tailwind */}
                        <Stack
                            sx={{ marginLeft: "auto" }}
                            direction="row"
                            alignItems="center"
                            className="ml-0 md:ml-auto flex flex-row flex-wrap items-center gap-1 justify-start md:justify-end"
                        >

                            <IconButton
                                aria-label="informazioni"
                                data-tooltip-id="general-compare-tooltip"
                                data-tour="comp-legend"
                                data-tooltip-html={legendHTML}
                                data-tooltip-place="right"
                                size="small"
                            >
                                {AiOutlineInfoCircle({ size: "1.3em", color: darkMode ? "#8b8b8b" : "#6e6e6e" })}
                            </IconButton>
                            <IconButton
                                aria-label="filter"
                                data-tour="comp-filters-button"
                                data-tooltip-id="general-compare-tooltip"
                                data-tooltip-content="Filtri"
                                onClick={() => ChangeFilterPanelStatus()}
                            >
                                {icon_filter()}
                            </IconButton>

                            <IconButton
                                aria-label="update"
                                data-tooltip-id="general-compare-tooltip"
                                data-tour="comp-reset-table"
                                data-tooltip-content="Reset della Tabella"
                                onClick={() => {
                                    ResetFilters([
                                        "setBrandSelected",
                                        "setBrandPrefix",
                                        "setCategorySelected",
                                        "setSubCategorySelected",
                                    ]);
                                    // [FIX] sblocca l’impersonificazione buyer
                                    setBuyerTarget(null);
                                    setBuyerTargetObject(null);

                                    // [FIX] rimuove widget dall’URL PRIMA di ricostruire la query, così AssaignURLParametsToState() non lo rilegge e non lo rimette nello stato
                                    const url = new URL(window.location.href);
                                    url.searchParams.delete("widget");
                                    window.history.replaceState({}, "", url.toString());

                                    // [FIX] refetch senza buyer (override esplicito)
                                    const query = AssaignURLParametsToState();
                                    // [UX] reset immediato dei numeri a schermo: evita l'effetto "lag" percepito
                                    setSearchDataContext(prev => ({
                                        ...prev,
                                        dataLength: 0,
                                        warehouseToT: 0,
                                    }));
                                    UpdateTablePrice(query);
                                }}
                            >
                                {icon_update()}
                            </IconButton>
                            <Fragment>
                                <div ref={anchorEl}>
                                    <IconButton
                                        aria-label="esporta"
                                        sx={{ cursor: "pointer" }}
                                        data-tooltip-id="general-compare-tooltip"
                                        data-tooltip-content="Scarica"
                                        onClick={handleMenuClick}
                                        data-tour="comp-select-download"
                                    >
                                        {icon_download()}
                                    </IconButton>
                                </div>
                                {progressUpload === 0 ? (
                                    <form encType="multipart/form-data" method="post">
                                        <Button
                                            component="label"
                                            data-tooltip-id="general-compare-tooltip"
                                            data-tour="comp-upload-csv"
                                            data-tooltip-content="Carica CSV"
                                            sx={{
                                                padding: 0,
                                                minWidth: 44,
                                                borderRadius: "50%",
                                                color: "#344767",
                                            }}
                                        >
                                            {icon_upload({ width: "1.5em", height: "1.5em" })}
                                            <input
                                                onChange={onSelectCSV}
                                                hidden
                                                accept="file/*"
                                                type="file"
                                                name="csvFile"
                                            />
                                        </Button>
                                    </form>
                                ) : (
                                    <CircularWithValueLabel progress={progressUpload} />
                                )}
                            </Fragment>
                        </Stack>
                    </FDBox>

                    {/* PATCH: wrapper flessibile per la tabella */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <VirtualizedTable
                            data={searchDataContext?.dati ?? []}
                            setData={setSearchDataContext as any}
                            panelMode={panelMode}
                            dataTotal={searchDataContext?.dataLength ?? 0}
                            totWarehouse={
                                Number(Number(searchDataContext?.warehouseToT ?? 0).toFixed(2)).toLocaleString("it-IT") + "€"
                            }
                            infiniteScroll={infiniteScroll}
                            abortController={abortController as any}
                            lastDateDist={lastDateDist as any}
                            UpdateTablePrice={UpdateTablePrice} AssaignURLParametsToState={AssaignURLParametsToState}
                            impTableStatus={impTableStatus}
                            setImpTableStatus={setImpTableStatus as any}
                            variationPanel={variationPanel}
                            setVariationPanel={setVariationPanel}
                            offset={offset}
                            distList={distList as string[]}
                            setDistList={setDistList as React.Dispatch<React.SetStateAction<string[]>>}
                            ChangeLoadStatus={ChangeLoadStatus}
                            loadStatus={loadStatus}
                            registerCommentsClose={(fn) => { commentsCloseRef.current = fn; }}
                            variationData={variationData}
                            setVariationData={setVariationData}
                        />
                    </div>
                </FDBox>
            </DashboardLayout>

            {/* pannello filtri */}
            {filterPanelStatus && (
                <FiltersPanel
                    //ChangeFilterPanelStatus={ChangeFilterPanelStatus}
                    ChangeFilterPanelStatus={guardedToggleFromFiltersPanel}
                    loadStatus={loadStatus}
                    ChangeLoadStatus={ChangeLoadStatus}
                    codicePromo={codicePromo ?? ""}
                    setCodicePromo={setCodicePromo as React.Dispatch<React.SetStateAction<string>>}
                    codiceListino={codiceListino as any}
                    setCodiceListino={setCodiceListino as any}
                    offset={offset}
                />
            )}

            {hintsBoxActive && (
                <span
                    style={{
                        position: "absolute",
                        zIndex: 9999,
                        left: 0,
                        top: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#0000004d",
                    }}
                />
            )}

            <Tooltip
                id="general-compare-tooltip"
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 999999,
                }}
            />

            {/* dialog: scarica listino fornitore */}
            <ExportFornitori
                darkMode={darkMode}
                open={downloadModalOpen}
                //onClose={() => setDownloadModalOpen(false)}
                onClose={(_e?: any, reason?: CloseReason) => {
                    if (shouldIgnoreClose(reason)) return;
                    setDownloadModalOpen(false);
                }}
                onSubmit={async (value1, value2) => {
                    setLoading(true);
                    try {
                        await DownloadDistFileAPI({
                            nome: value1,
                            formato: value2.toLowerCase() as "csv" | "xlsx",
                            userContext: userContext as any,
                        });
                    } finally {
                        setLoading(false);
                        setDownloadModalOpen(false);
                    }
                }}
                loading={loading}
                options1={distList.length > 0 ? distList : ["Nessun fornitore trovato"]}
                options2={["CSV", "XLSX"]}
                disabled={lockDownloadListino}
            />

            {/* nuovo dialog separato: esportazione confrontatore */}
            <ExportConfrontatore
                open={confrontatoreModalOpen}
                //onClose={() => setConfrontatoreModalOpen(false)}
                onClose={(_e?: any, reason?: CloseReason) => {
                    if (shouldIgnoreClose(reason)) return;
                    setConfrontatoreModalOpen(false);
                }}
                distList={distList}
                userContext={userContext as any}
                darkMode={darkMode}
                disabled={lockDownloadConfrontatore}
            />

            <ContextMenu
                openFor={openLatestNotes}
                pos={anchorEl}
                //onClose={handleMenuDownloadClose}
                onClose={(_e?: any, reason?: CloseReason) => {
                    if (shouldIgnoreClose(reason)) return;
                    handleMenuDownloadClose();
                }}
                menuButtons={contextMenuDownload}
                data-tour="comp-select-download-menu"
            />
        </Fragment>
    );
}

export default Tables;