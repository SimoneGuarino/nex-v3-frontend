import React from 'react';
import { Tag } from 'components/Tag/Tag';
import { NumberToEuro } from 'utils/numberToEuro';
import { statusList, StatusToColor } from '../../../statusToColor';
import { MainTheme } from 'assets/settingsTheme';
import { ConvertToItalianDate } from 'utils/italianDate';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { enqueueSnackbar } from 'components/MessageBox';
import { DivideName } from 'utils/divideName';
import { icon_forum, icon_note } from 'config/icons';
import { useTour } from "tour/TourProvider";
import { FDBox } from '@nex/fd-ui';
import { useNexTheme } from '@nex/theme-system';
import FDIconButton from 'components/UI/buttons/FDIconButton';

// ——————————————————————————————————————————————————————————
// INTERFACES
// ——————————————————————————————————————————————————————————
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
    },
    /**
   * Conteggio messaggi non letti calcolato dal backend (readRequests).
   * Il frontend lo usa solo per visualizzare il badge.
   */
    unreadCount?: number;
};

interface RenderRowProps {
    index: number;
    elm: DataClientProps;
    rowSelected: any;
    setRowSelected: (prev: any) => void;
    setOverviewStatus: (prev: any) => void;
    onViewedRow: (idBlock: string) => void;
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export const RenderRow: React.FC<RenderRowProps> = ({ index, elm, setRowSelected, rowSelected, setOverviewStatus, onViewedRow }) => {
    const { setOpenChat, createChatBlock, ViewdMessages } = useGeneralDataContext();
    const { isOpen, index: tourIndex, next } = useTour();


    // ——————————————————————————————————————————————————————————
    // BADGE CHAT
    // ——————————————————————————————————————————————————————————
    //  - La richiesta è "gestibile da tutto l'amministrativo", quindi la chat è di fatto "di gruppo" per chi ha ruolo amministrativo.
    //  - Il badge deve comparire quando ESISTONO messaggi non letti del commerciale (calcolati dal backend).
    //  - Non esiste "presa in carico" o assegnazione: quindi NON filtriamo per esito.da.username.
    //  - Se anche un solo amministrativo legge, il backend segna i messaggi come viewed=true, quindi unreadCount torna a 0 e il badge sparisce per tutti.
    const unread = elm?.unreadCount ?? 0;

    // Mostra il badge solo in base alla presenza di messaggi non letti
    const showUnreadBadge = unread > 0;

    const chatDisabled = isOpen && tourIndex === 4;
    const handleClick = () => {
        // se siamo allo step 4 del tour, avanzare PRIMA di aprire la modale
        if (isOpen && tourIndex === 4) {
            next();
            // lascia al Tour un frame per nascondere/ri-posizionare il popover
            requestAnimationFrame(() => {
                setRowSelected(index);
                setOverviewStatus(true);
            });
        } else {
            // comportamento normale
            setRowSelected(index);
            setOverviewStatus(true);
        }
    };

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    /**
   * Apertura chat:
   * - idBlock = elm._id (la richiesta è il “tema” della chat)
   * - openAfter true: comportamento invariato (apre subito)
   * - markViewedIfOther true: sostituisce la vecchia chiamata manuale a ViewdMessages
   *   (ora è centralizzato dentro createChatBlock)
   */
    const CreateChat = async () => {
        if (chatDisabled) return;
        if (!elm || !elm._id) {
            enqueueSnackbar(
                "Sembra che ci sia stato un problema nella creazione della chat, perfavore contatta l'assistenza.",
                { title: "Ops..", type: "error" }
            );
            return;
        }

        const [nomeAutore, cognomeAutore] = DivideName(elm.creata?.da?.nome ?? "");

        await createChatBlock({
            data: {
                idBlock: elm._id,
                titleBlock: `Sblocco Ordini ${elm.cliente?.nome ?? ""} - ${elm.cliente?.codice ?? ""}`,
                userID: elm.creata?.da?._id,
                nome: nomeAutore,
                cognome: cognomeAutore,
                path: "sbloccoOrdini",
                disabilitato: false,
            },
            settings: { loadFromRemote: true, createRemoteBlock: true, loadState: true },
            openAfter: true,          // apre la chat come prima
            markViewedIfOther: false,
        });

        // BADGE CHAT: spegne subito il badge nella tabella
        if (unread > 0) {
            ViewdMessages({
                idBlock: elm._id,
                path: "sbloccoOrdini",
                settings: { emit: true },
                onViewed: () => onViewedRow(elm._id), // <--- badge chat - aggiorna tabella dopo ack server
            });
        }
        setOpenChat(true);
    };

    const isSelected = rowSelected === index;

    const borderL = "border-l border-neutral-300/70 dark:border-white/10 pl-4";

    return <FDBox variant="gradient" asMotion={false} radius="2xl" onClick={handleClick} data-tour="sblocco-amm-details" data-selected={isSelected} //onClick={() => { setRowSelected(index); setOverviewStatus(true) }}
        className="w-full !justify-start overflow-x-auto overflow-y-hidden 
        flex flex-row w-full items-center text-slate-700 dark:text-neutral-100 cursor-pointer gap-2
        transition-colors active:bg-neutral-200 bg-white hover:bg-neutral-200 dark:bg-transparent dark:border dark:border-white/10 dark:hover:bg-white/5 
        data-[selected=true]:bg-neutral-100 data-[selected=true]:hover:bg-neutral-100 dark:data-[selected=true]:ring-blue-400/20 p-2">
        <div className="h-full flex flex-col items-center justify-center gap-1 min-w-[100px]">
            <Tag text={statusList[elm.stato]} fontSize='0.7rem' sx={{ ...StatusToColor((statusList as any)[elm.stato], darkMode) }} />

            {(!elm.codiciFb || (elm.codiciFb && Array.isArray(elm.codiciFb) && elm.codiciFb.length == 0)) ?
                <div className="flex flex-col items-center">
                    <p className="text-[0.7rem] font-light">Numero Fb:</p>
                    <p className="text-[0.7rem] font-semibold text-slate-700 dark:text-neutral-100">{elm.codiceFb}</p>
                </div>
                : <p className="text-[0.7rem] font-light">Gruppo di FB</p>}
        </div>

        <div className={`h-full flex flex-col items-center w-[300px] ${borderL}`}>
            <p className="text-[0.7rem] font-light">Richiesta Effettuata:</p>
            <p className="text-[0.7rem] font-light">{ConvertToItalianDate(elm.creata.data, { time: true })}</p>
            <p className="text-base font-semibold text-slate-700 dark:text-neutral-100">{elm.creata.da.username}</p>
        </div>

        <div className={`h-full flex flex-row justify-center items-center flex-[26.6] gap-2 min-w-[500px] ${borderL}`}>
            <div className="flex flex-col justify-center items-start min-w-[250px]">
                <p className="text-[0.7rem] font-light">Ragione Sociale</p>
                <p className="text-base font-semibold text-left text-slate-700 dark:text-neutral-100">{elm.cliente.nome}</p>
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

        <div className={`h-full flex flex-col justify-center items-start flex-[26.6] ${borderL}`}>
            <p className="text-[0.7rem] font-light">Totale Ordine</p>
            <p className="text-xl font-semibold text-slate-700 dark:text-neutral-100">{NumberToEuro({ convert: elm.prodotti.ordineTotale })}</p>
        </div>

        <div className={`h-full flex mr-2 items-center gap-2 ${borderL}`}>
            {(elm.creata.nota && elm.creata.nota.trim() !== "") &&
                <span className="text-neutral-400 dark:text-neutral-500"
                    data-tooltip-id='general-confg-suppliers-tooltip'
                    data-tooltip-content='In questa richiesta sono presenti delle note.'>
                    {icon_note({ width: 25, height: 25, color: `${darkMode ? palette.grey[700] : palette.grey[500]}` })}</span>
            }

            {/**
             * NEXV3 - DA CONTROLLARE PRIMA DI MESSA IN PRODUZIONE
             * BUTTONS */}
            <FDIconButton
                data-tour="sblocco-chat"
                className='h-fit'
                onClick={(e) => {
                    if (chatDisabled) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                    if (isOpen && tourIndex === 19) {
                        next();
                    }
                    CreateChat();
                }}
                disabled={chatDisabled}                  // se FDIconButton lo supporta
                aria-disabled={chatDisabled}             // fallback a11y
                tabIndex={chatDisabled ? -1 : 0}         // evita focus durante il lock
                data-tooltip-id='general-confg-suppliers-tooltip'
                data-tooltip-content={chatDisabled
                    ? 'Azione disabilitata durante il tour'
                    : 'Apri e visualizza la chat avvenuta in questo blocco.'}
                icon={<span className="relative inline-flex">
                    {icon_forum({ width: 25, height: 25, color: `${darkMode ? palette.grey[400] : palette.grey[700]}` })}
                    {showUnreadBadge && (
                        <span
                            className="
                                    absolute -top-1 -right-1
                                    min-w-[18px] h-[18px]
                                    px-1
                                    rounded-full
                                    text-[11px] leading-[18px]
                                    text-white
                                    bg-red-600
                                    text-center
                                    font-semibold
                                "
                        >
                            {unread > 99 ? '99+' : unread}
                        </span>
                    )}
                </span>}
            />
        </div>
    </FDBox>
}