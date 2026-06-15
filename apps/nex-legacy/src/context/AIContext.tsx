import { ColorOption } from "components/UI/colors/ColorSwitch";
import React, { useState, createContext, Dispatch, SetStateAction, ReactNode, useEffect, useRef } from "react";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
export type TableData = {
    columns: string[];
    rows: Array<(string | number | null)[]>;
    // opzionale: metadata (es. tipi, allineamenti, chiavi)
    meta?: {
        align?: ("left" | "center" | "right")[];
        types?: ("string" | "number" | "date")[];
    };
};

export type MessageBlock =
    | { kind: "text"; text: string }
    | { kind: "table"; table: TableData }
    | { kind: "code"; code: string; language?: string };

// Tipi per i messaggi della chat
export type Message = {
    _id: string;
    type: "user" | "ai";
    version?: string;
    title?: string; // opzionale: titolo del messaggio
    // mantenere content per fallback / compatibilità (es. puro markdown)
    content: string;
    blocks?: MessageBlock[]; // nuovo: struttura
    createdAt: number;
    isError?: boolean;
    color?: ColorOption;
};

// Tipi per una conversazione completa
export type Conversation = {
    id: string;
    title?: string;
    messages: Message[];
    createdAt: number;
};

export type AIScope =
    | {
        kind: "GENERAL";
      }
    | {
        kind: "MEPA_TENDER";
        tenderId: string;
        title?: string;
        subtitle?: string;
      };

export type AIPresentationMode = "FLOATING" | "PAGE_DOCKED";

// Tipi per il contesto AI
type AIContextType = {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    history: Conversation[];
    setHistory: Dispatch<SetStateAction<Conversation[]>>;
    memory: Message[];
    setMemory: Dispatch<SetStateAction<Message[]>>;
    conversation: Conversation | null;
    setConversation: Dispatch<SetStateAction<Conversation | null>>;
    aiUnreadCount: number;
    aiScope: AIScope;
    setAiScope: Dispatch<SetStateAction<AIScope>>;
    aiPresentationMode: AIPresentationMode;
    setAiPresentationMode: Dispatch<SetStateAction<AIPresentationMode>>;
    aiAttentionPulse: number;
    requestAiAttention: () => void;
};


// ——————————————————————————————————————————————————————————
// CONTEXTO & PROVIDER
// ——————————————————————————————————————————————————————————
// Context vero e proprio
export const AIContext = createContext<AIContextType>({
    open: false,
    setOpen: () => { },
    history: [],
    setHistory: () => { },
    memory: [],
    setMemory: () => { },
    conversation: null,
    setConversation: () => { },
    aiUnreadCount: 0,
    aiScope: { kind: "GENERAL" },
    setAiScope: () => { },
    aiPresentationMode: "FLOATING",
    setAiPresentationMode: () => { },
    aiAttentionPulse: 0,
    requestAiAttention: () => { },
});

const collectAIMessageIds = (conversations: Conversation[]): string[] => {
    const ids: string[] = [];

    conversations.forEach((conversation) => {
        (conversation.messages || []).forEach((message) => {
            if (message.type === "ai" && message._id) {
                ids.push(message._id);
            }
        });
    });

    return ids;
};

// Provider che avvolge l'applicazione
export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [open, setOpen] = useState<boolean>(false); // Stato per il pannello AI generale
    const [memory, setMemory] = useState<Message[]>([]); // Memoria dei messaggi
    const [history, setHistory] = useState<Conversation[]>([]); // Cronologia delle conversazioni
    const [conversation, setConversation] = useState<Conversation | null>(null); // Conversazione corrente
    const [aiUnreadCount, setAiUnreadCount] = useState<number>(0); // Messaggi AI non letti nel bottone topbar
    const [aiScope, setAiScope] = useState<AIScope>({ kind: "GENERAL" }); // Contesto operativo AI (generale o workspace MEPA)
    const [aiPresentationMode, setAiPresentationMode] = useState<AIPresentationMode>("FLOATING"); // Modalità di presentazione del pannello AI
    const [aiAttentionPulse, setAiAttentionPulse] = useState<number>(0); // Segnale one-way per richiamare l'attenzione sul pannello AI gia' visibile

    const requestAiAttention = () => {
        setAiAttentionPulse((prev) => prev + 1);
    };

    // Tiene traccia dei messaggi AI già considerati "letti" dal client.
    const seenAIMessageIdsRef = useRef<Set<string>>(new Set());
    const hasInitializedUnreadSyncRef = useRef<boolean>(false);

    useEffect(() => {
        const aiMessageIds = collectAIMessageIds(history);

        // Prima sincronizzazione: considera lo stato iniziale come già letto.
        if (!hasInitializedUnreadSyncRef.current) {
            seenAIMessageIdsRef.current = new Set(aiMessageIds);
            hasInitializedUnreadSyncRef.current = true;
            return;
        }

        if (open) {
            // Quando il pannello è visibile, i messaggi AI sono considerati letti.
            seenAIMessageIdsRef.current = new Set(aiMessageIds);
            setAiUnreadCount((prev) => (prev === 0 ? prev : 0));
            return;
        }

        let newUnreadMessages = 0;
        aiMessageIds.forEach((id) => {
            if (!seenAIMessageIdsRef.current.has(id)) {
                seenAIMessageIdsRef.current.add(id);
                newUnreadMessages += 1;
            }
        });

        if (newUnreadMessages > 0) {
            setAiUnreadCount((prev) => prev + newUnreadMessages);
        }
    }, [history, open]);

    return (
        <AIContext.Provider
            value={{
                open,
                setOpen,
                history,
                setHistory,
                memory,
                setMemory,
                conversation,
                setConversation,
                aiUnreadCount,
                aiScope,
                setAiScope,
                aiPresentationMode,
                setAiPresentationMode,
                aiAttentionPulse,
                requestAiAttention,
            }}
        >
            {children}
        </AIContext.Provider>
    );
};