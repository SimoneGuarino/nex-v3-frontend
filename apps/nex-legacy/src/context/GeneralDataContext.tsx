import React, { createContext, useContext, useState } from 'react';
import { UserContext } from 'context/UserContext';
import { GlobalDataAPI } from './FetchData/globalDataAPI';
import { enqueueSnackbar } from 'components/MessageBox';
import { getChatSocket } from '@nex/realtime-core';
const chatSocket = getChatSocket();
import { LoadMessagesAPI } from 'examples/Navbars/components/chat/fetchData/loadMessages';
import { ActionsOnRemoteBlocksAPI } from 'examples/Navbars/components/chat/fetchData/actionsOnRemoteBlocks';
import { CAPS } from 'authz/caps';
import { useAuthz } from 'authz/useAuthz';

// ——————————————————————————————————————————————————————————
// TYPESCRIPT INTERFACES
// ——————————————————————————————————————————————————————————
export interface UserDetails {
    _id: string;
    nome: string;
    cognome: string;
    ruolo: number;
    permissions: (number | string)[];
};

export interface UserContextValue {
    details?: UserDetails;
    // estendi se il tuo UserContext contiene altro
};

export interface Agent {
    codici?: { agente: string | null; buyer?: string | null } | null;
    username?: string;
    nome?: string;
    cognome?: string;
    [k: string]: any;
};

export interface Buyer {
    codici?: { agente?: string | null; buyer: string | null } | null;
    username?: string;
    nome?: string;
    cognome?: string;
    [k: string]: any;
};

export interface PriceList {
    codice?: string | number;
    descrizione?: string;
    [k: string]: any;
};

export interface GlobalData {
    agents: Agent[];
    buyers: Buyer[];
    pricesLists: PriceList[];
};

export interface ChatUser {
    _id: string;
    nome: string;
    cognome: string;
};

// tipo per usersOnline (da adattare in base ai dati reali)
export type OnlineUsers = {
    nome: string;
    cognome: string;
    bio: string;
    stato: {
        ultimoAccesso: string;
        codice: "Online" | "Offline" | "Assente";
    };
    immagini: {
        avatar: string;
        cover: string;
    };
};

export interface ChatMessage {
    // campi minimi usati dal codice
    date?: string | number | Date;
    viewed?: boolean;
    // estendibile
    [key: string]: unknown;
};

export interface ChatBlock {
    idBlock: string;
    titleBlock: string;
    path?: string;
    disabilitato?: boolean;
    users: ChatUser[];
    messages: ChatMessage[];
    lastInteraction?: number;
    totalMessages?: number; // per compatibilità con componenti che lo leggono
};

export interface CreateNewChatBlockParams {
    data: {
        idBlock?: string | null; // può essere null in creazione remota
        titleBlock?: string;
        userID: string;
        nome: string;
        cognome: string;
        path?: string;
        message?: ChatMessage;
        disabilitato?: boolean;
    };
    settings?: {
        loadState?: boolean;
        avoidToFocus?: boolean;
        createRemoteBlock?: boolean;
        loadFromRemote?: boolean;
    };
    messagesData_?: ChatBlock[];
    overviewMessage_?: ChatBlock | null; // ora opzionale
};

export interface ViewdMessagesParams {
    idBlock: string;
    path?: string;
    settings?: { emit?: boolean };
    // Badge chat: chiamato SOLO quando il server conferma status:true
    onViewed?: () => void;
};

export interface ActionOnBlockParams {
    data: { idb: string;[k: string]: unknown };
    tp: 0 | 1 | 2; // 0=crea | 1=edit | 2=delete
    idBlock?: string;
};

export interface DeleteBlockParams {
    idBlock: string;
};

export interface CloseBlockParams {
    idBlock: string;
    settings?: { emit?: boolean };
};

/* risposta attesa da LoadMessagesAPI (tipizzazione minima) */
type RemoteMessagesResponse = {
    remoteMessages: ChatMessage[] | null | undefined;
    isBlockDisabled?: boolean;
};

/* socket minimale per emit */
interface SocketLike {
    emit: (
        event: string,
        payload: any,
        cb?: (response: any) => void
    ) => void;
}

export type IncomingSocketMsg = {
    idBlock: string;
    titleBlock?: string;
    message: { user: { _id: string; nome: string; cognome: string }, date: string | number;[k: string]: any };
    path: "privata" | string;
    disabilitato?: boolean;
    _id?: string; // id messaggio server
};

