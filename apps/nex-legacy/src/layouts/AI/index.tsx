import React, { useContext, useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useAnimation, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid"; // npm install uuid
import { Tooltip } from "react-tooltip";
//context
import { AIContext, Conversation, Message } from "context/AIContext";
//componenti
import Hero from "./Hero";
import PromptInput from "./PromptInput";
import ChatInteraction from "./chat/Interaction";
import AIHeader from "./header";
import { WaterShaderScene } from "./organic-sphere/SplineScene";
import SideBar from "./sideBar";
import Settings from "./settings";
import { enqueueSnackbar } from "components/MessageBox";
import PinnedMessageBox from "./chat/PinnedMessageBox";
//fetchdatas
import { AgentAPI } from "./fetchData/Agent";
import { getAgents, IAgent, formatAgentForSelect } from "./fetchData/Agents";
//utils
import { parseAgentResponse } from "./utils/parseAgentResponse";
import { emitSelectedModelChange, onRequestSelectedModel, onSelectedModelChange } from "./utils/modelEvents";
import { validateEditableTitle } from "./utils/title";
//UI
import { ContextMenu } from "components/UI/menu/ContextMenu";
import ColorSwitch, { ColorOption } from "components/UI/colors/ColorSwitch";
import FDIconButton from "components/UI/buttons/FDIconButton";
//icons
import { LuPaintBucket } from "react-icons/lu";
import { IoCloseSharp, IoCloudOutline } from "react-icons/io5";
import { AiOutlineEdit } from "react-icons/ai";
import { MdDeleteOutline } from "react-icons/md";


const PaintBucket = LuPaintBucket as React.FC<{ size?: number }>;
const CloseIcon = IoCloseSharp as React.FC<{ size?: number }>;
const Rename = AiOutlineEdit as React.FC<{ size?: number }>;
const DeleteIcon = MdDeleteOutline as React.FC<{ size?: number, className?: string }>;
const IoCloud = IoCloudOutline as React.FC<{ size?: number, className?: string }>;

const BOX_W = 800; // Dimensioni predefinite della finestra
const BOX_H = 600; // Dimensioni predefinite della finestra


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
const AILayout: React.FC = () => {
    const { open, conversation, setConversation, history, setHistory } = useContext(AIContext);
    const [mode, setMode] = useState<"fullscreen" | "windowed">("windowed");
    const [savedPosition, setSavedPosition] = useState({ x: 100, y: 100 });
    const [showHero, setShowHero] = useState(true); // Mostra la schermata iniziale di benvenuto
    const [talkMode, setTalkMode] = useState(false); // Modalità di conversazione vocale, se abilitata
    const [showHistoryTab, setShowHistoryTab] = useState(false); // Mostra la cronologia delle conversazioni
    const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]); // Messaggi fissati nella conversazione

    // Stati per le impostazioni
    const [showSettings, setShowSettings] = useState(false); // Mostra il pannello delle impostazioni
    const [showSettingsSidebar, setShowSettingsSidebar] = useState(true); // Mostra la sidebar delle impostazioni

    // Stati per gli agenti AI (caricati da DB)
    const [agents, setAgents] = useState<IAgent[]>([]); // Agenti AI disponibili (oggetti completi)
    const [agentsLoading, setAgentsLoading] = useState<boolean>(true); // Stato di caricamento agenti
    const [selectedModel, setSelectedModel] = useState<string>(''); // Modello AI selezionato (formato: key-version)

    // Sync with settings panel: listen for external selectedModel changes
    useEffect(() => {
        return onSelectedModelChange(({ value }) => {
            setSelectedModel(value);
        });
    }, []);

    const [openModelSelect, setOpenModelSelect] = useState<boolean>(false); // Stato di apertura del selettore di modelli AI

    // Controller separato per il caricamento degli agenti
    const agentsAbortController = useRef<AbortController | null>(null);

    // Elemento di riferimento per il menu contestuale dei messaggi fissati
    const [id_selected, setIdSelected] = useState<{ from: 'pinned' | 'history'; value: string } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null); // Riferimento per il menu contestuale dei messaggi fissati
    // Se c'è un messaggio fissato selezionato, lo otteniamo
    const pinnedSelected: Message | undefined = id_selected?.from === 'pinned' ? id_selected && pinnedMessages.find(pm => pm._id === id_selected.value) : undefined;
    // Se c'è una conversazione selezionata, lo otteniamo
    const conversation__: Conversation | undefined = id_selected?.from === 'history' ? id_selected && history.find((conv: Conversation) =>
        conv.id === id_selected.value) : undefined;

    // ——————————————————————————————————————————————————————————
    // STATE - LOAD STATUS
    // ——————————————————————————————————————————————————————————
    // Stati di caricamento generali
    const [loadStatus, setLoadStatus] = React.useState<{ [key: string]: any }>({
        ai_message: false, // Stato di caricamento per i messaggi
    });

    const abortController = useRef<AbortController | null>(null);

    // ——————————————————————————————————————————————————————————
    // HANDLERS - UI & STATE
    // ——————————————————————————————————————————————————————————
    // Funzione per cambiare lo stato di caricamento.
    // 'from' è il tipo di caricamento, 'bool' è il nuovo stato.
    const ChangeLoadStatus = ({ from, bool }: { from: string, bool: boolean }) => {
        setLoadStatus((prev) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }))
    };

    // Funzione per gestire l'apertura della cronologia delle conversazioni
    const handleHistoryTab = () => {
        setShowHistoryTab(!showHistoryTab);
    };

    // Funzione per gestire l'apertura/chiusura delle impostazioni
    const handleSettingsToggle = () => {
        setShowSettings(!showSettings);
        // Quando si aprono le impostazioni, mostra la sidebar di default
        if (!showSettings) {
            setShowSettingsSidebar(true);
            // Notify settings about current selected model so they can pre-select the agent
            emitSelectedModelChange(selectedModel);
        }
    };

    // Respond to requests from settings for current selected model
    React.useEffect(() => {
        return onRequestSelectedModel(() => {
            emitSelectedModelChange(selectedModel);
        });
    }, [selectedModel]);

    // Funzione per gestire l'apertura/chiusura della sidebar delle impostazioni
    const handleSettingsSidebarToggle = () => {
        setShowSettingsSidebar(!showSettingsSidebar);
    };

    // Funzione per gestire il cambio della modalità di conversazione vocale
    // Se non è definita, la modalità di conversazione vocale viene attivata
    const HandleChangeTalkMode = () => {
        setTalkMode((prev) => !prev);
    };

    // Motion values per il drag fluido
    const x = useMotionValue(savedPosition.x);
    const y = useMotionValue(savedPosition.y);
    const controls = useAnimation();

    // Al primo mount, settiamo i motion values e il controller
    useEffect(() => {
        controls.set({
            x: savedPosition.x,
            y: savedPosition.y,
            width: BOX_W,
            height: BOX_H,
            borderRadius: "1rem",
        });
    }, [open]);

    // ——————————————————————————————————————————————————————————
    // EFFECTS - DATA FETCH
    // ——————————————————————————————————————————————————————————
    // Carica gli agenti dal backend al mount.
    useEffect(() => {
        const fetchAgents = async () => {
            setAgentsLoading(true);
            try {
                const response = await getAgents(agentsAbortController);
                if (response.success && response.data.length > 0) {
                    setAgents(response.data);
                    // Seleziona il primo agente come default
                    const firstAgent = response.data[0];
                    setSelectedModel(formatAgentForSelect(firstAgent));
                } else {
                    // Fallback se non ci sono agenti
                    console.warn('No agents found, using fallback');
                    setAgents([]);
                }
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    console.error('Error fetching agents:', error);
                    enqueueSnackbar("Errore nel caricamento degli agenti AI", {
                        title: 'Errore',
                        type: 'error',
                    });
                }
            } finally {
                setAgentsLoading(false);
            }
        };

        fetchAgents();

        return () => {
            if (agentsAbortController.current) {
                agentsAbortController.current.abort();
            }
        };
    }, []);

    // Quando finisce un drag, salviamo la posizione nel React state
    const handleDragEnd = (_e: any, info: any) => {
        setSavedPosition({ x: x.get(), y: y.get() });
    };

    // Funzione per cambiare la modalità (fullscreen/windowed)
    // Se è fullscreen, torna a windowed e viceversa
    const toggleMode = async () => {
        if (mode === "windowed") {
            // windowed → fullscreen
            await controls.start({
                x: 0,
                y: 0,
                width: "100vw",
                height: "100vh",
                borderRadius: "0px",
                transition: { duration: 0.5, ease: "easeInOut" },
            });
            setMode("fullscreen");
        } else {
            // fullscreen → windowed
            setMode("windowed");
            await controls.start({
                x: savedPosition.x,
                y: savedPosition.y,
                width: BOX_W,
                height: BOX_H,
                borderRadius: "1rem",
                transition: { duration: 0.5, ease: "easeInOut" },
            });
        }
    };

    // Limiti dinamici al drag
    const windowW = typeof window !== "undefined" ? window.innerWidth : 0;
    const windowH = typeof window !== "undefined" ? window.innerHeight : 0;

    // Funzione per gestire l'invio dei messaggi
    // Simula l'invio di un messaggio e la risposta dell'AI
    const handleSend = ({ input, retry }: { input: string, retry?: boolean }) => {
        if (!showHero && !conversation) {
            console.error("No active conversation to send a message to.");
            // Se non c'è una conversazione attiva, non possiamo inviare un messaggio
            ChangeLoadStatus({ from: "ai_message", bool: false });
            setShowHero(true);
            return;
        };

        ChangeLoadStatus({ from: "ai_message", bool: true });

        // Quando nel componente o non c'è una conversazione attiva creando una nuova conversazione
        // Costruisci nuova conversazione in modo immutabile
        let baseConv: Conversation;
        if (!showHero && conversation) {
            baseConv = conversation as Conversation;
        } else {
            baseConv = {
                id: uuidv4(),
                messages: [],
                createdAt: Date.now(),
            };
        }

        const userMessage: Message = {
            type: "user",
            content: input,
            createdAt: Date.now(),
            _id: uuidv4(),
        };

        // Crea copia immutabile dei messaggi
        let updatedMessages: Message[] = baseConv.messages ? [...baseConv.messages] : [];

        // se è un retry, elimina l'ultimo messaggio dell'AI
        if (retry) {
            // rimuovi l'ultimo messaggio dell'AI (non mutare in place)
            updatedMessages = updatedMessages.slice(0, -1);
            userMessage.content = updatedMessages[updatedMessages.length - 1].content; // ripristina il messaggio dell'utente
        } else {
            updatedMessages = [...updatedMessages, userMessage];
        };

        const [model, version] = selectedModel.split('-'); // estrai il modello e la versione
        const newConv: Conversation = {
            ...baseConv,
            messages: updatedMessages,
        };

        // Aggiorna stato
        setConversation(newConv); // Setta la conversazione corrente
        setHistory((prev: Conversation[]) => {
            const exists = prev.some((conv: Conversation) => conv.id === newConv.id);
            if (exists) {
                // Se la history contiene già la conversazione, aggiorna quella esistente e posiziona in cima
                return [newConv, ...prev.filter((conv: Conversation) => conv.id !== newConv.id)];
            } else {
                return [newConv, ...prev];
            }
        });

        if (showHero) setShowHero(false); // Nasconde la schermata iniziale di benvenuto

        // Funzione per aggiungere un messaggio dell'AI alla conversazione
        function AddAIMessage(aiMessage: Message) {
            // Aggiungi il messaggio dell'AI alla conversazione
            const updatedWithAI = {
                ...newConv,
                messages: [...newConv.messages, aiMessage],
            };
            // Se l'ID della conversazione che si sta per aggiornare corrisponde a quello corrente, aggiorna la conversazione
            // Questo evita di sovrascrivere la conversazione corrente provocando un switch della conversazione
            setConversation((prev: Conversation | null) => {
                if (prev && prev.id === updatedWithAI.id) {
                    return updatedWithAI;
                }
                return prev; // altrimenti ritorna la conversazione precedente
            });
            // Aggiorna la cronologia delle conversazioni
            // Mappa la cronologia per aggiornare la conversazione corrente con il nuovo messaggio
            setHistory((prev: Conversation[]) =>
                prev.map((conv: Conversation) => (conv.id === updatedWithAI.id ? updatedWithAI : conv))
            );
            ChangeLoadStatus({ from: "ai_message", bool: false });
        };

        // Funzione per gestire il completamento della richiesta
        function HandleComplete(message: { response: string }) {
            const { blocks, error } = parseAgentResponse(message.response);

            // Gestisci il completamento della richiesta
            const aiMessage: Message = {
                type: "ai",
                version: selectedModel,
                content: message.response, // fallback testuale
                createdAt: Date.now(),
                _id: uuidv4(),
                blocks: blocks.length > 0 ? blocks : undefined,
                isError: !!error && blocks.length === 0, // se non è riuscito a ottenere blocchi e c'è errore
            };
            AddAIMessage(aiMessage);
            //notifica di google chrome per l'avvenuta ricezione del messaggio da parte del AI
            //inoltre richiesta il permesso se non è stato ancora concesso
            if (Notification.permission !== "granted") {
                Notification.requestPermission();
            };
            new Notification(`Nuovo messaggio NEX AI ricevuto`);
        };

        // Funzione per gestire gli errori della richiesta
        // Mostra un messaggio di errore se qualcosa va storto
        function HandleError(errorMessage: string) {
            // Gestisci gli errori della richiesta
            const aiMessage: Message = { type: "ai", content: errorMessage, createdAt: Date.now(), _id: uuidv4(), isError: true };
            AddAIMessage(aiMessage);
        };

        // Chiama l'API dell'agente per inviare il messaggio
        AgentAPI({
            abortController,
            prompt: {
                session_id: newConv.id,
                question: userMessage.content,
                model,
                version: Number(version),
            },
            HandleComplete,
            HandleError,
            ChangeLoadStatus,
        });

        // Simulazione fetch asincrona
        /*setTimeout(() => {
            HandleComplete({
                response: `{\"blocks\":[{\"kind\":\"text\",\"text\":"Analisi approfondita per product_id = 74836 (ARCHER T3U) — riepilogo dei dati principali utilizzati:\n- stock = 78\n- forecast_2m = 126\n- scorta_minima_2m = 32\n- quantita_da_ordinare_2m (baseline) = 80 (calcolo: forecast_2m + scorta_minima_2m − stock = 126 + 32 − 78 = 80)\n- proposta finale nell'elaborazione = 84 pezzi (arrotondamento ai multipli di packaging preferiti dal BSG)\n- costo_medi = 11,1379 €/u\n- diff_prez = 3,6621 €/u (marginalitá indicativa)\n- trend_6_mesi = −1,71 (leggera decrescita integrata nel forecast)\n- coeff_variazione = 0,4 (volatilità storica bassa-moderata)\n- media_mensile_vendite = 53,53\n- stockout_risk = 1,46 (stock / media_mensile_vendite → copertura ≈ 1,46 mesi)\n- lead_time = 15 giorni\n- nel BSG il codice risulta fra gli SKU con Sell‑In che prevede MOQ = 60 (condizione valida): la baseline 80 soddisfa il MOQ.\n\nMotivazione dettagliata della scelta di 84 pezzi:\n1) Baseline logica: la quantità utile per coprire i prossimi 2 mesi è calcolata come forecast_2m + scorta_minima_2m − stock = 80. Questa è la quantità minima stimata per evitare stock‑out tenendo conto del forecast SARIMAX e della scorta di sicurezza.\n2) Arrotondamento per packing / preferenze BSG: il BSG suggerisce preferenze di confezionamento in multipli (tipicamente 12). Poiché 80 non è multiplo di 12, si è arrotondato per eccesso al multiplo superiore (84) per ridurre complessità logistica e handling. L’impatto finanziario marginale dell’aggiunta di 4 unità è basso: costo addizionale ≈ 4 × 11,1379 = 44,5516 €.\n3) Validazione con indicatori di rischio e trend:\n   - stockout_risk = 1,46 indica che lo stock copre ~1,46 mesi delle vendite medie: è prudente non scendere sotto la baseline per non aumentare il rischio di rottura.\n   - trend_6_mesi = −1,71 mostra una lieve decrescita della serie; tuttavia il modello di forecast incorpora tale trend, quindi la baseline resta coerente con la domanda prevista. La volatilità (coeff_variazione = 0,4) è contenuta, quindi le previsioni sono relativamente stabili.\n4) Vincoli promo/MOQ e soglie economiche:\n   - Il BSG riporta MOQ = 60 per la Sell‑In: la baseline 80 (e la proposta 84) soddisfano il requisito, permettendo di attivare la promo se opportuno (con invio di PP se richiesto).\n   - Valore economico ordine stimato: 84 × costo_medi 11,1379 ≈ 935,5836 € (ben sotto eventuali soglie per vantaggi aggiuntivi quali bid/rebate che richiedono ordini > 5.000 €), quindi non ha senso aumentare ulteriormente la quantità solo per sbloccare soglie di spesa elevate.\n5) Lead time e tempistica: lead_time = 15 giorni è breve; ciò riduce la necessità di sovraccaricare le scorte a copertura di latenze lunghe e supporta l’approccio di ordinare la baseline arrotondata.\n\nRischi residui e raccomandazioni operative:\n- Rischio domanda in calo: se si vuole essere più conservativi dato il trend negativo, una alternativa è ridurre l'ordine al multiplo inferiore di 12 (72) — risparmiando capitale ma accettando una copertura minore; tuttavia 72 < baseline (80) e quindi aumenterebbe il rischio di stockout se il forecast si materializza.\n- Se l'obiettivo è massimizzare l'efficienza logistica e sfruttare promo Sell‑In (se confermate), la proposta di 84 è sensata perché: 1) rispetta il MOQ; 2) ottimizza packing; 3) ha impatto economico contenuto (≈ 44,55 € in più rispetto a 80). \n- Suggerisco di confermare se si intende attivare la Sell‑In (in tal caso preparare la PP) oppure procedere con l'ordine a quantità 84 senza PP. Se preferisci posso calcolare l'impatttraces/ingest"`
            });
        }, 2000);*/
    };

    // Funzione per caricare una conversazione esistente
    // Cerca la conversazione per ID e la setta come corrente
    const LoadConversation = (conversationId: string) => {
        if (!conversationId) {
            console.error("No conversation ID provided.");
            enqueueSnackbar("Nessun ID di conversazione fornito.", {
                title: 'Ops..',
                type: 'error',
            });
            return;
        };
        if (conversation?.id === conversationId) return;

        const conv = history.find((conv: Conversation) => conv.id === conversationId);
        if (conv) {
            setConversation(conv);
            setShowHero(false);
        } else {
            console.error(`Conversation with ID ${conversationId} not found.`);
        };
    };

    // Funzione per fissare un messaggio nella conversazione
    // Aggiunge il messaggio alla lista dei messaggi fissati
    const pinMessage = (message: Message) => {
        setPinnedMessages((prev) => [...prev, message]);
    };

    // Funzione per rimuovere un messaggio fissato
    // Rimuove il messaggio dalla lista dei messaggi fissati
    const unpinMessage = (message_id: string) => {
        setPinnedMessages((prev) => prev.filter((msg) => msg._id !== message_id));
    };

    // torna alla schermata iniziale di benvenuto
    const resetToHero = () => {
        setConversation(null);
        setShowHero(true);
        setPinnedMessages([]);
        ChangeLoadStatus({ from: "ai_message", bool: false });
    };

    // Funzione per cambiare il colore di un messaggio fissato
    // Aggiorna il colore del messaggio fissato selezionato
    const changeColor = (messageId: string, color: ColorOption | null) => {
        //se color è null, rimuove il colore
        if (!color) {
            setPinnedMessages((prev) => prev.map((msg) => (msg._id === messageId ? { ...msg, color: undefined } : msg)));
            return;
        }
        // altrimenti aggiorna il colore del messaggio
        setPinnedMessages((prev) =>
            prev.map((msg) => (msg._id === messageId ? { ...msg, color } : msg))
        );
    };

    // Funzione per cambiare il titolo del messaggio fissato
    const changePinnedTitle = (messageId: string | undefined, title: string) => {
        if (!messageId) {
            console.error("No message ID provided for title change.");
            enqueueSnackbar("Nessun ID di messaggio fornito per il cambio titolo.", {
                title: 'Ops..',
                type: 'error',
            });
            return;
        }; // se non c'è un ID, non facciamo nulla

        const titleValidation = validateEditableTitle(title);

        if (titleValidation.shouldClear) {
            // se il titolo è vuoto, lo rimuoviamo
            setPinnedMessages((prev) =>
                prev.map((msg) => (msg._id === messageId ? { ...msg, title: undefined } : msg))
            );
            return;
        };

        if (titleValidation.isBlankAfterTrim) {
            enqueueSnackbar("Il titolo non può essere vuoto.", {
                title: 'Ops..',
                type: 'error',
            });
            return;
        };

        if (titleValidation.isAtLimit) {
            enqueueSnackbar("Il titolo non può superare i 20 caratteri.", {
                title: 'Ops..',
                type: 'warning',
            });
        };

        if (titleValidation.isTooLong) return;

        // aggiorna il titolo del messaggio
        setPinnedMessages((prev) =>
            prev.map((msg) => (msg._id === messageId ? { ...msg, title: titleValidation.value } : msg))
        );
    };

    // Funzione per rimuovere un messaggio dalla cronologia
    const deleteConversation = (conversationId: string) => {
        setHistory((prev: Conversation[]) => prev.filter((cv: Conversation) => cv.id !== conversationId));
        if (conversation?.id === conversationId) {
            setConversation(null);
            setShowHero(true);
        };
        setIdSelected(null);
    };

    // Funzione per cambiare il titolo della conversazione
    const changeConversationTitle = (messageId: string | undefined, title: string) => {
        if (!messageId) {
            console.error("No message ID provided for title change.");
            enqueueSnackbar("Nessun ID di messaggio fornito per il cambio titolo.", {
                title: 'Ops..',
                type: 'error',
            });
            return;
        }; // se non c'è un ID, non facciamo nulla

        const titleValidation = validateEditableTitle(title);

        if (titleValidation.shouldClear) {
            // se il titolo è vuoto, lo rimuoviamo
            setHistory((prev: Conversation[]) =>
                prev.map((conv: Conversation) => (conv.id === messageId ? { ...conv, title: undefined } : conv))
            );
            // se la conversazione corrente è quella che stiamo modificando, aggiorniamo anche il titolo della conversazione
            if (conversation?.id === messageId) {
                setConversation((prev: Conversation | null) => prev ? { ...prev, title: undefined } : null);
            };
            return;
        };

        if (titleValidation.isBlankAfterTrim) {
            enqueueSnackbar("Il titolo non può essere vuoto.", {
                title: 'Ops..',
                type: 'error',
            });
            return;
        };

        if (titleValidation.isAtLimit) {
            enqueueSnackbar("Il titolo non può superare i 20 caratteri.", {
                title: 'Ops..',
                type: 'warning',
            });
        };

        if (titleValidation.isTooLong) return;

        // aggiorna il titolo del messaggio
        setHistory((prev: Conversation[]) =>
            prev.map((conv: Conversation) => (conv.id === messageId ? { ...conv, title: titleValidation.value } : conv))
        );
        // se la conversazione corrente è quella che stiamo modificando, aggiorniamo anche il titolo della conversazione
        if (conversation?.id === messageId) {
            setConversation((prev: Conversation | null) => prev ? { ...prev, title: titleValidation.value } : null);
        };
    };

    // ----------------------------------------
    // CONTEXT PINNED MENU
    // ----------------------------------------
    const contextMenuPINNED = [
        {
            title: 'Colore',
            icon: <PaintBucket />,
            childrenMenu: [
                {
                    component: (
                        <ColorSwitch
                            selectedColor={pinnedSelected?.color?.main}
                            onChange={(c: ColorOption | null) => id_selected && changeColor(id_selected.value, c)}
                        />
                    )
                }
            ]
        },
        {
            title: 'Rinomina',
            icon: <Rename />,
            childrenMenu: [
                {
                    component: (
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Messaggio Fissato"
                                    value={pinnedSelected?.title || ''}
                                    className="border border-gray-700 rounded text-sm text-white p-2"
                                    onChange={(e) => changePinnedTitle(pinnedSelected?._id, e.target.value)}
                                />
                                <FDIconButton
                                    icon={<DeleteIcon className="text-red-700" />}
                                    variant="text"
                                    onClick={() => changePinnedTitle(pinnedSelected?._id, "")}
                                    className="hover:bg-neutral-700"
                                />
                            </div>
                            {(pinnedSelected?.title && pinnedSelected?.title.length > 20) && (
                                <span className="text-gray-500 text-sm text-yellow-500">Il testo non puo essere piu lungo di 20 caratteri.</span>
                            )}
                        </div>

                    )
                }
            ]
        },
        {
            title: 'Cancella blocco',
            icon: <CloseIcon />,
            onClick: () => id_selected && unpinMessage(id_selected.value),
        }
    ];

    // ----------------------------------------
    // CONTEXT CONVERSATION MENU
    // ----------------------------------------
    const contextMenuCONV = [
        {
            title: 'Rinomina',
            icon: <Rename />,
            childrenMenu: [
                {
                    component: (
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Messaggio Fissato"
                                    value={conversation__?.title || ''}
                                    className="border border-gray-700 rounded text-sm text-white p-2"
                                    onChange={(e) => changeConversationTitle(conversation__?.id, e.target.value)}
                                />
                                <FDIconButton
                                    icon={<DeleteIcon className="text-red-700" />}
                                    variant="text"
                                    onClick={() => changeConversationTitle(conversation__?.id, "")}
                                    className="hover:bg-neutral-700"
                                />
                            </div>
                            {(conversation__?.title && conversation__?.title.length > 20) && (
                                <span className="text-gray-500 text-sm text-yellow-500">Il testo non puo essere piu lungo di 20 caratteri.</span>
                            )}
                        </div>

                    )
                }
            ]
        },
        {
            title: 'Cancella Conversazione',
            icon: <DeleteIcon />,
            onClick: () => id_selected && deleteConversation(id_selected.value),
        }
    ];

    // ----------------------------------------
    // CONTEXT MODELS MENU (ora usa agents da DB)
    // ----------------------------------------
    const contextMenuMODELS = agents.map((agent) => {
        const agentSelectValue = formatAgentForSelect(agent);
        return {
            title: `${agent.displayName} ${agent.version}`,
            onClick: () => setSelectedModel(agentSelectValue),
            icon: <IoCloud className={selectedModel === agentSelectValue ? "text-yellow-500" : ""} />,
        };
    });

    // Effetto per gestire lo scroll del body in base alla modalità
    // Se la modalità è fullscreen, disabilita lo scroll del body
    useEffect(() => {
        if (mode === 'fullscreen') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [mode]);


    return (<AnimatePresence>
        {open && <>
            <div className={`fixed inset-0 overflow-hidden ${mode === 'fullscreen' ? 'z-50' : 'z-20 pointer-events-none'
                }`}>
                <motion.div
                    drag={mode === "windowed"}
                    dragMomentum={false}
                    dragConstraints={{
                        top: 0,
                        left: 0,
                        right: windowW - BOX_W,
                        bottom: windowH - BOX_H,
                    }}
                    style={{ x, y }}
                    animate={controls}
                    onDragEnd={handleDragEnd}
                    className={`relative pointer-events-auto z-20 bg-white dark:bg-zinc-800 transition-colors duration-300
                    shadow-2xl flex flex-row overflow-hidden dark:text-white text-black`}
                >
                    <SideBar
                        open={showHistoryTab && !showSettings}
                        menuRef={menuRef}
                        setShowHero={setShowHero}
                        LoadConversation={LoadConversation}
                        resetToHero={resetToHero}

                        setIdSelected={setIdSelected}
                    />

                    <div className={`flex flex-col relative w-full h-full ${(showHistoryTab && !showSettings) ? 'pl-70' : 'pl-0'} transition-margin duration-300`}>
                        <AIHeader toggleMode={toggleMode} mode={mode} conversation_id={conversation?.id} showHero={showHero} handleHistoryTab={handleHistoryTab} isHistoryTabOpen={showHistoryTab}
                            isSettingsOpen={showSettings}
                            handleSettingsToggle={handleSettingsToggle}
                            isSettingsSidebarOpen={showSettingsSidebar}
                            handleSettingsSidebarToggle={handleSettingsSidebarToggle}
                            selectedModel={selectedModel}
                            setOpenModelSelect={setOpenModelSelect}
                            menuRef={menuRef}
                        />

                        {/* Pannello Settings */}
                        <Settings isOpen={showSettings} showSidebar={showSettingsSidebar} />

                        <div
                            className={`logo-water-wrapper absolute ${!talkMode ?
                                showHero ? 'left-1/2 w-3/3 h-3/3 min-w-[600px]' : `${showHistoryTab ? 'ml-70' : 'ml-0'} top-3 left-4 w-10 h-10`
                                : `${showHistoryTab ? 'ml-35' : 'ml-0'} left-0 top-[15%] w-full h-2/3`} 
                            transition-all duration-300 ease-in-out ${showSettings ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                            style={{
                                overflow: 'hidden',
                            }}
                        ><WaterShaderScene /></div>

                        {!showSettings && !talkMode && (showHero ? (
                            <motion.div
                                key="hero"
                                initial={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="flex-1 flex items-center justify-center"
                            >
                                <Hero handleSend={handleSend} ChangeLoadStatus={ChangeLoadStatus} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex-1 overflow-hidden flex flex-col p-1"
                            >
                                {conversation && <ChatInteraction
                                    messages={conversation.messages}
                                    loadStatus={loadStatus}
                                    onPinMessage={pinMessage}
                                    onUnpinMessage={unpinMessage}
                                    pinnedMessages={pinnedMessages}
                                    showHistoryTab={showHistoryTab}
                                    RetryOnFail={handleSend} />}
                            </motion.div>
                        ))}

                        {!showSettings && (
                            <PromptInput talkMode={talkMode} onSend={handleSend}
                                ChangeLoadStatus={ChangeLoadStatus} HandleChangeTalkMode={HandleChangeTalkMode}
                                loadStatus={loadStatus} abortController={abortController} />
                        )}
                    </div>

                    {!showSettings && pinnedMessages.map((msg, index) => (
                        <PinnedMessageBox
                            key={index}
                            message={msg}
                            index={index}
                            mode={mode}
                            menuPinnedRef={menuRef}
                            setMenuPinnedId={setIdSelected}
                        />
                    ))}
                </motion.div>
            </div>
            <ContextMenu
                openFor={!!id_selected || openModelSelect}
                pos={menuRef}
                onClose={() => { setIdSelected(null); setOpenModelSelect(false); }}
                menuButtons={id_selected?.from === 'pinned' ? contextMenuPINNED : openModelSelect ? contextMenuMODELS : contextMenuCONV}
            />
            <Tooltip id="general-ai-tooltip" place="bottom" className="max-w-[15vw] min-w-[150px] !text-xs text-center z-50 !rounded-md" />
        </>}
    </AnimatePresence>
    );
};

export default AILayout;