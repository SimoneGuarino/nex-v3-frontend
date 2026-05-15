// src/layouts/compare/filter/Search/searchHere.tsx
import React, {
    useState,
    useEffect,
    memo,
    useRef,
    useContext,
    useCallback,
    Fragment,
} from "react";
import { createPortal } from "react-dom";
import { SearchDataContext } from "context/SearchDataContext";
import { UserContext } from "context/UserContext";

import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import MDBox from "components/MDBox";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HintBox from "./hintbox/hintBox";
import { Footer } from "./hintbox/footer";
import { SendData } from "./hintbox/fetchData/sendData";
import { Button, InputBase } from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { useMaterialUIController } from "context/index";
import theme from "assets/theme";
import { enqueueSnackbar } from "components/MessageBox";
import FDBox from "components/UI/box/FDBox";
import { FetchData } from "examples/Fetch";
import { useNexTheme } from "@nex/theme-system";

type SearchHereProps = {
    hintsBoxActive: Boolean;
    loadStatus: { [key: string]: any };
    setHintBoxActive: React.Dispatch<React.SetStateAction<boolean>>;
    setInfiniteSCrollAnim: React.Dispatch<React.SetStateAction<boolean>>;
    infiniteScrollAnim: Boolean;
};

type HintItem = {
    _id: string;
    Da?: string;
    Descrizione?: string;
    CodiceProduttore?: string | number;
    CodiciGTIN?: string[] | string | null;
    Prezzo?: number | string;
    Disponibilita?: unknown;
    Keepa?: Array<{ amazon_price?: unknown; ebay_price?: unknown }>;
};
type HintDataState = { dati: HintItem[] };

function Spinner() {
    return (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 dark:border-gray-500 dark:border-t-white rounded-full animate-spin !mt-2" />
    );
}

function SkeletonLoad() {
    return (
        <div className="w-full flex flex-col items-center gap-4 !p-4">
            <div className="flex w-full gap-4 items-start">
                <div className="w-[70px] h-[70px] rounded-md bg-gray-200 dark:bg-neutral-700 animate-pulse" />
                <div className="flex flex-col w-full gap-2">
                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="h-4 w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                        <div className="h-4 w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                        <div className="h-4 w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                        <div className="h-4 w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                    </div>
                </div>
            </div>
            <Spinner />
        </div>
    );
}

