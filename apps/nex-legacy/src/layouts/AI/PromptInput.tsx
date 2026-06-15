import { useContext, useState } from "react";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid"; // npm install uuid

import FDIconButton from "components/UI/buttons/FDIconButton";

//icons
import * as FaIcons from "react-icons/fa";
import { LuAudioLines } from "react-icons/lu";
import { CiMicrophoneOn } from "react-icons/ci";
import { IoCloseSharp, IoStop } from "react-icons/io5";
import { AIContext, Conversation, Message } from "context/AIContext";

const FaPaperPlane = FaIcons.FaPaperPlane as React.FC<{ className?: string }>;
const FaCube = FaIcons.FaCube as React.FC<{ className?: string }>;
const AudioIcons = LuAudioLines as React.FC<{ className?: string }>;
const MicrophoneIcon = CiMicrophoneOn as React.FC<{ size?: number }>;
const CloseIcon = IoCloseSharp as React.FC<{ size?: number }>;
const IoStopIcon = IoStop as React.FC<{ className?: string }>;


interface PromptInputProps {
    loadStatus: { [key: string]: boolean }; // Aggiunto per gestire lo stato di caricamento
    talkMode: boolean; // Aggiunto per gestire la modalità di conversazione vocale
    abortController: React.MutableRefObject<AbortController | null>; // Aggiunto per gestire l'abort del fetch
    onSend: ({ input }: { input: string }) => void;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
    HandleChangeTalkMode?: () => void; // Aggiunto per gestire la modalità di conversazione vocale
    embedded?: boolean; // Se true, ancora l'input dentro un pannello pagina invece che al viewport
}
/**
 * PromptInput componente che gestisce l'input dell'utente per inviare messaggi all'AI.
 * @param { [key: string]: boolean } loadStatus - Stato di caricamento dei messaggi.
 * @param { boolean } talkMode - Modalità di conversazione vocale.
 * @param { React.MutableRefObject<AbortController | null> } abortController - Riferimento per gestire l'abort del fetch.
 * @param { function } onSend - Funzione per inviare il messaggio.
 * @param { function } ChangeLoadStatus - Funzione per cambiare lo stato di caricamento.
 * @param { function } HandleChangeTalkMode - Funzione per gestire la modalità di conversazione vocale.
 * @returns { JSX.Element } - Il componente di input per l'utente.
 */
const PromptInput: React.FC<PromptInputProps> = ({ loadStatus, talkMode, abortController, onSend, ChangeLoadStatus, HandleChangeTalkMode, embedded = false }) => {
    const { conversation, setConversation, setHistory } = useContext(AIContext);

    const [input, setInput] = useState("");

    // Funzione di invio al click del bottone
    const handleSend = () => {
        if (!input.trim() || loadStatus.ai_message) return;
        ChangeLoadStatus({ from: "ai_message", bool: true });
        onSend({ input });
        setInput("");
    };

    // Funzione per fermare l'AI in caso di richiesta lunga
    // Reset dell'abort controller per evitare conflitti
    // e invio di un messaggio di errore se l'AI viene fermata
    const StopMessage = () => {
        if (!conversation || !abortController.current || !loadStatus.ai_message) return; // Se non c'è una conversazione, non fare nulla
        // Crea un messaggio di errore per l'AI
        const aiMessage: Message = { type: "ai", content: "", createdAt: Date.now(), _id: uuidv4(), isError: true };

        if (abortController.current) {
            abortController.current.abort(); // Ferma la richiesta in corso
            abortController.current = null; // Reset dell'abort controller
        }
        // Aggiungi un messaggio di errore all'AI
        setConversation((prev: Conversation | null) => {
            if (prev) {
                return { ...prev, messages: [...prev.messages, aiMessage] };
            };
            return prev;
        });
        // Aggiungi il messaggio di errore alla cronologia
        // per mantenere la consistenza della conversazione
        setHistory((prev: Conversation[]) => {
            return prev.map((conv) => {
                if (conversation && conv.id === conversation.id) {
                    return { ...conv, messages: [...conv.messages, aiMessage] };
                }
                return conv;
            });
        });
        // Cambia lo stato di caricamento per l'AI
        ChangeLoadStatus({ from: "ai_message", bool: false });
    }

    // Funzione di invio al click di invio sulla tastiera
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (loadStatus.ai_message) return; // Se è in caricamento, non inviare
        if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
        };
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className={`${embedded ? "absolute bottom-4 left-0 right-0" : "fixed bottom-4"} flex flex-col justify-center z-10 px-4 sm:px-8 dark:text-white text-black items-center w-[-webkit-fill-available]`}>
            {!talkMode ?
                <div
                    className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center shadow-lg w-full max-w-3xl relative border border-gray-200 dark:border-neutral-600">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-transparent text-black/80 dark:text-white flex-grow outline-none placeholder:text-neutral-300/70 text-sm sm:text-base py-2"
                        placeholder="Scrivi un messaggio..."
                    />
                    <FDIconButton
                        variant="text"
                        dataTooltipId='general-ai-tooltip'
                        dataTooltipContent={`Invia`}
                        icon={loadStatus.ai_message ? <IoStopIcon /> : <FaPaperPlane />}
                        onClick={() => loadStatus.ai_message ? StopMessage() : handleSend()}
                    />
                    <FDIconButton
                        variant="text"
                        //disabled={true}
                        dataTooltipId='general-ai-tooltip'
                        dataTooltipContent={`[IN SVILUPPO] Parla con l'AI`}
                        icon={<AudioIcons />}
                        onClick={HandleChangeTalkMode}
                    />
                </div> : <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="flex items-center w-full items-center justify-center gap-2">
                    <FDIconButton
                        size='large'
                        dataTooltipId='general-ai-tooltip'
                        dataTooltipContent={`Abilita/Disabilita microfono`}
                        icon={<MicrophoneIcon size={30} />}
                        onClick={handleSend}
                    />
                    <FDIconButton
                        size='large'
                        dataTooltipId='general-ai-tooltip'
                        dataTooltipContent={`Torna alla chat`}
                        icon={<CloseIcon size={30} />}
                        onClick={HandleChangeTalkMode}
                    />
                </motion.div>}

            <span className="text-xs text-gray-300 dark:text-gray-400 mt-2">
                Anche l'AI può sbagliare, controlla sempre le informazioni fornite.
            </span>
        </motion.div>
    );
};

export default PromptInput;