/* ===== valore del context ===== */
export interface GeneralDataContextValue {
    globalData: GlobalData;
    setGlobalData: React.Dispatch<React.SetStateAction<GlobalData>>;

    usersOnline: OnlineUsers[];
    setUsersOnline: React.Dispatch<React.SetStateAction<OnlineUsers[]>>;

    openChat: boolean;
    setOpenChat: React.Dispatch<React.SetStateAction<boolean>>;

    messagesData: ChatBlock[];
    setMessagesData: React.Dispatch<React.SetStateAction<ChatBlock[]>>;

    privateMessagesData: ChatBlock[];
    setPrivateMessagesData: React.Dispatch<React.SetStateAction<ChatBlock[]>>;

    overviewMessage: ChatBlock | null;
    setOverviewMessage: React.Dispatch<React.SetStateAction<ChatBlock | null>>;

    chatLoad: boolean;
    setChatLoad: React.Dispatch<React.SetStateAction<boolean>>;

    CreateNewChatBlock: (args: CreateNewChatBlockParams) => Promise<{ idBlock?: string | null; messages: ChatBlock[] }>;
    ViewdMessages: (args: ViewdMessagesParams) => void;
    DeleteBlock: (args: DeleteBlockParams) => void;
    ActionOnBlock: (args: ActionOnBlockParams) => void;
    CloseBlock: (args: CloseBlockParams) => void;

    // nuove API
    createPrivateChat: (params: {
        data: {
            idBlock?: string | null;
            userID: string;
            nome: string;
            cognome: string;
            path?: string;              // "privata"
            disabilitato?: boolean;
            message?: ChatMessage;      // opzionale
        },
        settings?: {
            loadFromRemote?: boolean;
            createRemoteBlock?: boolean;
            avoidToFocus?: boolean;
        },
        openAfter?: boolean;
    }) => Promise<{ idBlock?: string | null; messages: ChatBlock[] }>;
    createPrivateChatsBatch: (items: Array<{
        data: {
            idBlock?: string | null;
            userID: string;
            nome: string;
            cognome: string;
            path?: string;              // "privata"
            disabilitato?: boolean;
        },
        settings?: {
            loadFromRemote?: boolean;
            createRemoteBlock?: boolean;
        },
        openAfter?: boolean;
    }>) => Promise<{ idBlock?: string | null; messages: ChatBlock[] }[]>;
    upsertIncomingMessageFromSocket: (data: IncomingSocketMsg) => Promise<void>;
    createChatBlock: (params: {
        data: {
            idBlock?: string | null;
            titleBlock?: string;
            userID: string;
            nome: string;
            cognome: string;
            path: string;               // "fido" | "privata" | ...
            message?: ChatMessage;
            disabilitato?: boolean;
        };
        settings?: {
            loadFromRemote?: boolean;
            createRemoteBlock?: boolean;
            avoidToFocus?: boolean;
            loadState?: boolean;
        };
        openAfter?: boolean;
        markViewedIfOther?: boolean;  // default true
        applyState?: boolean;
    }) => Promise<{ idBlock?: string | null; messages: ChatBlock[] }>;
};

/* ===== provider ===== */
type ProviderProps = { children: React.ReactNode };


// ——————————————————————————————————————————————————————————
// CREAZIONE DEL CONTEXT
// ——————————————————————————————————————————————————————————
/* ===== creazione context ===== */
const GeneralDataContext = createContext<GeneralDataContextValue | undefined>(undefined);

export function useGeneralDataContext(): GeneralDataContextValue {
    const ctx = useContext(GeneralDataContext);
    if (!ctx) {
        throw new Error('useGeneralDataContext deve essere usato dentro GeneralDataProvider');
    }
    return ctx;
};


