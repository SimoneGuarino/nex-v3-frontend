import { useEffect, useState, useRef, useCallback, memo } from "react";

import { useUserContext } from "../../../context/UserContext";

//  components
import Loader from "../../../Loader";
import MinLoader from "../../../minLoader";
import Filters from './filter';

//  Layouts components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

/***** icons */
import { icon_update } from "config/icons";

// Componente utilizzato per la gestione dei filtri
import EmojiError from "emojiError";

//Sistema logico per il fetch dei relativi dati
import { DataRetrive } from './fetchData/data';
import { TableVirtualized } from "components/Virtualized/table";
import { enqueueSnackbar } from "components/MessageBox";
import { FDIconButton } from "@nex/fd-ui";


// Struttura generica di una colonna della tabella
interface TableColumn {
    key: string | string[] | { multiplay: { key: string }[] };
    label: string;
    type: 'default' | 'date' | 'eur' | 'pz' | 'multiple' | 'info';
    sort?: boolean;
    sortType?: 'String' | 'Number' | 'Multiplay';
    width?: number;
    info?: {
        text: string;
        var?: string;
    };
    sx?: Record<string, any>; // per ora generico, lo puliamo in fase Tailwind
    fieldToTake?: TableColumn[];
    multiSort?: boolean | string;
    hideInRow?: boolean;
    dateType?: string;
}

// Dati restituiti dal server (semplificati, poi si affina se hai l’esempio reale)
interface FbDataResponse {
    dataLength: number;
    dati: any[];
    warehouseToT: number;
}

export interface SanitizeResult<T> {
    Success: boolean;
    Data: T | null;
    Message?: string;
}

interface Agent {
    nome: string;
    cognome: string;
    codici: {
        agente: string | null;
    };
};
;


