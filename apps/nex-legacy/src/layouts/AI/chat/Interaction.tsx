import React, { useEffect, useLayoutEffect, useRef, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Message } from "context/AIContext";

import InteractionFooter from "./InteractionFooter";
import RichMessage from "./RichMessage";
import FDIconButton from "components/UI/buttons/FDIconButton";

import { IoArrowDownOutline } from "react-icons/io5";
import { PiBrainBold } from "react-icons/pi";


const ArrowDownIcon = IoArrowDownOutline as React.FC<{ size?: number }>;
const PiBrainBoldIcon = PiBrainBold as React.FC<{ size?: number; className?: string }>;

const BOTTOM_THRESHOLD = 120;
const REASONING_MESSAGES: readonly string[] = [
    // "Sto analizzando il contesto della conversazione…",
    // "Riunisco le informazioni più rilevanti per te…",
    // "Controllo che la risposta sia coerente con i messaggi precedenti…",
    // "Valuto le possibili alternative per darti il risultato migliore…",
    // "Ottimizzo la risposta per essere chiara e completa…",
    // "Incrocio i dati che mi hai fornito con la mia base di conoscenza…",
    // "Verifico che non ci siano contraddizioni nelle informazioni…",
    // "Strutturo la risposta in modo ordinato e leggibile…",
    // "Controllo i dettagli tecnici per evitare errori…",
    // "Rifinisco la formulazione per rendere il tutto più comprensibile…",
    // "Bilancio sintesi e completezza nella spiegazione…",
    // "Mi assicuro che il risultato sia utile per il tuo caso specifico…",
    "Sono un agente AI: elaboro la risposta e ti avviso quando ho finito con una notifica"
];

interface ReasoningStatusProps {
    isActive: boolean;
};

interface ChatInteractionProps {
    messages: Message[];
    loadStatus: { [key: string]: any };
    onPinMessage: (message: Message) => void;
    onUnpinMessage: (message_id: string) => void;
    pinnedMessages: Message[];
    showHistoryTab?: boolean;
    RetryOnFail: ({ input, retry }: { input: string; retry: boolean }) => void;
};

/**
 * Componente che mostra lo stato di "reasoning" dell'AI con messaggi rotanti.
 * @param isActive Boolean | Indica se l'AI sta ragionando.
 * @returns JSX.Element | Componente di stato reasoning.
 */
const ReasoningStatus: React.FC<ReasoningStatusProps> = ({ isActive }) => {
    const [index, setIndex] = React.useState(0);

    // Ruota le frasi solo quando attivo
    React.useEffect(() => {
        if (!isActive) return;

        // reset alla prima frase ogni volta che riparte
        setIndex(0);

        const interval = window.setInterval(() => {
            setIndex((prev) => (prev + 1) % REASONING_MESSAGES.length);
        }, 2600); // ~2.6s per frase

        return () => {
            window.clearInterval(interval);
        };
    }, [isActive]);

    if (!isActive) return null;

    return (
        <motion.div
            className="flex items-start gap-3 text-xs text-neutral-500 dark:text-neutral-400 pt-2 pb-60"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Icona “cervello” con glow morbido */}
            <motion.div
                className="mt-[2px] flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100/80 dark:bg-neutral-800/70 border border-neutral-200/70 dark:border-neutral-700/80 shadow-sm"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            >
                <PiBrainBoldIcon className="text-neutral-700 dark:text-neutral-200" size={16} />
            </motion.div>

            <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
                    AI reasoning
                </span>

                <div className="relative min-h-[18px]">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={index}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="text-[11px] leading-snug text-neutral-600 dark:text-neutral-300"
                        >
                            {REASONING_MESSAGES[index]}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

// lightweight fingerprint: concatenazione limitata
const fingerprintMessage = (msg: Message): string => {
    if (msg.blocks && msg.blocks.length > 0) {
        return msg.blocks
            .map((b) => {
                if (b.kind === "text") return (b as any).text.slice(0, 100);
                if (b.kind === "table") {
                    const cols = (b as any).table.columns.join(",");
                    const previewRow = ((b as any).table.rows[0] || []).slice(0, 3).join(",");
                    return cols + "|" + previewRow;
                }
                if (b.kind === "code") return (b as any).code.slice(0, 100);
                return "";
            })
            .join("||");
    }
    return msg.content.slice(0, 200);
};

function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
}

