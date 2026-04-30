import React from 'react';

import { icon_chrono, icon_forum, icon_note } from 'config/icons';
import { ChronoAPI } from '../../fetchData/chronoData';
import { GroupedVirtualized } from 'components/Virtualized/grouped';
import { Tag } from 'components/Tag/Tag';
import { statusList, StatusToColor } from '../../../statusToColor';
import theme from 'assets/theme';
import { NumberToEuro } from 'utils/numberToEuro';
import { FiltersBar } from './filters';
import { MainTheme } from 'assets/settingsTheme';
import { InfiniteScrollAPI } from './fetchData/InfiniteScrollAPI';
import { format } from 'date-fns';
import { ConvertToItalianDate, DivideName, GetDate } from 'utils/index';
import { Comments } from 'layouts/ordini/sbloccoOrdini/extraPanel/comments';
import FDIconButton from 'components/FDIconButton';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { enqueueSnackbar } from 'components/MessageBox';
import { UserState } from 'types/UserContext';
import { useTour } from "tour/TourProvider";
import { useNexTheme } from '@nex/theme-system';


// ——————————————————————————————————————————————————————————
// INTERFACES
// ——————————————————————————————————————————————————————————
interface ArrayDataProps {
    customersFromRequest: Array<any>;
    customers: Array<any>;
};

interface DataClientProps {
    _id: string;
    stato: 0 | 1 | 2,
    codiceFb: number | string,
    codiciFb: Array<string>,
    cliente: {
        nome: string;
        codice: string;
        codiceIot: string
        email: string;
    };
    creata: {
        data: any;
        nota: string;
        da: {
            _id: string;
            nome: string;
            username: string;
        };
    },
    prodotti: {
        ordineTotale: number;
        dati: Array<any>;
    }
    fido: {
        focelda: {
            totale: number;
            residuo: number;
        }
        iot: {
            totale: number;
            residuo: number;
        }
    };
};

interface RenderRowProps {
    index: number;
    elm: DataClientProps;
    setRowSelected: (prev: any) => void;
    setOverviewStatus: (prev: any) => void;
};

interface ChronoMyRequestsProps {
    userContext: UserState;
    checkAdminDev: boolean;
    customersList: ArrayDataProps;

    setCustomersList: (prev: ArrayDataProps) => void;
    setErr: (prev: boolean) => void;
    commentsPanelStatus: boolean;
    openCommentsPanel?: () => void;
    closeCommentsPanel: () => void;
};


