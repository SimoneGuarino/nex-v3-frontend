/*

        [ADD] quando fai l'inserimento deve ricercare il prodotto in automatico
        
        [ADD] Aggiungi il sort sugli agenti inseriti:
                - per ordine di inserimento
                - per nome
                - per ch.vendita
        
        [FIX] della struttura per "Altro"

 */


import React from 'react';
import { UserContext } from "context/UserContext";

import { Collapse, Fade, Skeleton, Stack } from '@mui/material';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';

import { Tooltip } from 'react-tooltip';

import ErrorIMG from 'assets/images/5203299_trasparent.webp';
import { GeneralError } from 'components/NoData/generalError';
import { MainBar } from './bar/main';
import { TransitionGroup } from 'react-transition-group';
import { LineaSettings } from './bar/settings/linea';
import { BrandSettings } from './bar/settings/brand';
import { SaveDataAPI } from './fetchData/saveData';
import { CorrelationsDataAPI } from './fetchData/correlationsData';
import { DeleteRowAPI } from './fetchData/deleteItem';
import { useNexTheme } from '@nex/theme-system';


const SkeletonLoad: React.FC<{ height?: number }> = ({ height }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    return <Fade in={true} timeout={400}><Stack gap={2}>
        <Skeleton sx={{ borderRadius: 3, width: '100%', height: height ? height : 400, bgcolor: `${darkMode ? '#1c1c1c' : ''}` }} variant="rounded" />
    </Stack></Fade>
}