const ScrollToBottomButton: React.FC<{ onClick: () => void, showHistoryTab?: boolean }> = ({ onClick }) => (
    <FDIconButton
        icon={<ArrowDownIcon size={20} />}
        variant="general"
        onClick={onClick}
        aria-label="Vai all'ultimo messaggio"
        className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 border border-gray-300 bg-white shadow-md transition hover:shadow-lg dark:border-neutral-600 dark:bg-neutral-800"
    />
);

/**
 * ChatInteraction componente che gestisce la visualizzazione e l'interazione con i messaggi della chat.
 * Utilizza un sistema di scroll efficiente e ottimizza il rendering dei messaggi.
 * @param { Message } msg - Il messaggio da visualizzare.
 * @param { boolean } isLast - Indica se il messaggio è l'ultimo della lista.
 * @param { function } onPinMessage - Funzione per pinnare un messaggio.
 * @param { function } onUnpinMessage - Funzione per rimuovere il pin da un messaggio.
 * @param { Message[] } pinnedMessages - Lista dei messaggi pinnati.
 * @param { function } RetryOnFail - Funzione per gestire il retry in caso di errore.
 * @param { number } index - Indice del messaggio nella lista.
 * @returns { JSX.Element } - Il componente di rendering del messaggio.
 * @memo - Ottimizza il rendering confrontando i messaggi tramite fingerprint.
 */
