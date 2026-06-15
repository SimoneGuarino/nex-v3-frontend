import {
    Badge, Collapse, Divider, Fade, IconButton,
    InputBase, Stack
} from "@mui/material"
import { MainTheme } from "assets/settingsTheme"
import MDTypography from "components/MDTypography"
import {
    icon_back, icon_check,
    icon_close,
    icon_doubleCheck, icon_emoji, icon_file, icon_info,
    icon_search
} from "config/icons"

import React, { Suspense } from "react"
import MDButton from "components/MDButton"
import SimpleEmojiPicker from "components/EmojiPicker"
import { useGeneralDataContext } from "context/GeneralDataContext"
import type { ChatBlock } from "context/GeneralDataContext"
import { TransitionGroup } from "react-transition-group"
import { getChatSocket } from '@nex/realtime-core';
const chatSocket = getChatSocket();
import { UserContext } from "context/UserContext"
import { enqueueSnackbar } from "components/MessageBox"
import { allowedExtensions, AttachmentsForm } from "components/Upload"

import NoProductFound from "assets/images/noData/no_conversation_avaible.webp";
import { LoadMessagesAPI } from "./fetchData/loadMessages"
import { Tag } from "components/Tag/Tag"
import { SearchUsersAPI } from "./fetchData/search"
import { UsersBlocks } from "./components/usersBlocks"
import { LoadScreen } from "components/Load"
import { Message } from "./components/message"
import { FDBox } from "@nex/fd-ui";
import { UserAvatar } from "../userInfo"
import { useTour } from "tour/TourProvider";
import { useNexTheme } from "@nex/theme-system"


interface UserContextProps {
    details: {
        _id: string;
        nome: string;
        cognome: string;
    }
};

/*interface AttachmentsProps {
    fileID: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
};

interface MessageProp {
    user: {
        _id: string;
        nome: string;
        cognome: string;
    }
    variant?: string;
    msg: string;
    sended: boolean;
    viewed: boolean;
    date: Date;
    attachments: Array<AttachmentsProps>
}*/

function stripPath(name: string) {
    return name.replace(/[/\\]+/g, "_");
};

// Componente ottimizzato per evitare re-render non necessari
const MemoizedEmojiPicker = React.memo(({ onEmojiClick }: { onEmojiClick: any }) => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SimpleEmojiPicker onEmojiClick={onEmojiClick} />
        </Suspense>
    );
});


