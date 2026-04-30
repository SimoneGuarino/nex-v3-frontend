import { Button, Divider, InputBase, Stack } from '@mui/material';
import { icon_close } from '../../../../config/icons';
import { icon_search } from '../../../../config/icons';
import React from 'react';
import SkeletonSearch from './SkeletonSearch';
import { HintBlock } from './hintBlock';
import { MainTheme } from 'assets/settingsTheme';
import { useNexTheme } from '@nex/theme-system';

interface SearchProps {
    baseData: Array<hintDataInterface>;
    setData: (prev: any) => void;
}

interface hintDataInterface {
    username: string;
    nome: string;
    cognome: string;
    stato: {codice: StatusType};
    role: Array<string>;
}

type StatusType = "Online" | "Offline";

export const Search: React.FC<SearchProps> = ({ baseData, setData}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [hintData, setHintData] = React.useState<Array<hintDataInterface> | null>(null);
    //definisce il focus per la ricerca in modo tale da far partire il fetch
    const [searchBoxFocus, setSearchBoxFocus] = React.useState<boolean>(false);
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const [resultBox, setResultBox] = React.useState<boolean>(false);
    const [loadStat, setLoadStat] = React.useState<boolean>(false);
    const [text, setText] = React.useState<string>("");

    const HandleText = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | null): void => {
        if (!e) { return };
        const { value } = e.target;
        setText(value);
    };

    React.useEffect(() => {
        if (text == "") {
            setResultBox(false);
        }else{
            setResultBox(true);
        };
        
        const intervalId = setTimeout(() => {
            if (searchBoxFocus) {
                setLoadStat(false);
                SearchInData();
            }
        }, 1000); // Ogni 2 secondi 15000
    
        return () => {
          clearInterval(intervalId); // Cancella l'intervallo quando il componente viene smontato
          setLoadStat(true);
        };
    }, [text]);

    const SearchInData = () => {
        setHintData(() => {
            const copy: hintDataInterface[] = baseData
                .filter((item: {username: string | null }) => (item.username ?? null) !== null)
                .map((item: any) => item as hintDataInterface);

            const search = copy.filter((e: hintDataInterface) => {
                const fullName = (e?.nome + " " + e.cognome).toLowerCase();
                return e.nome?.toLowerCase().includes(text?.toLowerCase()) ||
                e.cognome?.toLowerCase().includes(text?.toLowerCase()) || e.username?.toLowerCase().includes(text?.toLowerCase()) ||
                fullName?.toLocaleLowerCase().includes(text?.toLowerCase())
            });
            return search;
        });
        setLoadStat(false);
    }

    React.useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setResultBox(false);
            }
        }
        // Aggiungi un listener di evento per il click al di fuori del componente
        document.addEventListener("mousedown", handleOutsideClick);
        // Pulisci il listener quando il componente viene smontato
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    //Dopo aver cliccato sul box di riferimento all'utente viene inserito in array.
    const SwitchDataWithClickedBox = (index: number) => {
        const e = baseData[index];
        setData(() => {
            return [{}, e]
        });
    };

    return (
        <div ref={wrapperRef} style={{display: 'block', position: 'relative', zIndex: 2, height: 'auto', alignSelf: 'center'}}>
            <Stack className='transition-all-css' direction='row' sx={{
                pl: 1, maxHeight: 35, minHeight: 35, alignSelf: 'center',
                alignItems: 'center', border: '1px solid #ccc', borderRadius: 2,
                width: `${text == '' ? '10rem' : '14rem'}`
            }}>
                {icon_search({ color: '#9f9f9f' })}
                <InputBase style={{
                    width: '100%', border: 'none !important', fontSize: '0.8rem',
                    color: `${darkMode ? palette.grey[400] : palette.grey[800]}`
                }}
                    value={text}
                    onFocus={() => setSearchBoxFocus(true)}
                    onBlur={() => setSearchBoxFocus(false)}
                    onChange={(e) => HandleText(e)} placeholder='Ricerca Veloce' />
                <Stack className='transition-all-css' direction='row' sx={text == '' ? { opacity: 0 } : { opacity: 1 }}>
                    <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                    <Button onClick={() => setText("")}
                        sx={{ p: 0.8, minWidth: 25 }}>
                        {icon_close({
                            width: 23, height: 23, alignSelf: 'center',
                            justifyContent: 'flex-end'
                        })}
                    </Button>
                </Stack>
            </Stack>
            {resultBox && <Stack id="hintBox" sx={{maxHeight: 500, overflow: 'auto !important', 
            backgroundColor: `${darkMode ? palette.grey[900] : palette.grey[100]}`}}>
                    {resultBox && !loadStat && text != "" ?
                        (hintData !== null && hintData !== undefined ?
                            hintData.map((elm: any, index: number) => (
                                <HintBlock keyx={index} nome={elm.nome} cognome={elm.cognome}
                                username={elm.username} stato={elm.stato} role={elm.ruolo}
                                BoxClick={SwitchDataWithClickedBox} 
                                indexInArray={baseData.findIndex((e: hintDataInterface) => e.username == elm.username)}/>
                            ))
                            : <SkeletonSearch />)
                    : (resultBox && text != "") && <SkeletonSearch />}
                </Stack>}
        </div>)
}