const MessageItem = memo(
    ({
        msg,
        isLast,
        onPinMessage,
        onUnpinMessage,
        pinnedMessages,
        RetryOnFail,
        //index,
    }: {
        msg: Message;
        isLast: boolean;
        onPinMessage: (m: Message) => void;
        onUnpinMessage: (id: string) => void;
        pinnedMessages: Message[];
        RetryOnFail: ({ input, retry }: { input: string; retry: boolean }) => void;
        index: number;
    }) => {
        return (
            <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col gap-1 max-w-[75%] w-fit text-black/80 dark:text-white ${msg.type === "user" ? "ml-auto" : "mr-auto"
                    } ${isLast ? "pb-20" : ""}`}
            >
                <div
                    className={`rounded-xl text-base ${msg.type === "user"
                        ? `py-3 px-4 bg-gray-200/30 dark:bg-neutral-700/40 border border-gray-200 dark:border-neutral-700`
                        : msg.isError
                            ? "flex align-center gap-2 p-5 bg-red-100/50 dark:bg-red-800/20 border border-red-200 dark:border-red-800/50"
                            : "py-2"
                        }`}
                >
                    <RichMessage message={msg} isError={msg.isError} />
                </div>
                <InteractionFooter
                    isUser={msg.type === "user"}
                    message={msg}
                    onPin={onPinMessage}
                    onUnpin={onUnpinMessage}
                    isPinned={pinnedMessages.some((p) => p._id === msg._id)}
                    isError={msg.isError}
                    RetryOnFail={() => RetryOnFail({ input: "", retry: true })}
                />
            </motion.div>
        );
    },
    (prev, next) => {
        if (prev.msg._id !== next.msg._id) return false;
        if (prev.msg.type !== next.msg.type) return false;
        if (prev.msg.isError !== next.msg.isError) return false;
        if (prev.msg.content !== next.msg.content) return false;
        // blocchi: confronto semplificato
        return fingerprintMessage(prev.msg) === fingerprintMessage(next.msg);
    }
);

/**
 * ChatInteraction componente che gestisce la visualizzazione e l'interazione con i messaggi della chat.
 * @param { Message[] } messages - Lista dei messaggi da visualizzare.
 * @param { object } loadStatus - Stato di caricamento dei messaggi.
 * @param { function } onPinMessage - Funzione per pinnare un messaggio.
 * @param { function } onUnpinMessage - Funzione per rimuovere il pin da un messaggio.
 * @param { Message[] } pinnedMessages - Lista dei messaggi pinnati.
 * @param { function } RetryOnFail - Funzione per gestire il retry in caso di errore.
 * @returns { JSX.Element } - Il componente di rendering della chat.
 */
const ChatInteraction: React.FC<ChatInteractionProps> = ({
    messages,
    loadStatus,
    showHistoryTab,
    onPinMessage,
    onUnpinMessage,
    pinnedMessages,
    RetryOnFail,
}) => {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const prevMessages = usePrevious(messages);
    const [isUserNearBottom, setIsUserNearBottom] = useState(true);

    const userJustSentRef = useRef(false);
    const userInterruptedRef = useRef(false);
    const aiShouldAutoScrollRef = useRef(false);
    const lastAIFingerprintRef = useRef<string>("");

    // efficiente scroll detection
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        let rafId: number | null = null;

        // scroll listener: controlla se l'utente è vicino al fondo
        const onScroll = () => {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                const { scrollTop, scrollHeight, clientHeight } = container;
                const nearBottom = scrollHeight - scrollTop - clientHeight <= BOTTOM_THRESHOLD;
                setIsUserNearBottom((prev) => {
                    if (prev === nearBottom) return prev;
                    return nearBottom;
                });
                // se l'utente scrolla verso l'alto, taglia il follow automatico
                // questo richiede un tracciamento aggiuntivo via wheel/touchmove
            });
        };

        // wheel listener: per gestire lo scroll verso l'alto
        const onWheel = (e: WheelEvent) => {
            if (e.deltaY < 0 && userJustSentRef.current) {
                userInterruptedRef.current = true;
            }
            if (e.deltaY < 0 && aiShouldAutoScrollRef.current) {
                aiShouldAutoScrollRef.current = false;
            }
        };

        container.addEventListener("scroll", onScroll, { passive: true });
        container.addEventListener("wheel", onWheel, { passive: true });
        container.addEventListener("touchmove", onScroll, { passive: true });

        // initial measurement
        onScroll();

        return () => {
            container.removeEventListener("scroll", onScroll);
            container.removeEventListener("wheel", onWheel);
            container.removeEventListener("touchmove", onScroll as any);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    // coalesced scrollToBottom: evita troppi scroll consecutivi
    const scrollScheduled = useRef<boolean>(false);
    const scheduleScroll = useCallback(() => {
        if (scrollScheduled.current) return;
        scrollScheduled.current = true;
        requestAnimationFrame(() => {
            scrollScheduled.current = false;
            if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
            else if (scrollRef.current)
                scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        });
    }, []);

    // core logic
    useLayoutEffect(() => {
        const prevLen = prevMessages?.length || 0;
        const newLen = messages.length;
        const lastMessage = messages[newLen - 1];
        const isUserMessage = lastMessage?.type === "user";
        const isAIMessage = lastMessage?.type === "ai";

        if (newLen > prevLen) {
            if (isUserMessage) {
                scheduleScroll();
                userJustSentRef.current = true;
                userInterruptedRef.current = false;
                aiShouldAutoScrollRef.current = false;
            } else if (isAIMessage) {
                const fingerprint = fingerprintMessage(lastMessage);
                const canFollow =
                    (userJustSentRef.current && !userInterruptedRef.current) || isUserNearBottom;
                if (canFollow) {
                    aiShouldAutoScrollRef.current = true;
                    scheduleScroll();
                    lastAIFingerprintRef.current = fingerprint;
                } else {
                    aiShouldAutoScrollRef.current = false;
                }
                userJustSentRef.current = false;
            }
            return;
        }

        if (isAIMessage && aiShouldAutoScrollRef.current) {
            const fingerprint = fingerprintMessage(lastMessage);
            if (fingerprint !== lastAIFingerprintRef.current) {
                lastAIFingerprintRef.current = fingerprint;
                scheduleScroll();
            }
        }
    }, [messages, prevMessages, isUserNearBottom, scheduleScroll]);

    return (
        <div className="relative flex-1 min-h-0 overflow-hidden">
            <div ref={scrollRef} className="h-full overflow-y-auto overflow-x-hidden p-6 px-10 space-y-4">
                {messages.map((msg, i) => (
                    <MessageItem
                        key={msg._id}
                        msg={msg}
                        index={i}
                        isLast={i === messages.length - 1}
                        onPinMessage={onPinMessage}
                        onUnpinMessage={onUnpinMessage}
                        pinnedMessages={pinnedMessages}
                        RetryOnFail={RetryOnFail}
                    />
                ))}
                {/* Nuovo loader in stile reasoning */}
                <ReasoningStatus isActive={!!loadStatus.ai_message} />
                <div ref={bottomRef} aria-hidden="true" style={{ height: 1, width: "100%" }} />
            </div>

            {!isUserNearBottom && (
                <ScrollToBottomButton
                    showHistoryTab={showHistoryTab}
                    onClick={() => {
                        // forza lo scroll e abilita follow per AI se necessario
                        scheduleScroll();
                        // consideriamo che l’utente ora è “a fondo"
                        // reset delle interruzioni per permettere follow se arriva AI
                        userInterruptedRef.current = false;
                        aiShouldAutoScrollRef.current = true;
                    }}
                />
            )}
        </div>
    );
};

export default ChatInteraction;