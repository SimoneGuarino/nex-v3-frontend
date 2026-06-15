// Context Generali
import React, { useContext } from "react";
import { AIContext, Conversation } from "context/AIContext";

// Animation
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import FDIconButton from "components/UI/buttons/FDIconButton";
import FDButton, { FDColor, FDVariant } from "components/UI/buttons/FDButton";

// Icon imports
import { BiCommentAdd } from "react-icons/bi";
import { IoChatbubblesOutline, IoEllipsisVertical } from "react-icons/io5";
import { BsStars } from "react-icons/bs";


const AddNewConversationIcon = BiCommentAdd as React.FC<{ size?: number }>;
const ChatIcon = IoChatbubblesOutline as React.FC<{ size?: number }>;
const StarIcon = BsStars as React.FC<{ size?: number, className?: string }>;
const Settings = IoEllipsisVertical as React.FC<{ size?: number }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
interface SideBarProps {
    open: boolean;
    menuRef: any;
    setIdSelected: React.Dispatch<React.SetStateAction<{ from: 'pinned' | 'history'; value: string } | null>>;
    LoadConversation: (conversationId: string) => void;
    resetToHero: () => void;
    setShowHero: React.Dispatch<React.SetStateAction<boolean>>;
};

interface TabProps {
    label: string;
    variant?: FDVariant;
    color?: FDColor;
    icon: React.ReactNode;
    classExtra?: string;
    onClick: () => void;
    isActive?: boolean;
};


// ——————————————————————————————————————————————————————————
// SUB COMPONENT
// ——————————————————————————————————————————————————————————
export const Tab: React.FC<TabProps> = ({ label, icon, variant = 'ghost', color = "light", classExtra, onClick, isActive }) => {
    return (
        <FDButton
            icon={icon}
            variant={isActive ? 'solid' : variant}
            size="small"
            color={isActive ? "neutral" : color}
            onClick={onClick}
            className={`w-full !py-2 justify-start ${classExtra} `}
        >
            <span>{label}</span>
        </FDButton>
    );
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
const isMepaConversation = (conversation?: Conversation | null): boolean => {
    if (!conversation?.id) return false;
    return conversation.id.startsWith("thread-") || /^MEPA\s*·/i.test(String(conversation.title ?? ""));
};

const getMepaThreadId = (tenderId: string) => `thread-${tenderId}`;

const SideBar: React.FC<SideBarProps> = ({ open, menuRef, setIdSelected, resetToHero, LoadConversation }) => {
    const { history, conversation, aiScope } = useContext(AIContext);
    const visibleHistory = history.filter((item: Conversation) => {
        const isMepa = isMepaConversation(item);
        if (aiScope.kind === "MEPA_TENDER") {
            return item.id === getMepaThreadId(aiScope.tenderId);
        }
        return !isMepa;
    });

    return (
        <AnimatePresence>
            {open && (<>
                <motion.div
                    key="sidebar"
                    initial={{ x: -250, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -250, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`flex flex-col gap-6 absolute z-20
                        h-full
                        bg-neutral-100 dark:bg-stone-900
                        border-r border-neutral-200 dark:border-stone-800
                        dark:text-white text-black w-[280px]`}
                >
                    {/* Header */}
                    <motion.div
                        className="flex flex-col gap-6 p-4"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <div className="flex gap-2">
                            <StarIcon size={30} className="drop-shadow-glow" />
                            <h1 className="relative text-2xl font-extrabold tracking-wide ">
                                NEX AI
                            </h1>
                        </div>

                        {/* Render delle tab aggiuntive */}
                        <Tab
                            label="Nuova Conversazione"
                            icon={<AddNewConversationIcon size={20} />}
                            onClick={resetToHero}
                        />
                    </motion.div>

                    {/* Render la lista delle conversazioni History */}
                    <div className="mt-4 flex flex-col flex-1 overflow-hidden">
                        <h2 className="text-sm font-light px-4">Chat</h2>
                        <div className="flex-1 overflow-auto p-4">
                            <ul className="space-y-2">
                                {visibleHistory.map((conversation_: Conversation) => {
                                    const isActive = Boolean(conversation && conversation_?.id === conversation?.id);
                                    return (
                                        <li key={conversation_.id} 
                                        className={`flex items-center 
                                            ${isActive 
                                            ? "bg-neutral-200/60 dark:bg-neutral-800" : ""} 
                                            rounded-md
                                        `}>
                                            <Tab
                                                label={
                                                    conversation_?.title
                                                        ? conversation_.title
                                                        : conversation_.messages[0]?.content
                                                            ? conversation_.messages[0]?.content.length < 20
                                                                ? conversation_.messages[0]?.content
                                                                : conversation_.messages[0]?.content.slice(0, 20) + "..."
                                                            : "Nuova Conversazione"
                                                }
                                                icon={<ChatIcon size={20} />}
                                                onClick={() => LoadConversation(conversation_.id)}
                                            />
                                            <FDIconButton
                                                variant="text"
                                                icon={<Settings />}
                                                rounded="sm"
                                                className={`h-fit hover:!bg-gray-200 dark:hover:!bg-neutral-700`}
                                                onClick={(e: any) => {
                                                    setIdSelected((curr: { from: 'pinned' | 'history'; value: string } | null) =>
                                                        curr?.value === conversation_.id ? null : { from: 'history', value: conversation_.id }
                                                    );
                                                    menuRef.current = e.currentTarget;
                                                }}
                                            />
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </>
            )}
        </AnimatePresence>
    );
};

export default SideBar;