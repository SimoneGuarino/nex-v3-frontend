/*

    Cambiare colore in configuratore di fornitori sul check Attiva.

    in tabella e quando clicchi sulla linea:

        1) Fatturati della linea
        e trimestri obiettivo in maniera alternata
        2) Stock
        3) OC/FB

 */

import React from "react";
import {
    Autocomplete, Backdrop, Button, Card, Divider, Fade, FormControl, IconButton,
    InputLabel, MenuItem, Select, SelectChangeEvent, Skeleton, Stack, TextField
} from "@mui/material";
import MDTypography from "components/MDTypography";
import {
    icon_ArrowLeft, icon_ArrowUp, icon_close, icon_eurSymbol, icon_filter, icon_info,
    icon_search, icon_Shuffle, icon_sort, icon_TrendingDown, icon_TrendingUp
} from "config/icons";
import { MainTheme } from "assets/settingsTheme";
import { NumberToEuro } from "utils/numberToEuro";
import { Tag } from "components/Tag/Tag";
import { CheckAdminPermissions } from "utils/checkAdminPermissions";
import { UserContext } from "context/UserContext";
import MDButton from "components/MDButton";
import MinLoader from "../../../../minLoader";
import { useNexTheme } from "@nex/theme-system";


interface UserContextProps {
    details?: object;
    token?: string;
};
interface BrandProps {
    nome: string;
    assegnazioni: Array<{
        canaleVendita: string;
        annuale: 0 | 1;
        trimestri: {
            q1: string,
            q2: string,
            q3: string,
            q4: string,
        },
    }>;
}



