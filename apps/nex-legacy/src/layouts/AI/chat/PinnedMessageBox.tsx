// PinnedMessageBox.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Message } from "context/AIContext";
import RichMessage from "./RichMessage";
import { FDIconButton, type ColorOption } from "@nex/fd-ui";

import { IoEllipsisVertical } from "react-icons/io5";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";

const OutlineDown = AiOutlineDown as React.FC<{ size?: number }>;
const OutlineUp = AiOutlineUp as React.FC<{ size?: number }>;
const Settings = IoEllipsisVertical as React.FC<{ size?: number }>;

const BOX_W = 800;
const BOX_H = 600;

interface PinnedMessageBoxProps {
    title?: string;
    message: Message;
    index: number;
    menuPinnedRef: any;
    mode: "fullscreen" | "windowed";
    setMenuPinnedId: React.Dispatch<React.SetStateAction<{ from: 'pinned' | 'history'; value: string } | null>>;
};
const PinnedMessageBox: React.FC<PinnedMessageBoxProps> = ({
    message,
    index,
    mode,
    menuPinnedRef,
    setMenuPinnedId,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 300, height: 150 });
    const [expanded, setExpanded] = useState(true);

    const containerWidth = mode === "fullscreen" ? window.innerWidth : BOX_W;
    const containerHeight = mode === "fullscreen" ? window.innerHeight : BOX_H;

    useEffect(() => {
        const measure = () => {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect();
                setSize({ width: rect.width, height: rect.height });
            }
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [message]);

    return (
        <motion.div
            key={index}
            drag
            dragConstraints={{
                top: 0,
                left: 0,
                right: containerWidth - size.width,
                bottom: containerHeight - (size.height + 100),
            }}
            ref={ref}
            className={`fixed top-20 left-20 z-10 ${message.color ? `${message.color.main} ${message.color.type.text}` : 'bg-white dark:bg-neutral-900'}
            shadow-lg rounded-xl p-4 max-w-lg cursor-move`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex justify-between items-center mb-2 gap-2 text-inherit">
                <div className={`flex flex-col ${message.color && message.color.type.title}`}>
                    <span className="text-sm font-semibold">{message.title || "Messaggio Fissato"}</span>
                    <span className="text-xs">
                        {new Date(message.createdAt).toLocaleString()}
                    </span>
                </div>

                <div className="flex items-center gap-1 ml-auto">
                    <FDIconButton
                        variant="text"
                        icon={expanded ? <OutlineUp /> : <OutlineDown />}
                        onClick={() => setExpanded((e) => !e)}
                        dataTooltipId="general-ai-tooltip"
                        dataTooltipContent="Espandi o riduci"
                    />
                    <FDIconButton
                        variant="text"
                        icon={<Settings />}
                        onClick={(e: any) => {
                            setMenuPinnedId((curr: { from: 'pinned' | 'history'; value: string } | null) =>
                                curr?.value === message._id ? null : { from: 'pinned', value: message._id }
                            );
                            menuPinnedRef.current = e.currentTarget;
                        }}
                        dataTooltipId="general-ai-tooltip"
                        dataTooltipContent="Rimuovi messaggio fissato"
                    />
                </div>
            </div>

            <AnimatePresenceContent expanded={expanded} message={message} isError={message.isError} theme={message.color} />
        </motion.div>
    );
};

// Separato per gestire animazioni di expand/collapse
const AnimatePresenceContent: React.FC<{
    expanded: boolean;
    message: Message;
    isError?: boolean;
    theme?: ColorOption;
}> = ({ expanded, message, isError, theme }) => {
    return (
        <div className={`text-sm ${theme ? theme.type.text : 'text-black dark:text-white'} break-words overflow-hidden`}>
            {expanded ? (
                <motion.div
                    key="expanded-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                    <RichMessage message={message} isError={isError} />
                </motion.div>
            ) : (
                <motion.div
                    key="collapsed-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className={`text-center ${theme && theme.type.subtitle}`}
                >
                    <p>espandi per vedere il contenuto</p>
                </motion.div>
            )}
        </div>
    );
};

export default React.memo(PinnedMessageBox);
