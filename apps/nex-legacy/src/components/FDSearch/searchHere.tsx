import React, { useState, useEffect, memo, useRef, useContext, useCallback, Fragment } from 'react';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SklLoadHintItem from "./hintbox/sklLoadHintItem";
import { Box, Button, Card, InputBase } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import theme from 'assets/theme';
import { UserContext } from 'context/UserContext';
import { enqueueSnackbar } from 'components/MessageBox';
import { Footer } from './hintbox/footer';
import { useNexTheme } from '@nex/theme-system';



interface SearchHereProps {
    hintsBoxActive: boolean;
    infinteScrollAnim: boolean;
    HintBoxElement: React.ComponentType<any>;
    fetchSettings: {
        url: string;
        method?: string;
        headers?: any;
        body?: any;
    };
    placeholder?: string;
    zIndex?: number;
    setHintBoxActive: (active: boolean) => void;
    setInfiniteScrollAnim: (anim: boolean) => void;
    clickOnHintItem?: ({ data, setSearchText }: { data: any, setSearchText?: (prev: any) => void }) => void;
};

/**
 * @param fetchSettings 
 * url is required in fetchSettings object ||
 * method is optional, default is POST ||
 * headers is optional, default is { "Content-Type": "application/JSON" } ||
 * body is optional, default is {} ||
 * @param HintBoxElement 
 * elemento che verrà renderizzato all'interno della hintBox
 * @param hintsBoxActive
 * stato che indica se la hintBox è attiva o meno
 * @param clickOnHintItem
 * funzione che verrà eseguita al click su un elemento della hintBox
 * @param setHintBoxActive
 * funzione che setta lo stato della hintBox
 * @param setInfiniteScrollAnim
 * funzione che setta lo stato dell'animazione di caricamento
 * @param infinteScrollAnim
 * stato che indica se l'animazione di caricamento è attiva o meno 
 * @returns 
 */
