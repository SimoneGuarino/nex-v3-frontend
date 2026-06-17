import React from "react";
//types
import { Message } from "context/AIContext";

import { motion, AnimatePresence } from "framer-motion";
import { FDIconButton } from "@nex/fd-ui";
//icons
import * as FaIcons from "react-icons/ai";
import { IoReloadOutline, IoCopyOutline } from "react-icons/io5";
import { GoDownload } from "react-icons/go";


const AiOutlineLike = FaIcons.AiOutlineLike as React.FC<{ className?: string }>;
const AiOutlineDislike = FaIcons.AiOutlineDislike as React.FC<{ className?: string }>;
const AiOutlinePushpin = FaIcons.AiOutlinePushpin as React.FC<{ className?: string }>;
const AiFillPushpin = FaIcons.AiFillPushpin as React.FC<{ className?: string }>;
const AiOutlineReload = IoReloadOutline as React.FC<{ className?: string }>;
const AiOutlineCopy = IoCopyOutline as React.FC<{ className?: string }>;
const AiOutlineDownload = GoDownload as React.FC<{ className?: string }>;

interface InteractionFooterProps {
    isUser: boolean;
    message: Message;
    onPin: (message: Message) => void;
    onUnpin: (message_id: string) => void; // Aggiunto per gestire la rimozione della fissazione
    isPinned: boolean;
    isError?: boolean; // Aggiunto per gestire lo stato di errore del messaggio
    RetryOnFail: () => void; // Aggiunto per gestire il retry in caso di errore
};
/**
 * Componente per il footer di interazione della chat
 * @param { boolean } isUser - Indica se il messaggio è dell'utente o dell'AI
 * @param { Message } message - Il messaggio corrente
 * @param { Function } onPin - Funzione per fissare il messaggio
 * @param { Function } onUnpin - Funzione per rimuovere la fissazione del messaggio
 * @param { boolean } isPinned - Indica se il messaggio è già fissato
 * @param { boolean } isError - Indica se il messaggio ha generato un errore
 * @param { Function } RetryOnFail - Funzione per gestire il retry in caso di errore
 * @returns { JSX.Element }
 */
const InteractionFooter: React.FC<InteractionFooterProps> = ({ isUser, message, onPin, onUnpin, isPinned, isError, RetryOnFail }) => {
    //funzione per copiare il messaggio negli appunti
    const copyToClipboard = () => {
        navigator.clipboard.writeText(message.content).then(() => {
            console.log("Messaggio copiato negli appunti");
        }).catch(err => {
            console.error("Errore nella copia del messaggio: ", err);
        });
    };

    return (
        <div className={`flex ${isUser && 'justify-end'}`}>
            <FDIconButton
                variant="text"
                dataTooltipId='general-ai-tooltip'
                dataTooltipContent={`Copia`}
                icon={<AiOutlineCopy />}
                onClick={copyToClipboard}
            />
            {!isUser && (
                <>
                    <FDIconButton
                        variant="text"
                        dataTooltipId='general-ai-tooltip'
                        dataTooltipContent={isPinned ? `Messaggio già fissato` : `Fissa messaggio nella finestra rendendolo sempre visibile`}
                        onClick={() => isPinned ? onUnpin(message._id) : onPin(message)}
                        icon={
                            <AnimatePresence mode="wait">
                                {isPinned ? (
                                    <motion.div
                                        key="filled"
                                        initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                        exit={{ scale: 0.5, rotate: 45, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                    >
                                        <AiFillPushpin className="text-blue-500" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="outline"
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.5, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <AiOutlinePushpin />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        }
                    />
                    <FDIconButton
                        variant="text"
                        disabled
                        dataTooltipId='general-ai-tooltip'
                        dataTooltipContent={`[In Sviluppo] Risposta sbagliata`}
                        icon={<AiOutlineLike className="text-gray-300 dark:text-gray-600" />}
                    />
                    <FDIconButton
                        variant="text"
                        disabled
                        dataTooltipId='general-ai-tooltip'
                        dataTooltipContent={`[In Sviluppo] Risposta giusta`}
                        icon={<AiOutlineDislike className="text-gray-300 dark:text-gray-600" />}
                    />
                    {isError && <FDIconButton
                        variant="text"
                        dataTooltipId='general-ai-tooltip'
                        dataTooltipContent={`Riprova a generare la risposta`}
                        icon={<AiOutlineReload />}
                        onClick={RetryOnFail}
                    />}
                </>
            )}
        </div>
    );
};

export default InteractionFooter;