interface WriteProp {
    selectedFile: File[];
    setSelectedFile: (prev: any) => void;
    SendMessage: ({ message }: { message: string }) => void;
};
const Write: React.FC<WriteProp> = ({ selectedFile, setSelectedFile, SendMessage }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [inputValue, setInputValue] = React.useState('');
    const [open, setOpen] = React.useState(false);
    const inputRef = React.useRef(inputValue);
    const containerRef = React.useRef<any>(null);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        inputRef.current = event.target.value;
        setInputValue(event.target.value);
    };

    const handleEmojiClick = React.useCallback((emojiObject: any) => {
        inputRef.current += emojiObject.emoji;
        setInputValue(inputRef.current);
    }, []);

    const handleStatusChange = () => {
        setOpen((prevOpen: any) => !prevOpen);
    };

    const handleReset = () => {
        inputRef.current = '';
        setInputValue('');
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            if (event.shiftKey) {
                // Shift + Enter: vai a capo
                return;
            } else {
                // Solo Enter: invia il messaggio
                event.preventDefault(); // Impedisce il comportamento predefinito (andare a capo)
                SendBridge();
            }
        }
    };

    const SendBridge = () => {
        if (inputValue.length > 0 && inputValue.trim() !== "") {
            setOpen(false);
            SendMessage({ message: inputValue });
            handleReset();
        };
    };

    /**
     * Permette il delete del elemento selezionato
     * @param index number | index del elemento all'interno dell'array
     */
    const deleteAttached = (index: number) => {
        setSelectedFile((prev: any) => {
            const newSelectedFile = [...prev]; // Create a copy of the array
            newSelectedFile.splice(index, 1); // Remove the element at the specified index
            return newSelectedFile; // Return the updated array
        });
    }

    return (
        <Stack ref={containerRef} sx={{ m: 2, border: `1px solid ${darkMode ? palette.grey[800] : '#e7e7e7'}`, borderRadius: 3 }}>
            {<TransitionGroup style={{ maxHeight: 250, overflow: 'auto' }}>
                {selectedFile.length > 0 && <Collapse>
                    <Stack>
                        <MDTypography sx={{ pl: 2, pt: 1, pb: 1 }}>Allegati</MDTypography>
                        <TransitionGroup style={{ maxHeight: 250, overflow: 'auto' }}>
                            {selectedFile.map((item: any, index: number) => (
                                <Collapse key={index}><Stack direction='row' width='100%' gap={1} alignItems='center' p='5px 10px'>
                                    {icon_file({ width: 20, height: 20 })}
                                    <MDTypography variant='body2' fontSize="0.8rem">
                                        {item.name}
                                    </MDTypography>
                                    <IconButton onClick={() => deleteAttached(index)} sx={{ ml: 'auto', padding: "3px" }} aria-label="delete" size="small">
                                        {icon_close()}
                                    </IconButton>
                                </Stack></Collapse>
                            ))
                            }
                        </TransitionGroup>
                        <Divider sx={{ backgroundColor: '#000' }} />
                    </Stack>
                </Collapse>}
            </TransitionGroup>}
            <TransitionGroup>
                {open && <Collapse><MemoizedEmojiPicker onEmojiClick={handleEmojiClick} /></Collapse>}
            </TransitionGroup>
            <Stack mt='auto'>
                <InputBase
                    sx={{
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        fontSize: '1rem', p: 1, mt: 'auto', color: `${darkMode ? '#fff' : '#000'}`,
                        "& .MuiInputBase-input": { maxHeight: 100, alignSelf: 'flex-start' }
                    }}
                    onKeyDown={handleKeyDown}
                    multiline
                    placeholder="scrivi qui.."
                    maxRows={4} // Specifica il numero massimo di righe se desiderato
                    value={inputValue}
                    onChange={handleInputChange}
                />
                <Stack direction="row" mb={1} pr={2}>
                    <Stack direction='row'>
                        <IconButton onClick={handleStatusChange}>
                            {icon_emoji()}
                        </IconButton>
                        <AttachmentsForm selectedFile={selectedFile} setSelectedFile={setSelectedFile} />
                    </Stack>

                    <Stack direction="row" ml="auto" gap={1}>
                        <MDButton variant="outlined" color="error" onClick={handleReset}>
                            Elimina
                        </MDButton>
                        {inputValue.length != 0 && inputValue.trim() !== "" &&
                            <MDButton sx={{ backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[800]}` }} disabled={inputValue.length == 0 && inputValue.trim() === ""}
                                variant="contained" onClick={SendBridge}>
                                Invia
                            </MDButton>}
                    </Stack>
                </Stack>
            </Stack>
        </Stack>
    );
};

interface InspectMessageProps {
    overviewMessage: ChatBlock;
    selectedFile: File[];

    setSelectedFile: (prev: any) => void;
    ClearOverview: () => void;
    SendMessage: ({ message }: { message: string }) => void;
};
const InspectMessage: React.FC<InspectMessageProps> = ({ overviewMessage, selectedFile, setSelectedFile, ClearOverview, SendMessage }) => {
    const { setOverviewMessage } = useGeneralDataContext();

    const [userContext, setUserContext] = React.useContext<null | any | UserContextProps>(UserContext);
    const abortController = React.useRef(null);

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const loadOneTime = React.useRef<boolean>(false);
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    //tour
    const chatTourId = React.useMemo(() => {
        if (!overviewMessage?.path) {
            // fallback: vecchio id usato nel tour "gestioneRichiesteFido"
            return "dettagli-header-chat-2";
        }

        // es. chat aperta dal pannello "Gestione Richieste Fido"
        if (overviewMessage.path === "gestioneRichiesteFido") {
            return "dettagli-header-chat-2";
        }

        // es. chat aperta da Sblocco Ordini
        if (overviewMessage.path === "sbloccoOrdini") {
            return "sblocco-chat-2";
        }

        // default: mantieni quello del tour fido/gestioneRichiesteFido
        return "dettagli-header-chat-2";
    }, [overviewMessage?.path]);

    const { isOpen, index: tourIndex } = useTour();

    const lockChatInteractions = React.useMemo(() => {
        if (!isOpen) return false;
        if (["fido", "gestioneRichiesteFido"].includes(overviewMessage?.path ?? "")) {
            return tourIndex === 9;
        }
        if (overviewMessage?.path === "sbloccoOrdini") {
            return tourIndex === 21;
        }
        return false;
    }, [isOpen, tourIndex, overviewMessage?.path]);
    //

    React.useEffect(() => {
        if (containerRef.current) {
            if (!loadOneTime.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
            };
        };
    }, [overviewMessage.messages]); // Effettua lo scroll quando overviewMessage.messages cambia

    // Caricamento dei dati dal DB remoto
    async function LoadMessageFromRemote() {
        let oldestMessageDateByIdBlock = new Date(overviewMessage.messages[0].date as any);

        //la data dell'elemento piu vecchio nel indexedDB corrisponde al ultimo elemento caricato, quindi
        //non ci sono elemen ti piu vecchi nel indexedDB.
        if (oldestMessageDateByIdBlock !== null) {
            return await LoadMessagesAPI({ userContext, abortController, idb: overviewMessage.idBlock, oldestMessageDateByIdBlock }).then((messageRemoteData: any) => {
                //carica altri dati dal remoteDB
                if (messageRemoteData && messageRemoteData.length > 0) {
                    setOverviewMessage((prev: any) => ({ ...prev, messages: [...messageRemoteData, ...prev.messages] }));
                    if (containerRef.current) {
                        containerRef.current.scrollTop = 15 * parseInt(`${messageRemoteData.length}0`);
                    };
                };
            }).catch(e => console.log(e));
        };

        loadOneTime.current = false;
    };

    React.useEffect(() => {
        const container = containerRef.current;

        const handleScroll = () => {
            if (container) {
                if (container.scrollTop === 0 && !loadOneTime.current && (overviewMessage.totalMessages ?? 0) > overviewMessage.messages.length) {
                    //console.log("Inizio dello scroll raggiunto, carica più messaggi");
                    LoadMessageFromRemote();
                    loadOneTime.current = true; // Imposta il flag per impedire ulteriori caricamenti
                }
            }
        };

        if (container) {
            container.addEventListener('scroll', handleScroll);
        }

        // Cleanup dell'evento per evitare memory leak
        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [containerRef, overviewMessage]);


    const uniqueUsers = React.useCallback(() => {
        if (!overviewMessage?.users) return [];

        const seenUsers = new Map();
        overviewMessage.users.forEach((user: any) => {
            const fullName = `${user.nome} ${user.cognome}`;
            if (!seenUsers.has(fullName) && user._id !== userContext.details._id) {
                seenUsers.set(fullName, {
                    _id: user._id,
                    nome: user.nome,
                    cognome: user.cognome,
                    immagini: { avatar: user.immagini?.avatar, cover: user.immagini?.cover }
                });
            }
        });

        return Array.from(seenUsers.values());
    }, [overviewMessage?.users]);

    /**
     * Funzione per il retrive delle informazioni utente quando è in chat privata
     */
    const talkTo = React.useCallback(() => {
        const users = uniqueUsers().filter((user: { _id: string }) => user._id !== userContext.details._id);
        if (users.length > 0) {
            return users[0];
        };
        return null;
    }, [overviewMessage?.users]);

    const [isDragging, setIsDragging] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true); // Attiva lo stato di dragging
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false); // Disattiva lo stato di dragging
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false); // Disattiva lo stato di dragging

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files);

            // Filtra i file in base alle estensioni permesse
            const filteredFiles = droppedFiles.filter((file: File) => {
                const fileExtension = file.name.split('.').pop()?.toLowerCase();
                return fileExtension && allowedExtensions.includes(fileExtension);
            });

            if (filteredFiles.length === 0) {
                enqueueSnackbar("Impossibile importare i file, sembra che alcuni dei file selezionati siano di una tipologia non supportata. Scegli un formato valido.", {
                    title: 'Ops.. File non Supportati',
                    type: 'error',
                });
                return;
            }

            setSelectedFile((prevFiles: any) => [...prevFiles, ...droppedFiles]);
            e.dataTransfer.clearData();
        }
    };

    return <Fade in={Boolean(overviewMessage !== null)} timeout={1000}>
        <FDBox className="h-full flex flex-col" data-tour={chatTourId}>
            {lockChatInteractions && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 10,
                        pointerEvents: "auto", // blocca tutti i click sotto
                    }}
                    onClickCapture={(e) => e.stopPropagation()} // evita bubbling verso il parent
                />
            )}
            <Stack direction='row' p={1} sx={{ borderBottom: `1px solid ${darkMode ? palette.grey[800] : '#e7e7e7'}` }}>
                <FDBox variant="ghost" className="p-2 flex w-full space-x-2">
                    <div className="flex -space-x-3">
                        {uniqueUsers().map((user: { nome: string, cognome: string; bio: string; immagini: { avatar: string; cover: string } }, index: number) => (
                            <UserAvatar key={index} src={user.immagini?.avatar} name={user.nome}
                                cognome={user.cognome} size={14} cover={{ src: user.immagini?.cover, active: true }} bio={user.bio} />
                        ))}
                    </div>
                    {overviewMessage.path == "privata" ?
                        <p className="text-sm self-center">{uniqueUsers().map(user => `${user.nome} ${user.cognome}`).join(", ")}</p>
                        : <MDTypography variant="body2" sx={{ alignSelf: 'center' }}>{overviewMessage?.titleBlock}</MDTypography>}
                </FDBox>
                <Stack direction='row' ml='auto' alignItems='center'>
                    <IconButton onClick={ClearOverview} sx={{ width: 'fit-content', height: 'fit-content', }}>
                        {icon_back()}
                    </IconButton>
                </Stack>
            </Stack>
            {overviewMessage.disabilitato && <Tag text="La Chat è stata chiusa e la richiesta è stata elaborata, controlla le notifiche per scoprire l'esito. Se hai altre domande o necessiti di ulteriore supporto, contatta il servizio tecnico NEX. Ti auguriamo una splendida giornata! 😊"
                sx={{ m: 2, p: 2, textAlign: 'center' }} fontSize='0.8rem' />}

            <div className="flex flex-col overflow-auto w-full h-full min-h-[300px]" ref={containerRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drag& Drop Allegati */}
                <Fade in={isDragging} timeout={450}>
                    <div className="h-full w-full absolute top-0 rounded-md backdrop-blur-md z-1 bg-white/20 dark:bg-black/20 flex items-center justify-center">
                        <div className="w-[90%] h-[90%] p-2 flex flex-col items-center justify-center outline-dashed">
                            {icon_file({ width: 60, height: 60 })}
                            <span className="text-lg">Rilascia i tuoi file qui</span>
                        </div>
                    </div>
                </Fade>

                {overviewMessage && (overviewMessage.messages && Array.isArray(overviewMessage.messages) && overviewMessage.messages.length > 0)
                    && overviewMessage.messages.map((message: any, i: number) => {
                        const fromMe = userContext.details._id === message.user._id;
                        return <Message key={i} message={message} i={i} fromMe={fromMe} />
                    })}
            </div>
            {!overviewMessage.disabilitato && <Write SendMessage={SendMessage} selectedFile={selectedFile} setSelectedFile={setSelectedFile} />}
        </FDBox>
    </Fade>
};


interface BlockProp {
    data: ChatBlock;
    i: number;
    Interact: (data: ChatBlock) => void;
};
const Block: React.FC<BlockProp> = ({ data, i, Interact }) => {
    const [userContext] = React.useContext<null | any | UserContextProps>(UserContext);

    const newUnviewedCount = React.useMemo(() => {
        let lastMyMessageDate = new Date('1970-01-01T00:00:00.000Z');
        let newUnviewedCount = 0;

        if (data.messages && data.messages.length > 0) {
            data.messages.forEach((message: any) => {
                const fromMe = userContext.details._id === message.user._id;

                if (message.fromMe) {
                    lastMyMessageDate = new Date(message.date as any);
                } else if (new Date(message.date as any) > lastMyMessageDate && !message.viewed && !fromMe) {
                    newUnviewedCount++;
                }
            });
        }

        return newUnviewedCount;
    }, [data.messages]);

    const lastMessage = React.useMemo(() => {
        if (!data || !data.messages || data.messages.length === 0) return null;

        const item: any = data.messages[data.messages.length - 1];
        const fromMe = userContext.details._id === item.user._id;

        let msg = item.msg as string;

        if (msg.length > 70) {
            msg = msg.slice(0, 70) + "..";
        }

        return <Stack direction='row' alignItems='center'>
            {fromMe &&
                (item.viewed ?
                    <Fade in={true} timeout={1500}>{icon_doubleCheck({ width: 20, height: 20, mr: 1 })}</Fade>
                    : (item.sended == undefined || item.sended) && <Fade in={true} timeout={1500}>{icon_check({ width: 20, height: 20, mr: 1 })}</Fade>)
            }
            {(fromMe && (item.attachments && item.attachments.length > 0)) && icon_file({ width: 15, height: 15, mr: 0.5 })}
            <MDTypography
                variant={newUnviewedCount > 0 ? "title2" : "body2"}
                sx={{ textAlign: 'left', fontSize: '0.8rem' }}
            >
                {msg}
            </MDTypography>
        </Stack>
    }, [data.messages, newUnviewedCount]);

    const lastMessageTime = React.useMemo(() => {
        if (!data.messages || data.messages.length === 0) return undefined;

        const item: any = data.messages[data.messages.length - 1];
        return new Date(item.date as any)?.toLocaleTimeString('it', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }, [data.messages]);

    const uniqueUsers = React.useCallback(() => {
        if (!data?.messages) return [];

        const seenUsers = new Map();
        data.users.forEach((user: any) => {
            const fullName = `${user.nome} ${user.cognome}`;
            if (!seenUsers.has(fullName) && user._id !== userContext.details._id) {
                seenUsers.set(fullName, {
                    nome: user.nome,
                    cognome: user.cognome,
                    immagini: { avatar: user.immagini?.avatar, cover: user.immagini?.cover }
                });
            }
        });

        return Array.from(seenUsers.values());
    }, [data?.messages]);

    return (
        <FDBox key={i} onClick={() => Interact(data)}
            className="p-4 w-full justify-start flex h-25 cursor-pointer space-x-2 items-center
        hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors duration-200"
            asMotion={true}
        >
            <div className="flex -space-x-3">
                {uniqueUsers().map((user: { nome: string, cognome: string; bio: string; immagini: { avatar: string; cover: string } }, index: number) => (
                    <UserAvatar key={index} src={user.immagini?.avatar} name={user.nome}
                        cognome={user.cognome} size={14} cover={{ src: user.immagini?.cover, active: true }} bio={user.bio} />
                ))}
            </div>
            <FDBox variant="ghost" fullWidth>
                <div className="flex justify-between items-center mb-1 space-x-6">
                    <p>{uniqueUsers().map(user => `${user.nome} ${user.cognome}`).join(", ")}</p>
                    <p>{lastMessageTime}</p>
                </div>
                <p className="text-sm text-gray-500">{data.titleBlock}</p>

                <Stack direction='row' className='css-width-100' gap={1} justifyContent='space-between' alignItems='center'>
                    {lastMessage}
                    {newUnviewedCount > 0 && (
                        <MDTypography variant="body2" sx={{
                            ml: 'auto',
                            backgroundColor: '#4f63f317', p: "3px 8px", borderRadius: 2,
                            fontWeight: 600, fontSize: '0.9rem'
                        }}>
                            {newUnviewedCount}
                        </MDTypography>
                    )}
                </Stack>
            </FDBox>
        </FDBox>
    );
};

interface MessagesHomeProp {
    chatOnView: 1 | 2;
    messagesData: ChatBlock[];
    privateMessagesData: ChatBlock[];

    ChangeChatView: (to: 1 | 2) => void;
    HandleOverview: (data: any) => void;
    ViewdMessages: ({ idBlock, path, settings }: { idBlock: string; path: string; settings: any }) => void;
};
const MessagesHome: React.FC<MessagesHomeProp> = ({ chatOnView, messagesData, privateMessagesData, ChangeChatView, HandleOverview, ViewdMessages }) => {
    const [userContext, setUserContext] = React.useContext<null | any | UserContextProps>(UserContext);
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => abortController.current && abortController.current.abort();

    //Data ottenibili dal Fetch
    const [hintData, setHintData] = React.useState<any[]>([]);
    //definisce il focus per la ricerca in modo tale da far partire il fetch
    const [searchBoxFocus, setSearchBoxFocus] = React.useState(false);
    const [hintBoxActive, setHintBoxActive] = React.useState<boolean>(false);
    //Status di caricamento => in attesa di risposta dal server
    const [loadBool, setLoadBool] = React.useState(false);
    //stato che mantiene il testo che l'utente sta attualmente cercando.
    const [searchText, setSearchText] = React.useState<string | null>(null);
    const CleanText = () => setSearchText(null);

    const UnviewedCount = ({ messagesData }: { messagesData: Array<any> }): number => {
        let lastMyMessageDate = new Date('1970-01-01T00:00:00.000Z');
        let newUnviewedCount = 0;

        messagesData.forEach((message: any) => {
            const fromMe = userContext.details._id === message.user._id;
            if (fromMe) {
                lastMyMessageDate = new Date(message.date as any);
            } else if (new Date(message.date as any) > lastMyMessageDate && !message.viewed) {
                newUnviewedCount++;
            }
        });
        return newUnviewedCount;
    };

    const calculateUnseenMessages = ({ data }: { data: ChatBlock[] }) => {
        return data.reduce((total: number, block: ChatBlock) => {
            const unseenMessages = (block.messages as any[]).filter(
                (message: any) => message.user._id !== userContext.details._id && message.viewed === false
            );
            return total + unseenMessages.length;
        }, 0);
    };

    //funzione che richiama l'API per il load dei messaggi dal db remoto
    async function LoadMessageFromRemote(data: { messages: Array<{ date: Date }>, idBlock: string }) {
        const oldestMessageDateByIdBlock = data.messages[0].date;

        return await LoadMessagesAPI({ userContext, abortController, idb: data.idBlock, oldestMessageDateByIdBlock }).then((messageRemoteData: any) => {
            return messageRemoteData.messages;
        }).catch(e => console.log(e));
    };

    //interazione con il blocco
    const Interact = async (data: ChatBlock) => {
        let messages: any[] = data.messages as any[];

        const getMessagesByViewed = (data.messages as any[]).filter((x: { viewed: boolean, user: { _id: string } }) => x.viewed === false && x.user._id !== userContext.details._id);
        //se nel indexedDB ci sono meno di TOT messaggi, verrà fatta una ricerca nel DB remoto per poter raggiungere una quota prevista
        //di messaggi per ogni blocco.
        if (messages && Array.isArray(messages) && (messages.length > 0 && messages.length < 20) && data.totalMessages !== messages.length) {
            const loadedMessage = await LoadMessageFromRemote({ messages: messages as any, idBlock: data.idBlock });
            messages = [...(loadedMessage || []), ...messages];
        };

        HandleOverview({ ...data, messages: messages });
        if (data && messages) {
            if (UnviewedCount({ messagesData: getMessagesByViewed }) > 0) {
                //invia l'emit del viewed solo se ci sono effettivamente dei messaggi da parte dell'altro utente
                ViewdMessages({ idBlock: data.idBlock, path: (data as any).path, settings: { emit: true } });
            }
        }
    };

    //Invia la richiesta tramite API al server per la ricerca dei dati da comparare
    React.useEffect(() => {
        if (!searchText) {
            setHintBoxActive(false);
        } else {
            setHintBoxActive(true);
        }
        //Abort Controller per il fetch
        abortController.current = new AbortController();

        const delayDebounceFn = setTimeout(() => {
            if (searchBoxFocus && (searchText && searchText !== "")) {
                SearchUsersAPI({ userContext, abortController, sstr: searchText, setHintData, setLoadBool })
            };
        }, 800);

        const reset = () => {
            cancelRequest();
            setLoadBool(true);
            clearTimeout(delayDebounceFn);
        }

        return () => { reset(); setHintData([]) };
    }, [searchText])

    return <Fade in={true} timeout={1000}>
        <FDBox color='light' className="h-full flex flex-col">
            <FDBox variant="ghost" className="flex flex-col gap-2 p-4 border-b dark:border-neutral-800 border-gray-200">
                <p className="text-xl">Messaggi</p>

                {chatOnView == 1 && <Fade in={true} timeout={800}><Stack direction='row' width='100%' gap={1}>
                    {(searchText && searchText.trim() !== "") && <IconButton onClick={CleanText}>
                        {icon_back()}
                    </IconButton>}
                    <Stack direction='row' alignItems='center' width='100%'
                        sx={{ backgroundColor: darkMode ? palette.grey[900] : palette.grey[200], borderRadius: 4 }}>
                        <IconButton sx={{ p: '10px' }} aria-label="menu">
                            {icon_search()}
                        </IconButton>
                        <InputBase
                            value={(searchText || "")}
                            onChange={(e: any) => setSearchText(e.target.value)}
                            onFocus={() => setSearchBoxFocus(true)}
                            onBlur={() => setSearchBoxFocus(false)}
                            sx={{ ml: 1, flex: 1, fontSize: '1rem', color: darkMode ? palette.white.main : palette.black.main }}
                            placeholder="Cerca su Messenger"
                            inputProps={{ 'aria-label': 'cerca su messenger' }}
                        />
                        <MDTypography sx={{ mr: 1, height: 27 }}
                            data-tooltip-id="btn-sidenav-icon-tooltip"
                            data-tooltip-content="Potrai ricercare, utenti, gruppi, chat private, chat argomentate e tanto altro!, in modo da avere tutto facilmente raggiungibile!">
                            {icon_info({ width: 20, height: 20, color: palette.grey[500] })}
                        </MDTypography>
                    </Stack>
                </Stack></Fade>}

                <Stack direction='row' gap={1}>
                    <Badge color="error" badgeContent={calculateUnseenMessages({ data: privateMessagesData })}>
                        <MDButton color={darkMode ? "dark" : "light"} onClick={() => ChangeChatView(1)}>
                            Privati
                        </MDButton>
                    </Badge>

                    <Badge color="error" badgeContent={calculateUnseenMessages({ data: messagesData })}>
                        <MDButton color={darkMode ? "dark" : "light"} onClick={() => ChangeChatView(2)}>
                            Pubblici
                        </MDButton>
                    </Badge>
                </Stack>
            </FDBox>

            {(hintBoxActive && chatOnView == 1) ?
                <UsersBlocks data={hintData} loadBool={loadBool} />
                : ((chatOnView == 1 ?
                    privateMessagesData : messagesData) && Array.isArray((chatOnView == 1 ?
                        privateMessagesData : messagesData)) && (chatOnView == 1 ?
                            privateMessagesData : messagesData).length > 0) ?
                    <Stack className="css-height-width-100" sx={{
                        minHeight: 300,
                        overflow: "auto",
                        maxHeight: "75vh",
                        flex: 1,
                    }}>
                        {(chatOnView == 1 ?
                            privateMessagesData : messagesData).map((data: ChatBlock, i: number) => (
                                <Block key={i} data={data} i={i} Interact={Interact} />
                            ))}
                    </Stack>
                    : <Stack justifyContent='center'
                        sx={{ padding: "0 0 40px", alignItems: "center", filter: 'grayscale(1)', opacity: 0.65, height: '100%' }}>
                        <img src={NoProductFound} className="avoid-drag" loading="lazy" style={{
                            opacity: 0.8,
                            minHeight: 250,
                            maxHeight: 300,
                            maxWidth: 300
                        }} alt="No Conversations Found" />
                        <MDTypography component="h3" sx={{
                            fontWeight: "normal", textAlign: "center",
                            fontSize: "1em", maxWidth: "50%"
                        }}>
                            Sembra che per il momento non ci siano conversazioni da visualizzare, ripassa piu tardi!</MDTypography>
                    </Stack>}
        </FDBox>
    </Fade>
};


export const Chat: React.FC<{}> = () => {
    const { messagesData, setMessagesData, privateMessagesData, setPrivateMessagesData,
        chatLoad, overviewMessage, setOverviewMessage, ViewdMessages } = useGeneralDataContext();

    //1 => messaggi privati
    //2 => messaggi blocco
    const [chatOnView, setChatOnView] = React.useState<1 | 2>(1);
    const ChangeChatView = (to: 1 | 2) => setChatOnView(to);

    const [userContext] = React.useContext<null | any | UserContextProps>(UserContext);
    const [selectedFile, setSelectedFile] = React.useState<File[]>([]);

    // Invia il messaggio
    const SendMessage = async ({ message }: { message: string }) => {
        try {
            // Converte i file in `ArrayBuffer` prima di inviarli
            const attachments: any = await Promise.all(
                selectedFile.map((file, index) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();

                        const splitName = file.name.split(".");
                        let extention = 'undefined';
                        if (splitName && Array.isArray(splitName) && splitName.length > 0) {
                            extention = splitName[splitName.length - 1];
                        } else {
                            reject('Nessuna estensione presente per questo file.')
                        };

                        const safeName = stripPath(file.name);

                        reader.onload = () => {
                            resolve({
                                kind: 'upload',
                                fileID: `attachment_${safeName}_${Date.now()}_${index}.${extention}`,
                                fileName: file.name,
                                fileType: file.type,
                                data: reader.result, // `ArrayBuffer` o `Base64`
                                isUploaded: false,
                            });
                        };
                        reader.onerror = () => reject(reader.error);
                        reader.readAsArrayBuffer(file); // Puoi usare `readAsDataURL` per `Base64`
                    });
                })
            );

            const msg = {
                user: {
                    _id: userContext.details._id,
                    nome: userContext.details.nome,
                    cognome: userContext.details.cognome
                },
                msg: message,
                viewed: false,
                date: new Date(),
                attachments: attachments
            };

            const block = overviewMessage as ChatBlock;
            if (chatSocket) {
                const messageToSend = {
                    idBlock: block.idBlock,
                    path: block.path,
                    ...msg
                };

                chatSocket.emit('privateMessage', messageToSend,
                    (response: { status: boolean; message_id: string }) => {
                        if (response && !response.status) {
                            enqueueSnackbar("Sembra che ci sia stato un problema durante l'invio del messaggio, riprova tra qualche istante.", {
                                title: 'Ops.. Errore in risposta dal server',
                                type: 'error',
                            });
                        } else {
                            if (overviewMessage && overviewMessage.idBlock === block.idBlock) {
                                setOverviewMessage((prev) => {
                                    if (!prev) return prev;
                                    return {
                                        ...prev,
                                        messages: [...(prev.messages || []), { _id: response?.message_id, ...msg }],
                                    };
                                });
                            };

                            // Determina quale stato aggiornare in base a `overviewMessage.path`
                            const setDataFunction = overviewMessage?.path != 'privata' ? setMessagesData : setPrivateMessagesData;

                            // salva sullo stato principale dei blocchi o dei messaggi privati.
                            setDataFunction((prev) => {
                                const blocks: ChatBlock[] = [...prev];
                                const indexMap: Map<string, number> = new Map(
                                    blocks.map((value, index) => [value.idBlock, index])
                                );

                                const blockIndex = indexMap.get(block.idBlock);

                                if (blockIndex !== undefined && blockIndex !== -1) {
                                    // Trova il blocco target
                                    const blockTarget = blocks[blockIndex];

                                    if (blockTarget) {
                                        // Aggiungi il messaggio al blocco
                                        (blockTarget.messages as any[]).push({ ...{ _id: response?.message_id, ...msg }, sended: true });

                                        // Rimuovi il blocco dalla posizione attuale
                                        blocks.splice(blockIndex, 1);

                                        // Sposta il blocco in cima
                                        blocks.unshift(blockTarget);
                                    }
                                };

                                return blocks;
                            });
                        }
                    });

                setSelectedFile([]);
            } else {
                enqueueSnackbar("Non è stato possibile connettersi al server, riprova tra qualche istante.", {
                    title: 'Ops.. Errore in risposta dal server',
                    type: 'error',
                });
            };
        } catch (error) {
            console.error("Errore durante la lettura degli allegati:", error);
        };
    };

    const HandleOverview = (e: any) => {
        setOverviewMessage(e);
    };
    const ClearOverview = () => {
        //se sei in visualizzazione dei messaggi privati allora attiva la tab che corrisponde a tale elemento
        if (overviewMessage && overviewMessage.path == "privata") {
            ChangeChatView(1);
        } else {
            ChangeChatView(2);
        };
        setOverviewMessage(null);
    };

    return <React.Fragment>{chatLoad ?
        <LoadScreen />
        : !overviewMessage ?
            <MessagesHome chatOnView={chatOnView} messagesData={messagesData} privateMessagesData={privateMessagesData}
                HandleOverview={HandleOverview} ViewdMessages={ViewdMessages} ChangeChatView={ChangeChatView} />
            : <InspectMessage ClearOverview={ClearOverview} overviewMessage={overviewMessage as ChatBlock} SendMessage={SendMessage}
                selectedFile={selectedFile} setSelectedFile={setSelectedFile} />}
    </React.Fragment>
};