interface TargetCommercialiProps { }
export const TargetCommerciali: React.FC<TargetCommercialiProps> = () => {
    const [userContext, setUserContext] = React.useContext<any>(UserContext);
    const abortController = React.useRef<AbortController | null>(null);    
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
            abortController.current = null; // Reset after abort
        }
    };

    //Errore Fetch iniziale (Emoji Error)
    const [err, setErr] = React.useState(false);
    const [onLoad, setOnLoad] = React.useState<boolean>(true);
    const ChangeErrorStatus = () => setErr(!err);
    //Stato che tiene traccia delle linee/categorie già inizializzate/configurate.
    const [data, setData] = React.useState<null | Array<{descrizione: string}>>(null);
    //Stato che tiene traccia delle linee/categorie disponibili che posso essere inserite all'interno della tabella
    //escludendo dalla lista gli elementi già creati, non ha una lista brand.
    const [correlations, setCorrelations] = React.useState<null | Array<{ linea: String; descrizione: string; }>>(null);
    //Stato che tiene traccia delle linee/categorie disponibili che posso essere inserite all'interno della tabella
    //escludendo dalla lista gli elementi già creati, non ha una lista brand.
    const [lineList, setLineList] = React.useState<null | Array<{descrizione: string}>>(null);
    const [sellerCHList, setSellerCHList] = React.useState<null | Array<object>>(null);

    const [lineToSearch, setLineToSearch] = React.useState<{ descrizione?: string; linea: string } | null>(null);
    //Stato che tiene traccia della somma di tutti i quarters di tutte le marche presenti
    const [quartersDiff, setQuartersDiff] = React.useState<null | { q1: number, q2: number, q3: number, q4: number }>(null); 

    const [brandIndexOnInspect, setBrandIndexOnInspect] = React.useState<null | number>(null);
    const [dataOnInspect, setDataOnInspect] = React.useState<any>(null);
    const [loadStatus, setLoadStatus] = React.useState<any>({
        correlations: true,
        dataOnInspect: false,
        create: false,
        search: false,
        insertAgents : false,
    });

    const ChangeLoadStatus = ({ from, bool }: { from: "create" | "dataOnInspect" | "correlations" | "search"; bool?: boolean }) => {
        setLoadStatus((prev: {
            correlations: boolean,
            dataOnInspect: boolean,
            create: boolean,
            search: boolean
        }) => ({...prev, [from]: bool !== undefined ? bool : !prev[from]}))
    };


    React.useEffect(() => {
        CorrelationsDataAPI({userContext, abortController, ChangeErrorStatus, setLineList, setCorrelations, setData, setLoadStatus, setSellerCHList});

        return () => {
            cancelRequest();
        }
    },[]);

    function SaveData ({ dt } : { dt: any }) {
        SaveDataAPI({ userContext, abortController, sendObj: dt })
    };

    /**
     * funzione che elimina l'elemento dallo stato in ispezione.
     * @param item marca che deve essere eliminata
     */
    const RemoveFullConfig = () => {

        /**
         * TODO: IN MODO DA FAR TORNARE LA LINEA NELLA LISTA DEGLI INSERIBILI.
         * setLineList;
         * setCorrelations;
         */
        setData((prev: any) => {
            const copy = [...prev];
            const IndexOnData = copy.findIndex((x: {linea: string}) => x.linea === dataOnInspect.linea);
            if(IndexOnData !== -1){
                setLineToSearch(null);
                copy.splice(IndexOnData, 1);
                //aggiungi l'elemento alla lista delle linee disponibili alla configurazione/inserimento.
                setLineList((prev: any) => {
                    if(!correlations){ return prev };
                    //trova l'elemento nel correlations per accedere alla descrizione della linea
                    const findCorrelation = correlations?.findIndex((x: any) => x.linea === dataOnInspect.linea);
                    if(findCorrelation !== -1){
                        const correlationItem = correlations[findCorrelation];
                        return [...prev, {linea: correlationItem.linea, descrizione: correlationItem.descrizione}]
                    }
                    return [...prev];
                })
            }
            return copy;
        })
    
        setDataOnInspect(null);
        setBrandIndexOnInspect(null);
        DeleteRowAPI({ userContext, abortController, tp: 0, item: dataOnInspect})
    };

    const QuartersDifference = React.useCallback(({ data } : { data: any }) => {
        const data_ = data ? data : dataOnInspect; 
        const totalSums = data_.marche.reduce((acc: any, marca: any) => {
            marca.assegnazioni.forEach((assegnazione: any) => {
                acc.q1 -= assegnazione.trimestri.q1;
                acc.q2 -= assegnazione.trimestri.q2;
                acc.q3 -= assegnazione.trimestri.q3;
                acc.q4 -= assegnazione.trimestri.q4;
            });
            return acc;
        }, { q1: data_.trimestri.q1, q2: data_.trimestri.q2, q3: data_.trimestri.q3, q4: data_.trimestri.q4 });
        return setQuartersDiff(totalSums);
    }, [dataOnInspect]);



    return <DashboardLayout>
        {!err ? <Stack gap={2}>
            {!loadStatus.correlations ? <MainBar lineList={lineList} setLoadStatus={setLoadStatus}
                correlations={correlations} lineToSearch={lineToSearch} setLineToSearch={setLineToSearch}
                data={data} setData={setData} setDataOnInspect={setDataOnInspect} setLineList={setLineList}
                loadStatus={loadStatus} ChangeLoadStatus={ChangeLoadStatus} setBrandIndexOnInspect={setBrandIndexOnInspect}
                QuartersDifference={QuartersDifference}/>
            : <SkeletonLoad height={150}/>}
            {!loadStatus.dataOnInspect ? 
                <TransitionGroup>
                    {(dataOnInspect && correlations) && <Collapse>
                        <LineaSettings dataOnInspect={dataOnInspect} setDataOnInspect={setDataOnInspect} 
                        SaveData={SaveData} RemoveFullConfig={RemoveFullConfig}
                        brandIndexOnInspect={brandIndexOnInspect} setBrandIndexOnInspect={setBrandIndexOnInspect}
                        quartersDiff={quartersDiff} QuartersDifference={QuartersDifference}
                        correlations={correlations[correlations?.findIndex((x: any) => x.linea === dataOnInspect.linea)]}/>
                    </Collapse>}
                    {(brandIndexOnInspect != null && dataOnInspect) && <Collapse>
                        <BrandSettings dataOnInspect={dataOnInspect} setDataOnInspect={setDataOnInspect}
                            brandIndex={brandIndexOnInspect} SaveData={SaveData} loadStatus={loadStatus}
                            brandOnInspect={dataOnInspect.marche[brandIndexOnInspect]} sellerCHList={sellerCHList}
                            quartersDiff={quartersDiff} setQuartersDiff={setQuartersDiff} QuartersDifference={QuartersDifference}/>
                    </Collapse>}
                </TransitionGroup>
            : <SkeletonLoad />}
        </Stack> : <GeneralError img={ErrorIMG} />}
        <Tooltip id="general-confg-obiettivi-commerciali-tooltip" place="bottom" style={{
            maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
            textAlign: 'center'
        }} />
    </DashboardLayout>
}