function SearchHere({
    hintsBoxActive,
    loadStatus,
    infiniteScrollAnim,
    setHintBoxActive,
    setInfiniteSCrollAnim,
}: SearchHereProps) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const [searchDataContext, setSearchDataContext] =
        useContext(SearchDataContext) as any;
    const [elmSelected, setElmSelected] = useState<number | null>(null);
    const [userContext] = useContext(UserContext)!;

    const [searchBoxFocus, setSearchBoxFocus] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const [hintData, setHintData] = useState<HintDataState>({ dati: [] });
    const [handleSearchText, setHandleSearchText] = useState("");
    const [loadBool, setLoadBool] = useState(false);

    const abortController = useRef<AbortController | null>(null);
    const cancelRequest = () => abortController.current && abortController.current.abort();

    // misura/posizione searchbar per portal
    const searchbarRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [searchbarRect, setSearchbarRect] = useState<DOMRect | null>(null);
    const [searchbarHeight, setSearchbarHeight] = useState<number>(40);

    const readRects = useCallback(() => {
        if (searchbarRef.current) {
            const rect = searchbarRef.current.getBoundingClientRect();
            setSearchbarRect(rect);
            setSearchbarHeight(searchbarRef.current.offsetHeight || 40);
        }
    }, []);

    // anchor hintbox
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const updateAnchorRect = useCallback(() => {
        if (wrapperRef.current) {
            setAnchorRect(wrapperRef.current.getBoundingClientRect());
        }
        readRects();
    }, [readRects]);

    useEffect(() => {
        if (hintsBoxActive) {
            updateAnchorRect();
            const onScrollOrResize = () => updateAnchorRect();
            window.addEventListener("scroll", onScrollOrResize, true);
            window.addEventListener("resize", onScrollOrResize);
            return () => {
                window.removeEventListener("scroll", onScrollOrResize, true);
                window.removeEventListener("resize", onScrollOrResize);
            };
        }
    }, [hintsBoxActive, updateAnchorRect]);

    // ripristina focus quando la barra è nel portal
    useEffect(() => {
        if (hintsBoxActive && searchBoxFocus && inputRef.current) {
            // refocus senza scroll e cursore in coda
            const el = inputRef.current as HTMLInputElement;
            requestAnimationFrame(() => {
                el.focus({ preventScroll: true } as any);
                const len = el.value.length;
                try {
                    el.setSelectionRange?.(len, len);
                } catch { /* safari/edge older */ }
            });
        }
    }, [hintsBoxActive, searchBoxFocus, handleSearchText]); // al cambio testo, mantieni focus

    // fetch suggerimenti
    useEffect(() => {
        if (handleSearchText === "") setHintBoxActive(false);
        else setHintBoxActive(true);

        abortController.current = new AbortController();

        const delayDebounceFn = setTimeout(() => {
            if (searchBoxFocus) {
                setLoadBool(false);
                FetchData(`${import.meta.env.VITE_API_PRODUCTS}pds/search`, "POST", {
                    sstr: handleSearchText,
                }, abortController)
                    .then((data) => {
                        setHintData({ dati: Array.isArray(data) ? data : [] });
                        setElmSelected(null);
                        setInfiniteSCrollAnim(false);
                    })
                    .catch(() => { /* silent */ });
            }
        }, 800);

        const reset = () => {
            cancelRequest();
            setLoadBool(true);
            clearTimeout(delayDebounceFn);
        };
        return () => {
            reset();
            setHintData({ dati: [] });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleSearchText]);


    const SendDataAPI = useCallback((e_id: string, e_da: string | number) => {
        if (infiniteScrollAnim) {
            return enqueueSnackbar("La richiesta è in corso, aspetta una risposta prima di inviare un altra richista.", {
                title: "Info",
                type: "info",
            });
        }

        if (loadStatus.table) {
            setInfiniteSCrollAnim(false);
            return enqueueSnackbar("La tabella è in fase di caricamento, attendere il completamento.", {
                title: "Info",
                type: "info",
            });
        }

        SendData(
            userContext!,
            new AbortController(),
            setSearchDataContext as any,
            e_id,
            e_da,
            setHintBoxActive,
            setInfiniteSCrollAnim
        );
    }, [infiniteScrollAnim, userContext, setSearchDataContext, setHintBoxActive, setInfiniteSCrollAnim]);

    // Render singolo elemento
    const RenderElm = useCallback((data: HintItem, index: number) => (
        <FDBox key={index} style={elmSelected == index ? { backgroundColor: "#badfff" } : undefined}
            className={`flex w-full ${infiniteScrollAnim ? "pointer-events-none opacity-50" : ""}`}>
            <HintBox
                itemKey={index}
                _id={data._id}
                da={data.Da ?? ""}
                prod_name={data.Descrizione ?? ""}
                SKU={data.CodiceProduttore ?? ""}
                CodiciGTIN={Array.isArray(data.CodiciGTIN) ? data.CodiciGTIN[0] : data.CodiciGTIN}
                from={data.Da ?? ""}
                price={data.Prezzo}
                disp={data.Disponibilita}
                setHintBoxActive={setHintBoxActive}
                hintDataStatus={hintData}
                amazon={data?.Keepa?.[0]?.amazon_price}
                ebay={data?.Keepa?.[0]?.ebay_price}
                userImage={(userContext as any)?.details?.imageProfile}
                userFullName={`${(userContext as any)?.details?.nome || ""} ${(userContext as any)?.details?.cognome || ""}`}
                SendDataAPI={SendDataAPI}
                setInfiniteSCrollAnim={setInfiniteSCrollAnim}
            />
            <Divider
                component="div"
                variant="inset"
                sx={{ backgroundColor: `${darkMode ? theme.palette.grey[300] : "#9268ef"}`, margin: 0 }}
            />
        </FDBox>
    ),
        [hintData, elmSelected, darkMode, infiniteScrollAnim, userContext]
    );

    // tastiera
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const list = hintData?.dati;
        if (!list?.length) return;

        switch (event.key) {
            case "ArrowDown":
                setElmSelected((actual) => {
                    const lastIndex = list.length - 1;
                    return actual !== null ? (actual < lastIndex ? actual + 1 : null) : 0;
                });
                break;
            case "ArrowUp":
                setElmSelected((actual) => {
                    const lastIndex = list.length - 1;
                    return actual !== null ? (actual <= 0 ? null : actual - 1) : lastIndex;
                });
                break;
            case "Enter":
                if (elmSelected !== null) {
                    setInfiniteSCrollAnim(true);
                    SendDataAPI(list[elmSelected]._id, list[elmSelected].Da ?? "");
                }
                break;
            case "Escape":
                cancelRequest();
                setInfiniteSCrollAnim(false);
                setHintBoxActive(false);
                break;
        }
    }, [hintData, elmSelected, SendDataAPI, setHintBoxActive, setInfiniteSCrollAnim]);

    useEffect(() => {
        if (!hintData.dati?.length) return;
        const onKeyDown = (e: KeyboardEvent) => handleKeyDown(e);
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [hintData.dati, handleKeyDown]);

    // nodo searchbar (riutilizzato inline/portal)
    const SearchbarNode = (
        <Stack
            key="searchbar-sticky"
            ref={searchbarRef}
            direction="row"
            className="transition-all-css w-[320px]"
            sx={{
                pl: 1,
                alignItems: "center",
                borderRadius: 2,
                border: `1px solid ${darkMode ? "black" : "#ccc"}`,
                backgroundColor: `${darkMode ? theme.palette.grey[900] : theme.palette.background.paper}`,
                zIndex: `${!hintsBoxActive ? 1 : 19995}`,
                position: "relative",
            }}
        >
            <SearchOutlinedIcon sx={{ color: "#9f9f9f" }} />
            <InputBase
                inputRef={inputRef}
                style={{
                    padding: 4,
                    border: "none !important",
                    fontSize: "1rem",
                    color: `${darkMode ? "white" : "black"}`,
                }}
                className="w-full"
                value={handleSearchText}
                onFocus={() => {
                    setSearchBoxFocus(true);
                    if (handleSearchText) setHintBoxActive(true);
                    requestAnimationFrame(() => { readRects(); });
                }}
                onBlur={() => setSearchBoxFocus(false)}
                onChange={(e) => setHandleSearchText(e.target.value)}
                placeholder="Cerca qui i prodotti"
            />
            {handleSearchText !== "" && (
                <Fragment>
                    <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                    <Button onClick={() => setHandleSearchText("")} sx={{ p: 0.8, minWidth: 25 }}>
                        <CloseRoundedIcon sx={{ width: 23, height: 23, alignSelf: "center", justifyContent: "flex-end" }} />
                    </Button>
                </Fragment>
            )}
        </Stack>
    );

    return (
        <MDBox
            pr={1}
            ref={wrapperRef}
            sx={{ position: "relative", zIndex: !hintsBoxActive ? 1 : 19990, minWidth: 260, alignSelf: "center" }}
        >
            {/* quando l’hint è aperto, sposto la searchbar nel portal e mantengo il focus */}
            {hintsBoxActive && searchbarRect
                ? (
                    <>
                        <div style={{ height: searchbarHeight }} />
                        {createPortal(
                            <div
                                style={{
                                    position: "fixed",
                                    zIndex: 19995,
                                    top: searchbarRect.top,
                                    left: searchbarRect.left,
                                    width: searchbarRect.width,
                                }}
                            >
                                {SearchbarNode}
                            </div>,
                            document.body
                        )}
                    </>
                )
                : SearchbarNode}

            {/* hintbox in portal */}
            {hintsBoxActive && anchorRect && createPortal(
                <Fragment>
                    {/* overlay */}
                    <span
                        style={{
                            position: 'fixed',
                            zIndex: 15000,
                            inset: 0,
                            backgroundColor: '#0000004d'
                        }}
                        onClick={() => setHintBoxActive(false)}
                    />
                    {/* hintbox */}
                    <div
                        style={{
                            position: 'fixed',
                            zIndex: 20000,
                            top: anchorRect.bottom + 4,
                            left: anchorRect.left,
                            width: anchorRect.width || 320,
                            maxWidth: 600
                        }}
                    >
                        <Stack
                            id="hintBox"
                            sx={{
                                backgroundColor: `${darkMode ? theme.palette.grey[900] : theme.palette.background.paper}`,
                                border: `1px solid ${darkMode ? '#1f2937' : '#e5e7eb'}`,
                                borderRadius: 1,
                                overflowY: 'auto',
                                boxShadow: `${darkMode ? '0 10px 30px rgba(0,0,0,.6)' : '0 10px 30px rgba(0,0,0,.15)'}`
                            }}
                        >
                            {loadBool === false ? (
                                hintData?.dati && Array.isArray(hintData.dati) ? (
                                    <>
                                        {hintData.dati.map((data, index) => RenderElm(data, index))}
                                        {infiniteScrollAnim && (
                                            <div className="w-full flex justify-center !p-2">
                                                <Spinner />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <SkeletonLoad />
                                )
                            ) : (
                                <SkeletonLoad />
                            )}
                            <Footer />
                        </Stack>
                    </div>
                </Fragment>,
                document.body
            )}
        </MDBox>
    );
}

export default memo(SearchHere);