interface HeaderProps {
    q_: null | { quarter: string; range: any }; //quarter attuale in cui ci troviamo.
    item_: any;
    brandSelected: any;
    setBrandSelected: (prev: any) => void;
    BridgeClose: () => void;
};
export const Header: React.FC<HeaderProps> = ({ q_, item_, brandSelected, setBrandSelected, BridgeClose }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    return <Stack direction='row' alignItems='center'>
        <MDTypography variant='body2'>
            /{item_.linea}{(brandSelected && brandSelected.nome) && "/" + brandSelected.nome}
        </MDTypography>
        <Divider orientation="vertical" />
        <Stack direction='row' gap={1} alignItems='center'>
            <MDTypography variant='body2'>
                Trimestre attuale:
            </MDTypography>
            <MDTypography variant='body2' fontSize="0.85rem">
                <b>{q_ && q_.quarter?.toUpperCase()}</b> {q_ && "( " + new Date(q_.range?.from).toLocaleDateString('it') + " - " + new Date(q_.range?.to).toLocaleDateString('it') + " )"}
            </MDTypography>
        </Stack>
        <Stack direction='row' sx={{ ml: 'auto' }} gap={1}>
            {(brandSelected && brandSelected.nome) && <IconButton sx={{
                backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[200]}`,
                "&:hover": { backgroundColor: `${darkMode ? palette.grey[700] : palette.grey[300]}` }
            }} onClick={() => setBrandSelected(null)}>
                {icon_ArrowLeft()}
            </IconButton>}
            <IconButton sx={{
                backgroundColor: palette.error.light,
                "&:hover": { backgroundColor: palette.error.dark }
            }} onClick={BridgeClose}>
                {icon_close({ color: '#fff' })}
            </IconButton>
        </Stack>
    </Stack>
}

/*
    Filtra per Quarter (seleziona un quarter)
    e applica sopra dei sort sia sull'obiettivo che sul fatturato per
    piu alto/basso, negativo o positivo, Marca, Commerciale
 */
interface FiltersProps {
    item_: any;
    brandSelected: any;
    dataCopy: any;
    SortElements: (parms: any) => void;
};
export const Filters: React.FC<FiltersProps> = ({ item_, dataCopy, brandSelected, SortElements }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [userContext, setUserContext] = React.useContext<UserContextProps | any>(UserContext);
    const CheckAdminDev = CheckAdminPermissions({
        userRole: userContext.details.ruolo,
        permissions: userContext.details.permissions, panelToCheck: 'obiettivi_commerciali', where: 0
    });

    const sortFilterList = ['misto', 'alto', 'basso'];
    const posNegList = ['misto', 'positivo', 'negativo'];
    const quartersList = ['tutti', 'q1', 'q2', 'q3', 'q4'];
    const typeList = ['Fatturato Trimestre', 'Obiettivo Trimestre'];

    const [targetQuarter, setTargetQuarter] = React.useState<any>(0);
    const [targetType, settargetType] = React.useState<any>(0);
    const [sortFiltersIndex, setSortFilters] = React.useState(0);
    const [sortPosNegIndex, setPosNegFilters] = React.useState(0);

    const [agent, setAgent] = React.useState<null | { nome: string; cognome: string; codici: { agente: string } }>(null);
    const [brand, setBrand] = React.useState<null | { codice: string; descrizione: string }>(null);

    const agentsList = React.useMemo(() => {
        if (brandSelected) {
            return Array.from(new Set(brandSelected.assegnazioni.map((item: { commerciale: string }) => item.commerciale)));
        } else if(dataCopy){
            return Array.from(new Set(
                dataCopy.marche.flatMap((marca: { assegnazioni: any }) => marca.assegnazioni.map((item: { commerciale: string }) => item.commerciale))
            ))
        }
    }, [dataCopy, brandSelected]);

    const brandList = React.useMemo(() => {
        return dataCopy && Array.from(new Set(dataCopy.marche.map((item: { nome: string }) => item.nome)))
    }, [dataCopy]);



    const SwapSortData = ({ setState }: { setState: any }) => {
        eval(setState)((prev: any) => {
            if (parseInt(prev) == 2) {
                return 0;
            } else {
                return parseInt(prev) + 1
            }
        });
    };
    function ChooseSortIcon(index: number) {
        let ret;
        switch (index) {
            case 1:
                ret = icon_TrendingUp();
                break;
            case 2:
                ret = icon_TrendingDown();
                break;
            case 0:
                ret = icon_Shuffle();
                break;
        };
        return ret;
    };
    function PosNegIcon(index: number) {
        let ret;
        switch (index) {
            case 1:
                ret = icon_ArrowUp();
                break;
            case 2:
                ret = icon_ArrowUp({ transform: "rotate(180deg)" });
                break;
            case 0:
                ret = icon_Shuffle();
                break;
        };
        return ret;
    };


    //organizza i parametri e inviali nella funzione di elaborazione dei filtri.
    const OrganizeParms = () => {
        const params = {
            quarter: quartersList[targetQuarter],
            target: targetType == 0 ? "fatturati" : "quarters",
            filterOnly: sortPosNegIndex,
            sort: sortFiltersIndex,
            agent: agent,
            brand: brand
        };
        SortElements({ params });
    }




    return <Stack height={50} direction='row' alignItems='center' gap={1}>
        <Stack direction='row' gap={1} height='100%' alignItems='center' width='50%'>
            {icon_filter({ width: 30, height: 30, color: '#ccc' })}
            <FormControl sx={{ height: '100%' }} size='medium'>
                <InputLabel id="demo-simple-select-label">Trimestri</InputLabel>
                <Select
                    labelId="demo-simple-select-standard-label"
                    sx={{ height: 40, width: 80, '&.MuiInputBase-root': { height: '100%' }, '&.MuiInputBase-root .MuiSelect-select': { height: '100%' } }}
                    value={targetQuarter}
                    onChange={(event: SelectChangeEvent) => setTargetQuarter(event.target.value)}
                    label="Trimestri"
                >
                    {quartersList.map((x: string, index: number) => (
                        <MenuItem value={index} key={index}>{x}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl sx={{ height: '100%' }} size='medium'>
                <InputLabel id="demo-simple-select-label">Target</InputLabel>
                <Select
                    labelId="demo-simple-select-standard-label"
                    sx={{ height: 40, width: 150, '&.MuiInputBase-root': { height: '100%' }, '&.MuiInputBase-root .MuiSelect-select': { height: '100%' } }}
                    value={targetType}
                    onChange={(event: SelectChangeEvent) => settargetType(event.target.value)}
                    label="Target"
                >
                    {typeList.map((x: string, index: number) => (
                        <MenuItem value={index} key={index}>{x}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Stack direction='row' gap={2} ml='auto'>
                <IconButton sx={{
                    backgroundColor: `${sortPosNegIndex == 1 ? "#0080001c"
                        : sortPosNegIndex == 2 && "#ff00001c"
                        }`, width: 43
                }} onClick={() => SwapSortData({ setState: setPosNegFilters })}
                    data-tooltip-id="general-obiettivi-commerciali-tooltip"
                    data-tooltip-content={`Solo Marche che hanno ${quartersList[targetQuarter] === 'tutti' ? 'almeno un trimestre'
                        : quartersList[targetQuarter]} ${posNegList[sortPosNegIndex]}/i`}>
                    {icon_eurSymbol({width: 15, height: 15})}{ChooseSortIcon(sortPosNegIndex)}
                </IconButton>
                <IconButton sx={{
                    backgroundColor: `${sortFiltersIndex == 1 ? "#0080001c"
                        : sortFiltersIndex == 2 && "#ff00001c"
                        }`, width: 43
                }} onClick={() => SwapSortData({ setState: setSortFilters })}
                    data-tooltip-id="general-obiettivi-commerciali-tooltip"
                    data-tooltip-content={`Ordina le Marche presenti  ${sortFilterList[sortFiltersIndex] === 'misto' ? 'in maniera mista'
                        : "dal piu " + sortFilterList[sortFiltersIndex]} `}>
                    {icon_sort({width: 15, height: 15})}{PosNegIcon(sortFiltersIndex)}
                </IconButton>
            </Stack>
        </Stack>

        <Divider orientation='vertical' />

        <Stack direction='row' gap={1} height='100%' alignItems='center' width='50%'>
            {!brandSelected && <Autocomplete
                id="tags"
                options={(brandList || [])}
                value={brand}
                onChange={(_: any, value: any) => setBrand(value)}
                getOptionLabel={(option: any) => option}
                renderInput={(params) => (
                    <TextField {...params} sx={{
                        '&.MuiFormControl-root div .MuiButtonBase-root ': {
                            fontSize: '1.1rem',
                            color: `${darkMode ? palette.grey[500] : palette.black.main}`,
                            backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[400]}`
                        },
                        '&.MuiFormControl-root div .MuiInputBase-input': { fontSize: '0.8rem' },
                        '&.MuiFormControl-root div .MuiOutlinedInput-notchedOutline': { border: 'none' }
                    }}
                        placeholder="Marche" />
                )}
                sx={{ width: 200, backgroundColor: `${darkMode ? palette.dark.light : palette.grey[200]}`, borderRadius: 5 }}
            />}

            {Boolean(CheckAdminDev) && <Autocomplete
                id="tags"
                options={(agentsList || [])}
                value={agent}
                onChange={(_: any, value: any) => setAgent(value)}
                getOptionLabel={(option: any) => option}
                renderInput={(params) => (
                    <TextField {...params} sx={{
                        '&.MuiFormControl-root div .MuiButtonBase-root ': {
                            fontSize: '1.1rem',
                            color: `${darkMode ? palette.grey[500] : palette.black.main}`,
                            backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[400]}`
                        },
                        '&.MuiFormControl-root div .MuiInputBase-input': { fontSize: '0.8rem' },
                        '&.MuiFormControl-root div .MuiOutlinedInput-notchedOutline': { border: 'none' }
                    }}
                        placeholder="Commerciali" />
                )}
                sx={{ width: 200, backgroundColor: `${darkMode ? palette.dark.light : palette.grey[200]}`, borderRadius: 5 }}
            />}

            <MDButton sx={{ ml: 'auto', color: '#fff' }} variant="contained" color={`${darkMode ? "primary" : "secondary"}`}
                onClick={OrganizeParms}>
                <span>{icon_search({ color: '#fff', mr: 1, mt: 0.5 })}</span>Cerca
            </MDButton>
        </Stack>


    </Stack >
}


interface LineInspectProps {
    q_: null | { quarter: string; range: any }; //quarter attuale in cui ci troviamo.
    item_: any;
    setBrandSelected: (prev: any) => void;
    SumBrandTarget: ({ index }: { index: number }) => { quarters: any; fatturati: any; } | null;
};
export const LineInspect: React.FC<LineInspectProps> = ({ q_, item_, SumBrandTarget, setBrandSelected }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;



    return <Stack mt={2} gap={1} height='100%'>
        {(item_.marche && item_.marche.length > 0) ? item_.marche.map((brand: any, i: number) => {
            const summedQuarters = SumBrandTarget({ index: i });

            return <Button key={i} onClick={() => setBrandSelected(brand)}
                sx={{
                    p: 2, borderRadius: 2, justifyContent: 'flex-start',
                    backgroundColor: `${darkMode ? palette.dark.main : palette.grey[200]}`,
                    "&:Hover": { backgroundColor: `${darkMode ? palette.grey[900] : palette.grey[300]}` }
                }}>
                <MDTypography sx={{ minWidth: 150 }} >{brand.nome}</MDTypography>
                <Divider orientation="vertical" />
                <Stack direction='row' gap={1} width={'100%'}>
                    {(summedQuarters && summedQuarters.fatturati && summedQuarters.quarters) && ['q1', 'q2', 'q3', 'q4'].map((trimestre: string, x: number) => (
                        <Stack key={x} alignItems='center' justifyContent='space-between' width='25%' alignContent='center'
                            sx={{ backgroundColor: `${q_?.quarter == trimestre ? darkMode ? "" : palette.info.light : ""}`, borderRadius: 2 }}>
                            <Stack direction='row' alignItems='center' gap={1}>
                                {q_?.quarter == trimestre && <span style={{ height: 20 }}
                                    data-tooltip-id='general-obiettivi-commerciali-tooltip'
                                    data-tooltip-content='Trimestre in cui attualmente ci troviamo.'>{icon_info({ width: 20, height: 'inherit' })}</span>}
                                <MDTypography variant="body1">{trimestre?.toUpperCase()}</MDTypography>
                            </Stack>

                            <Stack direction='row' justifyContent='space-between' gap={1}>
                                <MDTypography sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                                    Fatturato Realizzato: </MDTypography>
                                <MDTypography sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                                    {NumberToEuro({ convert: summedQuarters.fatturati[trimestre] })}</MDTypography>
                            </Stack>
                            <Stack direction='row' justifyContent='space-between' gap={1}>
                                <MDTypography sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                                    Obiettivo Prefissato: </MDTypography>
                                <MDTypography sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                                    {NumberToEuro({ convert: summedQuarters.fatturati[trimestre] })}</MDTypography>
                            </Stack>
                        </Stack>
                    ))}
                </Stack>
            </Button>
        }) : <Stack alignItems='center' justifyContent='center' height='100%'>
            <MDTypography variant="body2"> Non è stato trovato nessun elemento, prova a modificare i filtri</MDTypography>
        </Stack>}
    </Stack>
}


interface AgentsInspectProps {
    brandSelected: any;
};
export const AgentsInspect: React.FC<AgentsInspectProps> = ({ brandSelected }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;



    return <Stack mt={2} direction='row' gap={1} flexWrap='wrap'>
        {(brandSelected.assegnazioni && brandSelected.assegnazioni.length > 0)
            && brandSelected.assegnazioni.map((configurazione: any, i: number) => (
                <Stack key={i} maxWidth={300} height={300} width={300}
                    sx={{
                        borderRadius: 2, justifyContent: 'flex-start',
                        backgroundColor: `${darkMode ? palette.dark.main : palette.grey[200]}`
                    }}>
                    <Stack p={2}>
                        <Stack direction='row' alignItems='center' justifyContent='space-between'>
                            <MDTypography variant="body2" fontSize="0.9rem">Obiettivo Annuale:</MDTypography>
                            <Tag text={configurazione.annuale == 0 ? 'Non Attivo' : 'Attivo'}
                                textColor='#fff'
                                color={configurazione.annuale == 0 ? palette.error.dark : palette.success.dark} />
                        </Stack>

                        <Stack direction='row' alignItems='center' justifyContent='space-between'>
                            <MDTypography variant="body2" fontSize="0.9rem">Commericlae:</MDTypography>
                            <MDTypography fontSize="1rem">{configurazione.commerciale}</MDTypography>
                        </Stack>

                        <Stack direction='row' alignItems='center' justifyContent='space-between'>
                            <MDTypography variant="body2" fontSize="0.9rem">Canale Vendita:</MDTypography>
                            <MDTypography fontSize="1rem">{configurazione.canaleVendita}</MDTypography>
                        </Stack>
                    </Stack>


                    <Divider sx={{ backgroundColor: '#000', m: 0, mb: 2 }} />

                    <Stack>
                        <Stack direction='row' alignItems='center' justifyContent='space-between' mb={1}>
                            <MDTypography variant="body2" sx={{ fontSize: '0.82rem', width: '33.33%', textAlign: 'center' }}>Trimestri</MDTypography>
                            <MDTypography variant="body2" sx={{ fontSize: '0.82rem', width: '33.33%', textAlign: 'center' }}>Fatturato</MDTypography>
                            <MDTypography variant="body2" sx={{ fontSize: '0.82rem', width: '33.33%', textAlign: 'center' }}>Obiettivo</MDTypography>
                        </Stack>
                        <Stack gap={1}>
                            {['q1', 'q2', 'q3', 'q4'].map((trimestre: string, x: number) => (
                                <Stack key={x} direction='row' alignItems='center' justifyContent='space-between'>
                                    <MDTypography variant="h5" sx={{ width: '33.33%', textAlign: 'center', fontSize: '0.8rem' }}>{trimestre?.toUpperCase()}</MDTypography>
                                    <MDTypography sx={{ fontSize: '0.8rem', width: '33.33%', textAlign: 'center' }}>
                                        {NumberToEuro({ convert: configurazione.fatturati[trimestre] })}</MDTypography>
                                    <MDTypography sx={{ fontSize: '0.8rem', width: '33.33%', textAlign: 'center' }}>
                                        {NumberToEuro({ convert: configurazione.trimestri[trimestre] })}</MDTypography>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>

                </Stack>
            ))}
    </Stack>
}


const SkeletonTableLoad: React.FC<{ BridgeClose: () => void; }> = React.memo(({ BridgeClose }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    return <Fade in={true} timeout={400}><Stack gap={2} height='100%' width={'100%'} alignItems='center' justifyContent='center'>
        <IconButton sx={{position: 'absolute', top: 10, right: 10, zIndex: 1}} onClick={() => BridgeClose()}>
            {icon_close()}
        </IconButton>
        <Skeleton sx={{
            borderRadius: 3, width: '100%', height: '100%',
            bgcolor: `${darkMode ? '#1c1c1c' : ''}`, minHeight: 580
        }} variant="rounded" />
        <MinLoader sx={{ width: 25, height: 25, position: 'absolute' }} />
    </Stack></Fade>
});

interface ViewDetailsProps {
    q_: null | { quarter: string; range: any }; //quarter attuale in cui ci troviamo.
    statusMode: boolean; // definisce in quale stato si trova il pannello
    ChangeStatus: () => void;
    item_: any;
    setGroupedItem_: (prev: any) => void; //stato che tiene traccia dell'elemento attualmente in ispezione
    inspectedItemCopy_: any;
    loadStatus: boolean;
};
export const ViewDetails: React.FC<ViewDetailsProps> = ({ q_, statusMode, ChangeStatus, item_, setGroupedItem_, inspectedItemCopy_, loadStatus}) => {
    const [brandSelected, setBrandSelected] = React.useState<null | BrandProps>(null);

    const BridgeClose = () => {
        setBrandSelected(null);
        ChangeStatus();
    };


    function SumBrandTarget({ index }: { index: number }): { quarters: any; fatturati: any; } | null {
        if (item_ && item_.marche[index]) {
            const totalQuarters = item_.marche[index].assegnazioni.reduce((acc: any, configurazione: any) => {
                acc.q1 += configurazione.trimestri.q1;
                acc.q2 += configurazione.trimestri.q2;
                acc.q3 += configurazione.trimestri.q3;
                acc.q4 += configurazione.trimestri.q4;
                return acc;

            }, { q1: 0, q2: 0, q3: 0, q4: 0 });

            const totalFatturati = item_.marche[index].assegnazioni.reduce((acc: any, configurazione: any) => {
                acc.q1 += (configurazione?.fatturati?.q1 || NaN);
                acc.q2 += (configurazione?.fatturati?.q2 || NaN);
                acc.q3 += (configurazione?.fatturati?.q3 || NaN);
                acc.q4 += (configurazione?.fatturati?.q4 || NaN);
                return acc;
            }, { q1: 0, q2: 0, q3: 0, q4: 0 });

            return { quarters: totalQuarters, fatturati: totalFatturati }
        }
        return null;
    };


    function SortElements({ params }: { params: any }) {
        if (brandSelected) {

        } else {
            setGroupedItem_((prev: any) => {
                // Crea una copia dell'oggetto `prev`
                const updatedPrev = { ...inspectedItemCopy_ };
                // Filtra le marche in base ai parametri
                updatedPrev.marche = inspectedItemCopy_.marche.filter((brand: any) => {
                    // Filtro per brand (se il parametro è definito)
                    const brandMatch = params.brand ? brand.nome === params.brand : true;
            
                    // Filtro per agente (se il parametro è definito)
                    const agentMatch = params.agent
                        ? brand.assegnazioni.some((assegnazione: any) => assegnazione.commerciale === params.agent)
                        : true;
            
                    // L'elemento passa il filtro solo se soddisfa entrambe le condizioni
                    return brandMatch && agentMatch;
                }).sort((a: any, b: any) => {
                    // Calcola il target per il brand `a`
                    const targetA: any = SumBrandTarget({ index: prev.marche.indexOf(a) });
                    // Calcola il target per il brand `b`
                    const targetB: any = SumBrandTarget({ index: prev.marche.indexOf(b) });
        
                    if (targetA && targetB) {
                        // Ordina in base al `params.quarter` e `params.target`
                        const quarter = params.quarter || "q1"; // default to "q1" if no quarter specified
                        const target = params.target || "fatturati"; // default to "fatturati" if no target specified
        
                        // Prendi i valori di fatturati o trimestri (quarter) e confrontali
                        const valueA = targetA[target]?.[quarter] || 0;
                        const valueB = targetB[target]?.[quarter] || 0;
        
                        let order;
                        switch (params.sort) {
                            case 0:
                                order = valueB - valueA
                                break;
                            case 1:
                                order = valueA - valueB
                                break;
                            default:
                                order = valueB - valueA
                                break;
                        }

                        // Ordinamento discendente (dal più grande al più piccolo)
                        return order;
                    }
        
                    return 0; // Mantiene l'ordine se non è possibile calcolare i target
                });
                console.log(params);
                // Restituisci il nuovo oggetto aggiornato
                return updatedPrev;
            });
        }
    }



    return <Backdrop open={statusMode} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Card sx={{
            height: '95%', width: '95%',
            maxWidth: 1700, minWidth: 580, maxHeight: 1400, minHeight: 580
        }}>
            {(!loadStatus && item_) ? <Stack p={3} gap={1} height='100%' width='100%'>
                <Header q_={q_} item_={item_} setBrandSelected={setBrandSelected} BridgeClose={BridgeClose} brandSelected={brandSelected} />
                <Divider />
                
                        <Filters brandSelected={brandSelected} item_={item_} SortElements={SortElements} dataCopy={inspectedItemCopy_}/>
                        <Divider />
                        {!brandSelected ? <LineInspect item_={item_} setBrandSelected={setBrandSelected} q_={q_} SumBrandTarget={SumBrandTarget} />
                            : <AgentsInspect brandSelected={brandSelected}/>}
                </Stack>
            :   <SkeletonTableLoad BridgeClose={BridgeClose}/>}
        </Card>
    </Backdrop>
}