// ——————————————————————————————————————————————————————————
// PROVIDER COMPONENT
// ——————————————————————————————————————————————————————————
export function GeneralDataProvider({ children }: ProviderProps) {
    const [userContext, setUserContext] = React.useContext(
        UserContext as unknown as React.Context<[UserContextValue, React.Dispatch<any>]>
    );

    const { isReady } = useAuthz();

    // stato di abort per il controller delle chiamate Fetch.
    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        };
    };

    // dichiarazione degli stati globali.
    const [globalData, setGlobalData] = useState<GlobalData>({ agents: [], buyers: [], pricesLists: [] });
    const [usersOnline, setUsersOnline] = useState<OnlineUsers[]>([]);

    // stati per il chat system
    const [openChat, setOpenChat] = useState<boolean>(false);
    const [chatLoad, setChatLoad] = useState<boolean>(true);

    const [messagesData, setMessagesData] = React.useState<ChatBlock[]>([]); // chat a blocchi
    const [privateMessagesData, setPrivateMessagesData] = React.useState<ChatBlock[]>([]);
    const [overviewMessage, setOverviewMessage] = React.useState<ChatBlock | null>(null);

    // ref con lo stato "corrente" (evita stale state durante await)
    const privateMessagesRef = React.useRef(privateMessagesData);
    React.useEffect(() => { privateMessagesRef.current = privateMessagesData }, [privateMessagesData]);

    const messagesRef = React.useRef(messagesData);
    React.useEffect(() => { messagesRef.current = messagesData; }, [messagesData]);

    const overviewMessageRef = React.useRef(overviewMessage);
    React.useEffect(() => { overviewMessageRef.current = overviewMessage; }, [overviewMessage]);

    // piccola helper per applicare il nuovo stato in modo consistente
    function applyPrivateMessages(next: ChatBlock[]) {
        setPrivateMessagesData(next);
        privateMessagesRef.current = next;
    };

    // coda operazioni per serializzare (evita race su stessa lista)
    const opQueueRef = React.useRef<Promise<any>>(Promise.resolve());
    function enqueueOp<T>(fn: () => Promise<T>): Promise<T> {
        const next = opQueueRef.current.then(fn);
        opQueueRef.current = next.catch((e) => { console.error(e); throw e; }); // non bloccare la coda su errori
        return next;
    };

    // API unica per creare/ottenere chat privata e aggiornare lo stato
    async function createPrivateChat(params: {
        data: {
            idBlock?: string | null;
            userID: string;
            nome: string;
            cognome: string;
            path?: string;              // "privata"
            message?: ChatMessage;      // opzionale
            disabilitato?: boolean;
            titleBlock?: string;
        };
        settings?: {
            loadFromRemote?: boolean;   // default true
            createRemoteBlock?: boolean;// default true
            avoidToFocus?: boolean;
            loadState?: boolean;        // default true
        };
        openAfter?: boolean;          // default true
    }): Promise<{ idBlock?: string | null; messages: ChatBlock[] }> {
        const { data, openAfter = true } = params;
        const settings = {
            loadFromRemote: true,
            createRemoteBlock: true,
            loadState: true,
            ...params.settings,
        };

        return enqueueOp(async () => {
            // snapshot attuale
            const prev = privateMessagesRef.current;

            // chiama la tua CreateNewChatBlock (già async, già robusta) :contentReference[oaicite:0]{index=0}
            const { idBlock, messages } = await CreateNewChatBlock({
                data,
                settings,
                messagesData_: prev,
            });

            // applichiamo il risultato in modo atomico
            applyPrivateMessages(messages);

            if (openAfter) setOpenChat(true);

            return { idBlock, messages };
        });
    };

    // batch (per il tuo pannello Share): limita concorrenza ed evita race
    async function createPrivateChatsBatch(items: Array<{
        data: {
            idBlock?: string | null;
            userID: string;
            nome: string;
            cognome: string;
            path?: string;
        };
    }>): Promise<{ idBlock?: string | null; messages: ChatBlock[] }[]> {
        const results: { idBlock?: string | null; messages: ChatBlock[] }[] = [];
        // seriale -> massima coerenza, in coda con enqueueOp
        for (const it of items) {
            const res = await createPrivateChat({
                data: { ...it.data, path: it.data.path ?? "privata" },
                openAfter: false
            });
            results.push(res);
        }
        // apri la chat dopo l'ultimo elemento (comportamento originale)
        setOpenChat(true);
        return results;
    };

    async function upsertIncomingMessageFromSocket(data: IncomingSocketMsg) {
        const payload = {
            idBlock: data.idBlock,
            titleBlock: data.titleBlock,
            userID: data.message.user._id,
            nome: data.message.user.nome,
            cognome: data.message.user.cognome,
            message: { ...data.message, _id: data._id, date: new Date(data.message.date).getTime() },
            path: data.path,
            disabilitato: data.disabilitato ?? false,
        };

        // scegli lo snapshot giusto (privato vs non privato)
        const isPrivate = data.path === "privata";
        const prevList = isPrivate ? privateMessagesRef.current : messagesRef.current;

        // esegui in coda per evitare interleaving tra eventi consecutivi
        await enqueueOp(async () => {
            const { messages } = await CreateNewChatBlock({
                data: payload,
                settings: { avoidToFocus: true, loadFromRemote: false }, // non ricariamo dal remoto per ogni singolo msg
                messagesData_: prevList,
                overviewMessage_: overviewMessageRef.current,
            });

            // applica il nuovo stato
            if (isPrivate) {
                setPrivateMessagesData(messages);
                privateMessagesRef.current = messages;
            } else {
                setMessagesData(messages);
                messagesRef.current = messages;
            }

            // se la chat aperta è proprio questo blocco → marca come letto
            const ov = overviewMessageRef.current;
            if (ov && ov.idBlock === data.idBlock) {
                ViewdMessages({ idBlock: data.idBlock, path: data.path, settings: { emit: true } });
            }
        });
    };

    async function createChatBlock(params: {
        data: {
            idBlock?: string | null;
            titleBlock?: string;
            userID: string;
            nome: string;
            cognome: string;
            path: string;               // "fido" | "privata" | ...
            message?: ChatMessage;
            disabilitato?: boolean;
        };
        settings?: {
            loadFromRemote?: boolean;
            createRemoteBlock?: boolean;
            avoidToFocus?: boolean;
            loadState?: boolean;
        };
        openAfter?: boolean;
        markViewedIfOther?: boolean;  // default true
        applyState?: boolean;
    }): Promise<{ idBlock?: string | null; messages: ChatBlock[] }> {
        const { data, openAfter = true, markViewedIfOther = true, applyState = true } = params;
        const settings = { loadFromRemote: true, createRemoteBlock: true, loadState: true, ...params.settings };

        // scegli lista in base al path
        const isPrivate = data.path === "privata";
        const listRef = isPrivate ? privateMessagesRef : messagesRef;
        const setList = isPrivate ? setPrivateMessagesData : setMessagesData;

        return enqueueOp(async () => {
            const prev = listRef.current;

            const { idBlock, messages } = await CreateNewChatBlock({
                data,
                settings,
                messagesData_: prev,
                overviewMessage_: overviewMessageRef.current,
            });

            if (applyState && messages && messages.length > 0) {
                setList(messages);
                listRef.current = messages;
            }

            if (markViewedIfOther && idBlock) {
                const block = messages.find(b => b.idBlock === idBlock);
                const otherMsg = !!block?.messages?.some((m: any) => m?.user?._id && m.user?._id !== userContext?.details?._id);
                if (otherMsg) ViewdMessages({ idBlock, path: data.path, settings: { emit: true } });
            }

            if (openAfter) setOpenChat(true);
            return { idBlock, messages };
        });
    }

    /**
     * crea un nuovo blocco di chat o unisce i messaggi recuperati
     */
    const CreateNewChatBlock = async ({ data, settings, messagesData_ = messagesData, overviewMessage_ }: CreateNewChatBlockParams)
        : Promise<{ idBlock?: string | null; messages: ChatBlock[] }> => {
        const overviewMessage__ = overviewMessage_ ?? overviewMessage;
        const indexMap = new Map<string, number>(messagesData_.map((value, index) => [value.idBlock, index]));
        const newMessagesData: ChatBlock[] = [...messagesData_];
        let newOverviewMessage = overviewMessage__ || null;

        let idBlock = data?.idBlock;
        //const idKey = typeof idBlock === 'string' ? idBlock : undefined;

        const titleBlock = data?.titleBlock;
        const userID = data?.userID;
        const nome = data?.nome;
        const cognome = data?.cognome;
        const message = data?.message;
        const path = data?.path;

        /**
         * Helpers per gestire le date dei messaggi in modo robusto.
         * Perché: l'ordine dei messaggi in memoria non è garantito (socket / optimistic update / merge),
         * quindi NON possiamo fidarci di messages[0] o messages[last] per calcolare oldmsg/newmsg.
         */
        function toTs(d: any): number | null {
            if (!d) return null;
            const t = new Date(d).getTime();
            return Number.isFinite(t) ? t : null;
        };

        function getOldestAndNewest(messages: any[]): { oldest: Date | null; newest: Date | null } {
            let min = Infinity;
            let max = -Infinity;

            for (const m of messages || []) {
                const ts = toTs(m?.date);
                if (ts == null) continue;
                if (ts < min) min = ts;
                if (ts > max) max = ts;
            }

            return {
                oldest: min !== Infinity ? new Date(min) : null,
                newest: max !== -Infinity ? new Date(max) : null,
            };
        };

        // creazione del blocco se non esiste all'interno di indexedDB
        function CreateBlock(messageRemoteData?: ChatMessage[] | null, isBlockDisabled?: boolean) {
            const chatBlock_: ChatBlock = {
                idBlock: idBlock as string, // CreateBlock viene chiamata solo quando idBlock è valorizzato
                titleBlock: titleBlock ?? "",
                path,
                disabilitato: isBlockDisabled !== undefined ? isBlockDisabled : data.disabilitato,
                users: [
                    { _id: userID, nome, cognome },
                    {
                        _id: userContext.details!._id,
                        nome: userContext.details!.nome,
                        cognome: userContext.details!.cognome,
                    },
                ],
                messages: message ? [...(messageRemoteData || []), message] : [...(messageRemoteData || [])],
            };

            console.log("CreateBlock -> ", chatBlock_);

            newMessagesData.unshift(chatBlock_);
            if (!settings || !settings.avoidToFocus) {
                newOverviewMessage = chatBlock_;
                setOverviewMessage(chatBlock_); // focus
            };

            // aggiorna lo stato globale di overviewMessage se necessario
            if (overviewMessage__ && overviewMessage__.idBlock === (idBlock as string)) {
                setOverviewMessage(newOverviewMessage);
            };

            if (settings?.loadState) {
                setChatLoad(false);
            };
        };

        // unione dei messaggi
        function JoinMessages(messageRemoteData?: ChatMessage[] | null, mode: "older" | "newer" = "older") {
            if (idBlock && indexMap.has(idBlock) && userContext?.details) {
                const idx = indexMap.get(idBlock)!;
                const block = { ...newMessagesData[idx] };

                // const messages = messagesData_[idx].messages;
                // block.messages = [...(messageRemoteData || []), ...messages];

                const current = messagesData_[idx].messages || [];
                const incoming = messageRemoteData || [];

                /**
                 * Regola di merge:
                 * - mode === "older": incoming contiene messaggi PIÙ VECCHI (scroll su) => vanno PRIMA
                 * - mode === "newer": incoming contiene messaggi PIÙ NUOVI (sync)     => vanno DOPO
                 */
                block.messages = mode === "newer"
                    ? [...current, ...incoming]
                    : [...incoming, ...current];

                // se stiamo aggiungendo anche un messaggio locale (socket/optimistic)
                if (message) {
                    block.messages = [...block.messages, message];
                }

                /**
                 * Anti-duplicati:
                 * capita spesso che lo stesso messaggio arrivi:
                 * - una volta via socket (receiveMessage)
                 * - una volta via fetch (newmsg)
                 * Se hanno lo stesso _id, ne teniamo uno solo.
                 */
                const seen = new Set<string>();
                block.messages = block.messages.filter((m: any) => {
                    const id = m?._id;
                    if (!id) return true;          // se manca _id non possiamo deduplicare, lo teniamo
                    if (seen.has(id)) return false;
                    seen.add(id);
                    return true;
                });


                if (overviewMessage__ && overviewMessage__.idBlock === block.idBlock) {
                    newOverviewMessage = { ...overviewMessage__, messages: block.messages };
                }

                newMessagesData.splice(idx, 1);
                newMessagesData.unshift(block);

                if (!settings || !settings.avoidToFocus) {
                    setOverviewMessage(block); // focus
                }

                // aggiorna lo stato globale di overviewMessage se necessario
                if (overviewMessage__ && overviewMessage__.idBlock === block.idBlock) {
                    setOverviewMessage(newOverviewMessage);
                }
            }

            if (settings?.loadState) {
                setChatLoad(false);
            }
        };

        // caricamento dei dati dal DB remoto
        const LoadMessageFromRemote = async () => {
            /**
             * Strategia:
             * - Se il blocco NON esiste ancora in memoria => carichiamo lo "storico" iniziale (default: oldmsg null)
             * - Se il blocco ESISTE già in memoria => facciamo SYNC dei messaggi NUOVI usando newmsg,
             *   perché è proprio il caso del bug: badge ok ma chat non mostra i nuovi messaggi senza refresh.
             *
             * Nota: il backend vuole oldmsg/newmsg mutuamente esclusivi.
             */
            let mode: "older" | "newer" = "older";
            let oldestMessageDateByIdBlock: Date | null = null;
            let newestMessageDateByIdBlock: Date | null = null;

            if (idBlock && indexMap.has(idBlock)) {
                const idx = indexMap.get(idBlock)!;
                const localMessages = newMessagesData[idx].messages || [];

                const { oldest, newest } = getOldestAndNewest(localMessages);

                oldestMessageDateByIdBlock = oldest; // utile per scroll in altri punti
                newestMessageDateByIdBlock = newest; // fondamentale per sync nuovi msg

                // quando il blocco esiste già, vogliamo prima di tutto i NUOVI
                mode = "newer";
            };

            const payload: any = {
                userContext,
                abortController,
                idb: (idBlock ?? null) as any,

                // oldmsg / newmsg: ne mandiamo UNO SOLO
                oldestMessageDateByIdBlock: mode === "older" ? oldestMessageDateByIdBlock : null,
                newestMessageDateByIdBlock: mode === "newer" ? newestMessageDateByIdBlock : null,
            };

            await (LoadMessagesAPI as any)(payload).then((res: RemoteMessagesResponse) => {
                const { remoteMessages, isBlockDisabled } = res || {};

                if (idBlock && !indexMap.has(idBlock)) {
                    CreateBlock(remoteMessages || [], isBlockDisabled);
                } else {
                    JoinMessages(remoteMessages || [], mode);
                }
            });
        };

        if (!settings || settings.loadFromRemote) {
            if (settings?.loadState) setChatLoad(true);

            if (settings?.createRemoteBlock) {
                const data_ = {
                    idb: idBlock as string, titleBlock, path, disabilitato: data.disabilitato, users: [
                        { _id: userID, nome, cognome },
                        {
                            _id: userContext.details!._id,
                            nome: userContext.details!.nome,
                            cognome: userContext.details!.cognome,
                        },
                    ],
                };

                // Qui ATTENDI davvero la creazione
                const newIdBlock: string | undefined = await (ActionsOnRemoteBlocksAPI as any)({
                    userContext, abortController, data: data_, tp: 0, idBlock
                }).catch((e: any) => console.error(" 1a | " + e));

                if (newIdBlock) idBlock = newIdBlock;

                // Poi ATTENDI il load dei messaggi
                await LoadMessageFromRemote().catch((e: any) => console.error(" 1b | ", e));
            } else {
                await LoadMessageFromRemote().catch((e: any) => console.error(" 2a | ", e));
            }
        } else {
            if (idBlock && !indexMap.has(idBlock)) CreateBlock();
            else JoinMessages();
        };

        console.log('CreateNewChatBlock (DONE) -> ', { idBlock, messages: newMessagesData || [] });
        return { idBlock, messages: newMessagesData || [] };
    };


    /**
     * funzione che permette la visualizzazione del messaggio.
     * @param idBlock id del blocco
     * @param settings { emit: true | false (default: false) }
     */
    const ViewdMessages = ({ idBlock, path, settings, onViewed }: ViewdMessagesParams) => {
        function SetViewed() {
            // aggiorna la data dell'ultima interazione con il blocco.
            // permette inoltre di triggerare fetchMessages nel blocco per aggiornare la viewed del messaggio in tempo reale.
            const setDataFunction = path !== 'privata' ? setMessagesData : setPrivateMessagesData;

            setDataFunction((prevMessages) => {
                if (prevMessages && Array.isArray(prevMessages) && prevMessages.length > 0) {
                    const copy = [...prevMessages];
                    const indexCopyMap = new Map<string, number>(copy.map((value, index) => [value.idBlock, index]));

                    const idx = indexCopyMap.get(idBlock);
                    if (idx !== undefined && idx !== -1) {
                        copy[idx].lastInteraction = new Date().getTime();
                        copy[idx].messages = copy[idx].messages.map((m) =>
                            m.viewed ? m : { ...m, viewed: true }
                        );

                        setOverviewMessage((latestPrev) => {
                            if (latestPrev) {
                                const latestBlock = { ...latestPrev };
                                latestBlock.messages = copy[idx].messages;
                                return latestBlock;
                            }
                            return null;
                        });
                    }
                    return copy;
                }
                return prevMessages;
            });
        }

        if (settings?.emit) {
            const sock = chatSocket as unknown as SocketLike | null;
            if (sock) {
                sock.emit(
                    'viewMessage',
                    { userID: userContext.details!._id, idBlock, path },
                    (response: any) => {
                        if (response?.status) {
                            SetViewed();
                            // badge chat: aggiorna UI esterna (es. tabella) SOLO dopo ack server
                            onViewed?.();
                        }
                    }
                );
            } else {
                enqueueSnackbar("Non è stato possibile connettersi al server, riprova tra qualche istante.", {
                    title: 'Ops.. Errore in risposta dal server',
                    type: 'error',
                });
            }
        } else {
            SetViewed();
        }
    };

    /**
     * modifica/creazione dei dati del blocco sul DB.
     * @param data parametri da inviare | idb: string
     * @param tp 0 = creazione | 1 = edit | 2 = delete
     */
    const ActionOnBlock = ({ data, tp, idBlock }: ActionOnBlockParams) => {
        if (data && (data as any).idb) {
            (ActionsOnRemoteBlocksAPI as any)({ userContext, abortController, data, tp, idBlock });
        } else {
            console.error('idBlock è undefined');
        }
    };

    /**
     * elimina il blocco dalla chat sul frontside.
     */
    const DeleteBlock = ({ idBlock }: DeleteBlockParams) => {
        setMessagesData((prev) => {
            const copy = [...prev];
            const findBlock = copy.findIndex((x) => x.idBlock === idBlock);
            if (findBlock !== -1) {
                copy.splice(findBlock, 1);
                if (overviewMessage && overviewMessage.idBlock === idBlock) {
                    setOverviewMessage(null);
                }
            }
            return copy;
        });
    };

    // invia la disabilitazione del blocco in tempo reale
    const CloseBlock = ({ idBlock, settings }: CloseBlockParams) => {
        // disabilita il blocco in tempo reale
        const DisableBlock = () => {
            setOverviewMessage((prev) => {
                if (prev) {
                    const block_ = { ...prev };
                    block_.disabilitato = true;
                    return block_;
                }
                return prev;
            });

            setMessagesData((prev) => {
                const blocks = [...prev];
                const findIndex = blocks.findIndex((x) => x.idBlock === idBlock);
                if (findIndex !== -1) {
                    blocks[findIndex].disabilitato = true;
                }
                return blocks;
            });
        };

        if (settings?.emit) {
            const sock = chatSocket as unknown as SocketLike | null;
            if (sock && idBlock) {
                sock.emit(
                    'closeBlock',
                    { userID: userContext.details!._id, idBlock },
                    (response: any) => {
                        if (response && !response.status) {
                            enqueueSnackbar("Sembra che ci sia stato un problema durante l'invio del messaggio, riprova tra qualche istante.", {
                                title: 'Ops.. Errore in risposta dal server',
                                type: 'error',
                            });
                        } else {
                            DisableBlock();
                        }
                    }
                );
            }
        } else {
            DisableBlock();
        }
    };

    React.useEffect(() => {
        if (!isReady) return;

        if (((globalData.agents && globalData.agents.length > 0) &&
            (globalData.buyers && globalData.buyers.length > 0))) {
            return;
        };

        GlobalDataAPI({ abortController, setGlobalData });
    }, [userContext]);

    const value: GeneralDataContextValue = {
        globalData,
        setGlobalData,
        usersOnline,
        setUsersOnline,

        openChat,
        setOpenChat,
        messagesData,
        setMessagesData,
        privateMessagesData,
        setPrivateMessagesData,
        overviewMessage,
        setOverviewMessage,
        CreateNewChatBlock,
        ViewdMessages,
        chatLoad,
        setChatLoad,
        DeleteBlock,
        ActionOnBlock,
        CloseBlock,

        // nuove API
        createPrivateChat,
        createPrivateChatsBatch,
        upsertIncomingMessageFromSocket,
        createChatBlock,
    };

    return (
        <GeneralDataContext.Provider value={value}>
            {children}
        </GeneralDataContext.Provider>
    );
};