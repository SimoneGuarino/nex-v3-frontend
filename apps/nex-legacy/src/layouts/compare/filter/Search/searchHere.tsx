import React, {
    useState,
    useEffect,
    memo,
    useRef,
    useContext,
    useCallback,
    Fragment,
} from "react";
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
import theme from "assets/theme";
import { enqueueSnackbar } from "components/MessageBox";
import { FDBox } from "@nex/fd-ui";
import { useNexTheme } from "@nex/theme-system";

type SearchHereProps = {
    hintsBoxActive: boolean;
    loadStatus: { [key: string]: any };
    setHintBoxActive: React.Dispatch<React.SetStateAction<boolean>>;
    setInfiniteSCrollAnim: React.Dispatch<React.SetStateAction<boolean>>;
    infiniteScrollAnim: boolean;
    filterPanelStatus?: unknown;
    visibilityPanel?: unknown;
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

    const [searchDataContext, setSearchDataContext] = useContext(SearchDataContext) as any;
    const [elmSelected, setElmSelected] = useState<number | null>(null);
    const [userContext] = useContext(UserContext)!;

    const [searchBoxFocus, setSearchBoxFocus] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const [hintData, setHintData] = useState<HintDataState>({ dati: [] });
    const [handleSearchText, setHandleSearchText] = useState("");
    const [loadBool, setLoadBool] = useState(false);

    const abortController = useRef<AbortController | null>(null);
    const cancelRequest = () => abortController.current && abortController.current.abort();

    // ⚠️ DIPENDENZE: solo handleSearchText (come in JS originale)
    useEffect(() => {
        if (handleSearchText === "") setHintBoxActive(false);
        else setHintBoxActive(true);

        abortController.current = new AbortController();

        const delayDebounceFn = setTimeout(() => {
            if (searchBoxFocus) {
                setLoadBool(false);
                fetch(`${import.meta.env.VITE_API_PRODUCTS}search`, {
                    signal: abortController.current!.signal,
                    method: "POST",
                    headers: { "Content-Type": "application/JSON" },
                    body: JSON.stringify({ tk: userContext?.token, sstr: handleSearchText }),
                })
                    .then((response) => {
                        if (!response.ok) throw new Error(String(response.status));
                        return response.json() as Promise<HintItem[]>;
                    })
                    .then((data) => {
                        setHintData({ dati: Array.isArray(data) ? data : [] });
                        setElmSelected(null);
                        setInfiniteSCrollAnim(false);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
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
    }, [handleSearchText]); // <- solo questo

    // click fuori → chiudi hintbox
    const handleOutsideClick = useCallback((event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
            setHintBoxActive(false);
        }
    }, [setHintBoxActive]);

    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [handleOutsideClick]);

    const SendDataAPI = useCallback((e_id: string, e_da: string | number) => {
        if (infiniteScrollAnim) {
            return enqueueSnackbar("La richiesta è in corso, aspetta una risposta prima di inviare un altra richista.", {
                title: "Info",
                type: "info",
            });
        };

        if (loadStatus.table) {
            setInfiniteSCrollAnim(false);
            return enqueueSnackbar("La tabella è in fase di caricamento, attendere il completamento.", {
                title: "Info",
                type: "info",
            });
        }

        // 💡 controller dedicato alla call di dettaglio (non quello della search)
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


    // Render singolo elemento della lista di hint
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

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
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
        },
        [hintData, elmSelected, SendDataAPI, setHintBoxActive, setInfiniteSCrollAnim]
    );

    useEffect(() => {
        if (!hintData.dati?.length) return;
        const onKeyDown = (e: KeyboardEvent) => handleKeyDown(e);
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [hintData.dati, handleKeyDown]);

    return (
        <MDBox
            pr={1}
            ref={wrapperRef}
            sx={{ position: "relative", zIndex: !hintsBoxActive ? 1 : 99999, minWidth: "15em", alignSelf: "center" }}
            className="relative w-full md:w-[36rem] max-w-[90vw]"
        >
            <Stack
                direction="row"
                className="transition-all-css w-full items-center rounded-md"
                sx={{
                    pl: 1,
                    alignItems: "center",
                    borderRadius: 2,
                    border: `1px solid ${darkMode ? "black" : "#ccc"}`,
                    backgroundColor: `${darkMode ? theme.palette.grey[900] : theme.palette.background.paper}`,
                }}
            >
                <SearchOutlinedIcon sx={{ color: "#9f9f9f" }} className="shrink-0" />
                <InputBase
                    className="w-full py-2"
                    style={{
                        padding: 4,
                        width: "100%",
                        border: "none !important",
                        fontSize: "1rem",
                        color: `${darkMode ? "white" : "black"}`,
                    }}
                    value={handleSearchText}
                    onFocus={() => setSearchBoxFocus(true)}
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

            {hintsBoxActive && (
                <Fragment>
                    <Stack
                        id="hintBox"
                        sx={{ backgroundColor: `${darkMode ? theme.palette.grey[900] : theme.palette.background.paper}` }}
                        className="
                          absolute left-0 right-0 mt-2 z-[100000]
                          w-full max-w-full
                          max-h-[60vh] overflow-y-auto
                          rounded-md shadow-lg
                          border border-gray-200 dark:border-neutral-700
                        "
                    >
                        {hintsBoxActive && loadBool === false ? (
                            hintData?.dati && Array.isArray(hintData.dati) ? (
                                <>
                                    {hintData.dati.map((data, index) => RenderElm(data, index))}
                                    {infiniteScrollAnim && (<div className="w-full flex justify-center !p-2">
                                        <Spinner />
                                    </div>)}
                                </>
                            ) : (
                                <SkeletonLoad />
                            )
                        ) : (
                            hintsBoxActive && <SkeletonLoad />
                        )}
                        <Footer />
                    </Stack>
                </Fragment>
            )}
        </MDBox>
    );
}

export default memo(SearchHere);