// ——————————————————————————————————————————————————————————
// RENDER ROW COMPONENT
// ——————————————————————————————————————————————————————————
export const RenderRow: React.FC<RenderRowProps> = ({ index, elm, setRowSelected, setOverviewStatus }) => {
    const { createChatBlock } = useGeneralDataContext();

    const { isOpen, index: tourIndex, next } = useTour();

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const CreateChat = async () => {
        if (!elm || !elm._id) {
            enqueueSnackbar(
                "Sembra che ci sia stato un problema nella creazione della chat, perfavore contatta l'assistenza.",
                { title: "Ops..", type: "error" }
            );
            return;
        }

        const [nomeAutore, cognomeAutore] = DivideName(elm.creata?.da?.nome ?? "");
        const isDisabled = [1, 2].includes(elm.stato);

        await createChatBlock({
            data: {
                idBlock: elm._id,
                titleBlock: `Sblocco Ordini ${elm.cliente?.nome ?? ""} - ${elm.cliente?.codice ?? ""}`,
                userID: elm.creata?.da?._id,
                nome: nomeAutore,
                cognome: cognomeAutore,
                path: "sbloccoOrdini",
                disabilitato: isDisabled,
            },
            settings: { loadFromRemote: true, createRemoteBlock: true, loadState: true },
            openAfter: true,
            markViewedIfOther: true,
            // non applicare lo stato se disabled (replica return prevMessages)
            applyState: !isDisabled,
        });
    };

    
    // ——————————————————————————————————————————————————————————
    // HANDLERS
    // ——————————————————————————————————————————————————————————
    const handleNoteClick = () => {
        setRowSelected(index);
        if (!isOpen) {
            setOverviewStatus(true)
        };

        if (isOpen && tourIndex === 17) {
            requestAnimationFrame(() => {
                next();
            });
        }
    };

    const handleChatClick = () => {
        CreateChat();
        if (isOpen && tourIndex === 20) {
            requestAnimationFrame(() => {
                next();
            });
        }
    };


    // ——————————————————————————————————————————————————————————
    // RENDER
    // ——————————————————————————————————————————————————————————
    return <div className="w-full rounded-2xl overflow-x-auto overflow-y-hidden bg-neutral-100 dark:bg-transparent dark:border dark:border-white/10">
        <div className="flex flex-row w-full items-center px-6 py-4 text-slate-700 dark:text-neutral-100">
            <div className="flex flex-col items-center gap-1 min-w-[100px]">
                <Tag text={statusList[elm.stato]} fontSize='0.7rem' sx={{ ...StatusToColor((statusList as any)[elm.stato], darkMode) }} />
                {(!elm.codiciFb || (elm.codiciFb && Array.isArray(elm.codiciFb) && elm.codiciFb.length == 0)) ?
                    <div className="flex flex-col items-center">
                        <p className="text-[0.7rem] font-light">Numero Fb:</p>
                        <p className="text-[0.7rem] font-semibold text-slate-700 dark:text-neutral-100">{elm.codiceFb}</p>
                    </div>
                    : <p className="text-[0.7rem] font-light">Gruppo di FB</p>}
            </div>

            <div className="mx-6 h-[55px] w-px bg-neutral-300/70 dark:bg-white/10" />

            <div className="flex flex-col items-center w-[300px]">
                <p className="text-[0.7rem] font-light">Richiesta Effettuata:</p>
                <p className="text-[0.7rem] font-light">{ConvertToItalianDate(elm.creata.data, { time: true })}</p>
                <p className="text-base font-semibold text-slate-700 dark:text-neutral-100">{elm.creata.da.username}</p>
            </div>

            <div className="mx-6 h-[55px] w-px bg-neutral-300/70 dark:bg-white/10" />

            <div className="flex flex-row flex-[26.6] gap-2 min-w-[500px] justify-start">
                <div className="flex flex-col justify-center items-start min-w-[250px]">
                    <p className="text-[0.7rem] font-light">Ragione Sociale</p>
                    <p className="text-base font-semibold text-slate-700 dark:text-neutral-100">{elm.cliente.nome}</p>
                </div>

                <div className="text-[0.7rem] font-light">
                    <div className="flex flex-row gap-1 items-center">
                        <p>Codice Focelda</p>
                        <p>{elm.cliente.codice}</p>
                    </div>
                    <div className="flex flex-row gap-1 items-center">
                        <p>Codice IOT</p>
                        <p>{elm.cliente.codiceIot}</p>
                    </div>
                    <div className="flex flex-row gap-1 items-center">
                        <p>Email Cliente</p>
                        <p>{elm.cliente.email}</p>
                    </div>
                </div>
            </div>

            <div className="mx-6 h-[55px] w-px bg-neutral-300/70 dark:bg-white/10" />

            <div className="flex flex-col items-start flex-[26.6]">
                <p className="text-[0.7rem] font-light">Totale Ordine</p>
                <p className="text-xl font-semibold text-slate-700 dark:text-neutral-100">{NumberToEuro({ convert: elm.prodotti.ordineTotale })}</p>
            </div>


            {(elm.creata.nota && elm.creata.nota.trim() !== "") &&
                <FDIconButton onClick={handleNoteClick}
                    data-tour="sblocco-commerc-comm"
                    data-tour-allow
                    data-tooltip-id='general-confg-suppliers-tooltip'
                    data-tooltip-content='In questa richiesta sono presenti delle note.'
                    sx={{
                        '&:hover': { backgroundColor: `${darkMode ? theme.palette.grey[800] : theme.palette.grey[300]}` }
                    }}>
                    {icon_note({ width: 25, height: 25, color: `${darkMode ? palette.grey[400] : palette.grey[700]}` })}
                </FDIconButton>}
            <div className="mx-6 h-[55px] w-px bg-neutral-300/70 dark:bg-white/10" />
            <FDIconButton onClick={handleChatClick}
                data-tour="sblocco-chat"
                data-tour-allow
                data-tooltip-id='general-confg-suppliers-tooltip'
                data-tooltip-content='Apri e visualizza la chat avvenuta in questo blocco.'>
                {icon_forum({ width: 25, height: 25, color: `${darkMode ? palette.grey[400] : palette.grey[700]}` })}
            </FDIconButton>
        </div>
    </div>
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export const ChronoMyRequests: React.FC<ChronoMyRequestsProps> = ({
    userContext, checkAdminDev, customersList, setCustomersList, setErr, commentsPanelStatus,
    openCommentsPanel, closeCommentsPanel
}) => {
    const { isOpen } = useTour();
    const NoteBridge: React.FC<{ element: any; overviewStatus: boolean; CloseOverview: () => void; }> = ({ element, overviewStatus, CloseOverview, }) => {
        const open = isOpen ? commentsPanelStatus : overviewStatus;
        const handleClose = isOpen ? closeCommentsPanel : CloseOverview;
        return <Comments panelStatus={open} creata={element.creata} esito={element.esito} ChangePanelStatus={handleClose} />
    };

    const ofs = React.useRef<number>(0);

    const [data, setData] = React.useState<Array<object>>([]);
    const [tableTotalData, setTableTotalData] = React.useState<number>(0);
    const [tableEuroTotal, setTableEuroTotal] = React.useState<number>(0);

    const [onLoad, setOnLoad] = React.useState<boolean>(false);
    const [onLoadFilters, seOnLoadFilters] = React.useState<boolean>(false);


    const [stateSelected, setStateSelected] = React.useState<string | number>(0);
    const [userSelected_Cliente, setUserSelected_Cliente] = React.useState<string | number>("");
    const [dateRangeStatus, setDateRangeStatus] = React.useState<boolean>(false);
    const ChangeDateRangeStatus = () => setDateRangeStatus(!dateRangeStatus);

    const [dateState, setDateState] = React.useState({
        da: format(new Date('2024-01-01'), 'yyyy-MM-dd'),
        a: format(new Date(GetDate().today), 'yyyy-MM-dd'),
    });

    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    React.useEffect(() => {
        ChronoAPI({
            userContext, abortController, setData, setErr,
            setOnLoad, searchParam: { com: userContext?.details?._id, stato: 0 }, setTableTotalData, setTableEuroTotal, ofs
        });

        return () => cancelRequest();
    }, []);

    const infiniteScroll = () => {
        const searchParam = {
            stato: ((stateSelected as number) !== undefined && stateSelected !== "") ? stateSelected : null,
            dateRange: dateRangeStatus ?
                { da: new Date(dateState.da), a: new Date(dateState.a).setHours(23, 59, 59, 999) }
                : null,
        };

        return InfiniteScrollAPI({
            userContext, abortController, setData,
            searchParam, setErr, offset: ofs.current
        })
    };


    return <div className="flex flex-col gap-1 h-[90%]">
        <div className="w-full h-px bg-neutral-300/70 dark:bg-white/10" />
        <div className="flex flex-row items-center gap-2">
            {icon_chrono({ width: 25, height: 25 })}
            <h2 className="text-xl font-semibold text-slate-700 dark:text-neutral-100">Cronologia delle Richieste Effettuate</h2>
        </div>
        <FiltersBar userContext={userContext} setData={setData} onLoadFilters={onLoadFilters} seOnLoadFilters={seOnLoadFilters}
            setTableTotalData={setTableTotalData} loadedNumberData={data.length} tableTotalData={tableTotalData} ofs={ofs}
            tableEuroTotal={tableEuroTotal} setTableEuroTotal={setTableEuroTotal}
            setErr={setErr} setOnLoadTable={setOnLoad} customersList={customersList} stateSelected={stateSelected} dateRangeStatus={dateRangeStatus} dateState={dateState}
            userSelected_Cliente={userSelected_Cliente} setUserSelected_Cliente={setUserSelected_Cliente} setDateState={setDateState} setCustomersList={setCustomersList}
            setStateSelected={setStateSelected} ChangeDateRangeStatus={ChangeDateRangeStatus} />
        {!onLoad && <div className="h-[85%] animate-in fade-in duration-700">
            <GroupedVirtualized
                data={data}
                setData={setData}
                loadState={onLoad}
                paramToTakeGroup='e.creata.data'
                RenderRow={RenderRow}
                results={tableTotalData}
                rowHeight={100}
                setErr={setErr}
                Overview={NoteBridge}

                overviewStatus={commentsPanelStatus}
                setOverviewStatus={() => console.log("CALL SET OVERVIEW")}

                checkAdminDev={checkAdminDev}
                tableHeight="calc(100vh - 270px)"
                infiniteScroll={{
                    func: infiniteScroll,
                    offset: ofs
                }}
            /></div>}
    </div>
}