const SearchHere: React.FC<SearchHereProps> = ({ fetchSettings, HintBoxElement, hintsBoxActive, placeholder, zIndex, clickOnHintItem, setHintBoxActive, setInfiniteScrollAnim,
    infinteScrollAnim }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const [elmSelected, setElmSelected] = useState<number | null>(null);
    const [userContext] = useContext<any>(UserContext);
    const [searchBoxFocus, setSearchBoxFocus] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [hintData, setHintData] = useState<{ dati: any[] }>({ dati: [] });
    const [handleSearchText, setHandleSearchText] = useState("");
    const [loadBool, setLoadBool] = useState(false);
    const abortController = useRef<AbortController | null>(null);

    const cancelRequest = () => abortController.current && abortController.current.abort();


    useEffect(() => {
        if (handleSearchText === "") {
            setHintBoxActive(false);
        } else {
            setHintBoxActive(true);
        }
        abortController.current = new AbortController();

        const delayDebounceFn = setTimeout(() => {
            if (!fetchSettings.url) {
                return console.error("URL is required in fetchSettings object");
            };

            if (searchBoxFocus) {
                setLoadBool(false);
                fetch(fetchSettings.url, {
                    signal: (abortController.current as any).signal,
                    method: fetchSettings.method || "POST",
                    headers: fetchSettings.headers || { "Content-Type": "application/JSON" },
                    body: JSON.stringify({ tk: userContext.token, sstr: handleSearchText, ...fetchSettings.body })
                }).then(response => {
                    if (!response.ok) {
                        throw new Error(response.statusText);
                    }
                    return response.json();
                }).then((data: any) => {
                    setHintData({ dati: data });
                    setElmSelected(null);
                    setInfiniteScrollAnim(false);
                }).catch(err => {
                    console.error(err);
                });
            }
        }, 800);

        const reset = () => {
            cancelRequest();
            setLoadBool(true);
            clearTimeout(delayDebounceFn);
        };

        return () => reset();;
    }, [handleSearchText]);

    const handleOutsideClick = useCallback((event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
            if (abortController.current) cancelRequest();
            setHintBoxActive(false);
            setHintData({ dati: [] });
        }
    }, []);

    useEffect(() => {
        // Aggiungi un listener di evento per il click al di fuori del componente
        document.addEventListener("mousedown", handleOutsideClick);

        // Pulisci il listener quando il componente viene smontato
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [handleOutsideClick]);

    const SendDataAPI = useCallback((element: any) => {
        if (infinteScrollAnim) {
            return enqueueSnackbar("'La richiesta è in corso, aspetta una risposta prima di inviare un altra richista.", {
                title: 'Richiesta in corso..',
                type: 'warning',
            });
        } else {
            clickOnHintItem !== undefined && clickOnHintItem({ data: element, setSearchText: setHandleSearchText });
            setTimeout(() => {
                setHintBoxActive(false);
                setInfiniteScrollAnim(false);
            }, 1);
        }
    }, [infinteScrollAnim, setHintBoxActive, setInfiniteScrollAnim]);

    const RenderElm = useCallback((data: any, index: number) => (
        <Card sx={{ borderRadius: 0 }} key={index}>
            <Stack sx={{ width: '100%' }} style={elmSelected === index ? { backgroundColor: '#badfff' } : {}}>
                <HintBoxElement
                    itemKey={index}
                    data={data}
                    setHintBoxActive={setHintBoxActive}
                    hintDataStatus={hintData}
                    setHandleSearchText={setHandleSearchText}
                    setInfiniteScrollAnim={setInfiniteScrollAnim}
                    SendDataAPI={SendDataAPI}
                />
                <Divider component="div" variant="inset" sx={{ backgroundColor: `${darkMode ? theme.palette.grey[300] : '#9268ef'}`, margin: 0 }} />
            </Stack>
        </Card>
    ), [hintData, elmSelected, setHintBoxActive, setHandleSearchText, setInfiniteScrollAnim, darkMode]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (hintData?.dati) {
            switch (event.key) {
                case 'ArrowDown':
                    setElmSelected(actual => {
                        const increase = actual !== null && actual < (hintData.dati.length - 1) ? actual + 1 : 0;
                        return increase;
                    });
                    break;
                case 'ArrowUp':
                    setElmSelected(actual => {
                        const decrease = actual !== null && actual > 0 ? actual - 1 : (hintData.dati.length - 1);
                        return decrease;
                    });
                    break;
                case 'Enter':
                    if (elmSelected !== null) {
                        setInfiniteScrollAnim(true);
                        SendDataAPI(hintData.dati[elmSelected]);
                    }
                    break;
                case 'Escape':
                    cancelRequest();
                    setInfiniteScrollAnim(false);
                    setHintBoxActive(false);
                    break;
            }
        }
    }, [hintData.dati, elmSelected, setInfiniteScrollAnim, setHintBoxActive]);

    useEffect(() => {
        if (!hintData.dati) { return; }
        const onKeyDown = (event: KeyboardEvent) => handleKeyDown(event);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [hintData.dati, handleKeyDown]);





    return (
        <Box component="div" pr={1} ref={wrapperRef} sx={{ zIndex: (zIndex || 1), minWidth: '15em', alignSelf: 'center' }}>
            <Stack direction='row' className="transition-all-css"
                sx={{
                    pl: 1, alignItems: 'center', borderRadius: 2, border: `1px solid ${darkMode ? 'black' : '#ccc'}`,
                    backgroundColor: `${darkMode ? theme.palette.grey[900] : theme.palette.background.paper}`,
                }}>
                <SearchOutlinedIcon sx={{ color: '#9f9f9f' }} />
                <InputBase style={{
                    padding: 4, width: '100%', border: 'none !important', fontSize: '1rem',
                    color: `${darkMode ? 'white' : 'black'}`
                }}
                    value={handleSearchText}
                    onFocus={() => { setSearchBoxFocus(true) }}
                    onBlur={() => { setSearchBoxFocus(false) }}
                    onChange={(e) => setHandleSearchText(e.target.value)} placeholder={placeholder || 'Cerca qui..'} />
                {handleSearchText !== '' && <Fragment>
                    <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                    <Button onClick={() => { setHandleSearchText("") }}
                        sx={{ p: 0.8, minWidth: 25 }}>
                        <CloseRoundedIcon sx={{
                            width: 23, height: 23, alignSelf: 'center',
                            justifyContent: 'flex-end'
                        }} />
                    </Button>
                </Fragment>}
            </Stack>
            {hintsBoxActive && <Fragment>
                <Stack id="hintBox" sx={{ backgroundColor: `${darkMode ? theme.palette.grey[900] : theme.palette.background.paper}` }}>
                    {hintsBoxActive && !loadBool ?
                        (hintData?.dati ? hintData.dati.map((data, index) => RenderElm(data, index)) : <SklLoadHintItem />) : <SklLoadHintItem />}
                    <Footer />
                </Stack>
            </Fragment>}
        </Box>
    );
}

export default memo(SearchHere);