function OrdiniFB() {
    const [userContext] = useUserContext();

    // stato per codiceCommerciale
    const [codiceCommerciale, setCodiceCommerciale] = useState<Agent | null>(null);

    //___________________Dati relativi al compare/search
    // Stato per i dati
    const [dataContext, setDataContext] = useState<FbDataResponse>({
        dataLength: 0,
        dati: [],
        warehouseToT: 0,
    });

    // Stato di caricamento
    const [mainLoad, setMainLoad] = useState<boolean>(true);

    const [daySelected, setDaysSelected] = useState<string>("");
    //stato del bottone invio filtri per mostrare il caricamento
    const [loadingSendFilter, setLoadingSendFilter] = useState<boolean>(false);

    //Errore Fetch iniziale (Emoji Error)
    const [err, setErr] = useState<boolean>(false);

    //tiene conto dello stato attuale dello stateHook
    //il valore di questa variabile viene modificato in tempo reale in modo tale possa essere utilizzata
    //nel if del infinite scroll, se viene utilizzato dataContext direttamente il valore sarà Undefined
    const dataLengthRef = useRef<number>(dataContext.dataLength);

    const [copyDataArray, setCopyDataArray] = useState<any[]>(dataContext.dati);

    // Abort il panding del fetch all server
    const abortController = useRef<AbortController | null>(null);
    const cancelRequest = (): void => {
        if (abortController.current) {
            abortController.current.abort();
            abortController.current = null; //Reset after abort
        }
    };

    const [columns, setColumns] = useState<TableColumn[]>([
        { key: 'Num Ord', label: 'Num Ord', sort: true, sortType: 'Number', type: 'default' },

        { key: 'Tipo Ord', sort: true, sortType: 'String', label: 'Tipo Ord', type: 'default', info: { text: "Tipo dell'ordine" }, sx: { fontWeight: '600', alignItems: 'center' } },
        { key: 'Cod articolo', sort: true, sortType: 'String', label: 'Cod.Art', type: 'default', sx: { textAlign: 'center', width: '100%' }, width: 150 },
        { key: 'Descrizione', sort: true, sortType: 'String', label: 'Descrizione', type: 'default', sx: { textAlign: 'left', width: '100%' }, width: 300 },

        {
            key: ['Cod cliente', 'Ragione Sociale', 'Mail Cliente'], sort: false, sortType: 'String', label: 'Dettagli Cliente', fieldToTake: [
                { key: 'Cod cliente', label: 'Cod.Cli', type: 'default', sort: true, sortType: 'String', info: { text: "Codice cliente" }, sx: { fontWeight: '300' } },
                { key: 'Ragione Sociale', label: 'Ragione Sociale', sort: true, sortType: 'String', type: 'default', info: { text: "Ragione Sociale:", var: 'Ragione Sociale' }, sx: { fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', whiteSpace: 'nowrap', textAlign: 'left' } },
                { key: 'Mail Cliente', label: 'Tipo Ord', sort: true, sortType: 'String', type: 'default', info: { text: 'E-mail del cliente:', var: 'Mail Cliente' }, sx: { fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', whiteSpace: 'nowrap', textAlign: 'left' } },
            ], type: 'multiple', multiSort: true, sx: { alignItems: 'flex-start' }, width: 230
        },

        { key: 'Data Ord', label: 'Data Ord', sort: true, sortType: 'Number', type: 'date', dateType: 'ibmi', width: 110, sx: { alignItems: 'center' } },
        { key: 'Data Con', label: 'Data Con.', sort: true, sortType: 'Number', type: 'date', width: 110 },
        { key: 'Giorni Ord', label: 'Giorni Ord', sort: true, sortType: 'Number', type: 'default', sx: { alignItems: 'center' } },
        {
            key: ['Prezzo', 'Quantita'], label: 'Prezzo', fieldToTake: [
                { key: 'Prezzo', label: 'Prezzo', sort: true, sortType: 'Number', type: 'eur', sx: { textAlign: 'right' } },
                { key: 'Quantita', label: 'Quantità', sort: true, sortType: 'Number', type: 'pz', sx: { textAlign: 'right' } },
                { key: { multiplay: [{ key: 'Prezzo' }, { key: 'Quantita' }] }, label: 'PrezzoTot', hideInRow: true, sort: true, sortType: 'Multiplay', type: 'eur' },
            ], type: 'multiple', sort: true, sortType: 'Number', multiSort: true
        },


        {
            key: ['Promo', 'Fine Promo'], sort: true, sortType: 'String', label: 'Promo', fieldToTake: [
                { key: 'Promo', sort: true, sortType: 'String', label: 'Promo', type: 'default', info: { text: 'Promo' }, sx: { fontWeight: '600' } },
                { key: 'Fine Promo', label: 'Fine Promo', type: 'default', info: { text: 'Data Fine Promo' }, sx: { fontWeight: '300' } },
            ], type: 'multiple'
        },

        { key: 'Magazzino', label: 'Magazzino', sort: true, sortType: 'String', type: 'default', sx: { textAlign: 'left', width: '100%' }, width: 200 },

        /*{ key: [], fieldToTake:[
            {key: 'SendEmail', type: 'icons', title:'Sollecita tramite E-mail', ariaLabel:'send email', icon: <EmailIcon/>, funcAction: sendEmailFunc, onHoverColor: '#5a38f06b', sx:{alignSelf: 'center'}, condToShow:["e['Cod.Art'] === elm['Cod.Art']", "e.Prezzo === elm.Prezzo"]},
        ], label: 'Email', type:'info', sx: {width:'100%', justifyContent: 'center'}},*/
    ]);


    /*const sendEmailFunc = useCallback((num_fb, emailCliente) => {
        const fbNumSANIT = Sanitize.number(num_fb)
        if(!fbNumSANIT.Success){
            return enqueueSnackbar('Sembra che il numero fb non sia valido, perfavore riprova tra un pò.', {
                title: 'Ops..',
                type: 'error',
            });
        }

        const emailCliSANIT = Sanitize.email(emailCliente)
        if(!emailCliSANIT.Success){
            return enqueueSnackbar('Sembra che l'email del cliente non sia valida, perfavore riprova tra un pò.', {
                title: 'Ops..',
                type: 'error',
            });
        };

        FBSendEmail(userContext, abortController, 0, copyDataContext, null, emailCliSANIT.Data)
    },[userContext, abortController, copyDataContext]);*/

    const UpdateTablePrice = useCallback((): void => {
        if (!userContext || !userContext.details) return;

        if (loadingSendFilter) {
            enqueueSnackbar(
                'Per favore aspetta che la comunicazione precedente con il server, venga ultimata.',
                { title: 'Richiesta già effettuata', type: 'warning' }
            );
            return;
        }

        setLoadingSendFilter(true);
        setMainLoad(true);

        // Assicuriamoci che abortController sia sempre inizializzato
        cancelRequest();
        abortController.current = new AbortController();

        const selectUserCod =
            userContext.details?.ruolo === 'Commerciale'
                ? userContext.details.codici?.agente
                : codiceCommerciale?.codici?.agente ?? null;

        DataRetrive(
            setDataContext,
            userContext,
            abortController.current!,
            setMainLoad,
            selectUserCod,
            parseInt(daySelected),
            copyDataArray,
            setCopyDataArray,
            setLoadingSendFilter,
            setErr
        );

    }, [userContext?.details, codiceCommerciale, daySelected]); //, loadingSendFilter da aggiungere


    useEffect(() => {
        if (!userContext || !userContext.details) return;

        UpdateTablePrice();

        return () => {
            cancelRequest();
        }
    }, [userContext?.details]);

    useEffect(() => {
        dataLengthRef.current = dataContext.dataLength;
    }, [dataContext.dataLength]);

    // Se il context non è ancora pronto, mostro un loader e interrompo il render
    if (!userContext) {
        return <div className="text-center py-4">Caricamento dati utente...</div>;
    }



    return userContext.details === null ? (
        <div>"Error Loading User details"</div>
    ) : !userContext.details ? (
        <div>
            <Loader />
        </div>
    ) : (
        <DashboardLayout>
            <div className='h-full'>
                <div className='h-full flex flex-col gap-6'>
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex flex-wrap w-full py-2.5 items-center gap-3">
                            <h3 className="text-2xl font-semibold">
                                FB con articoli promo in scadenza
                            </h3>
                            <div className="basis-full md:basis-auto ml-auto flex flex-wrap items-center gap-3">
                                {userContext && <Filters
                                    copyDataContext={dataContext.dati}
                                    codiceCommerciale={codiceCommerciale}
                                    setCodiceCommerciale={setCodiceCommerciale}
                                    setDaysSelected={setDaysSelected}
                                    UpdateTablePrice={UpdateTablePrice}
                                    loadingSendFilter={loadingSendFilter}
                                />}
                                <div title="Aggiorna la Tabella">
                                    <FDIconButton
                                        aria-label="update"
                                        onClick={UpdateTablePrice}
                                        icon={icon_update()}
                                        disabled={loadingSendFilter}
                                    />
                                </div>
                            </div>
                        </div>
                        {!err ?
                            mainLoad ? <MinLoader /> : null
                            :
                            <EmojiError />}
                    </div>
                    {/* Tabella */}
                    {!err &&
                        <div className='h-full shadow rounded bg-white'>
                            <TableVirtualized
                                data={dataContext.dati || []}
                                whereToFindData="dati"
                                setData={(updater) => {
                                    setDataContext(prev => {
                                        if (typeof updater === 'function') {
                                            const res = (updater as any)(prev); // NB: prev è l'oggetto { dataLength, dati, warehouseToT }
                                            if (Array.isArray(res)) {
                                                // qualche filtro potrebbe tornare direttamente l'array (fallback)
                                                return { ...prev, dati: res };
                                            }
                                            if (res && typeof res === 'object') {
                                                // la maggioranza dei filtri con whereToFindData="dati" torna { ...prev, dati: [...] }
                                                return { ...prev, ...res };
                                            }
                                            return prev;
                                        }
                                        // updater NON-funzionale: può essere array o object
                                        return Array.isArray(updater)
                                            ? { ...prev, dati: updater }
                                            : { ...prev, ...updater };
                                    });
                                }}

                                loadStatus={mainLoad}
                                results={dataContext.dataLength}
                                footerSettings={{
                                    totWarehouse: parseFloat(dataContext.warehouseToT.toFixed(2)),
                                }}
                                columns={columns}
                                setColumns={setColumns}
                            />
                        </div>
                    }
                </div>
            </div>
        </DashboardLayout>
    );
}

export default memo(OrdiniFB);