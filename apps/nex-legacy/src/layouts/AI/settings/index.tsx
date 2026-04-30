// Context Generali
import React, { useState } from "react";

// Animation
import { motion, AnimatePresence } from "framer-motion";

// Icon imports
import { IoInformationCircleOutline } from "react-icons/io5";
import { TbPrompt } from "react-icons/tb";
import { LuSettings } from "react-icons/lu";

// Panels
import { PromptsSettings, AboutSettings } from "./panels";
import { Tab } from "../sideBar";

const SettingsIcon = LuSettings as React.FC<{ size?: number, className?: string }>;
const PromptIcon = TbPrompt as React.FC<{ size?: number }>;
const InfoIcon = IoInformationCircleOutline as React.FC<{ size?: number }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
// Tipi per le categorie di impostazioni
export type SettingsCategory =
    | "prompts"
    | 'about';

type SettingsCategoryItem = {
    id: SettingsCategory;
    label: string;
    icon: React.ReactNode;
};

interface SettingsSidebarProps {
    open: boolean;
    activeCategory: SettingsCategory;
    onCategoryChange: (category: SettingsCategory) => void;
};

interface SettingsContentProps {
    activeCategory: SettingsCategory;
};

interface SettingsProps {
    isOpen: boolean;
    showSidebar: boolean;
};


// ——————————————————————————————————————————————————————————
// CONSTANTI
// ——————————————————————————————————————————————————————————
const SETTINGS_CATEGORIES: SettingsCategoryItem[] = [
    { id: "prompts", label: "Prompts", icon: <PromptIcon size={20} /> },
    { id: 'about', label: 'Informazioni', icon: <InfoIcon size={20} /> },
];

// Mappa dei contenuti per categoria
const SETTINGS_CONTENT: Record<SettingsCategory, React.FC> = {
    prompts: PromptsSettings,
    about: AboutSettings,
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/** SIDEBAR DELLE IMPOSTAZIONI*/
export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ open, activeCategory, onCategoryChange }) => {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="settings-sidebar"
                    initial={{ x: -250, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -250, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`flex flex-col gap-4 absolute z-20
                        h-full
                        bg-neutral-100 dark:bg-stone-900
                        border-r border-neutral-200 dark:border-stone-800
                        dark:text-white text-black w-[280px]`}
                >
                    {/* Header */}
                    <motion.div
                        className="flex flex-col gap-4 p-4"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <div className="flex gap-2 items-center">
                            <SettingsIcon size={28} />
                            <h1 className="relative text-xl font-bold tracking-wide">
                                Impostazioni
                            </h1>
                        </div>
                    </motion.div>

                    {/* Lista categorie */}
                    <div className="flex-1 overflow-auto px-4">
                        <ul className="space-y-1">
                            {SETTINGS_CATEGORIES.map((category) => (
                                <li key={category.id}>
                                    <Tab
                                        label={category.label}
                                        icon={category.icon}
                                        isActive={activeCategory === category.id}
                                        onClick={() => onCategoryChange(category.id)}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/** CONTENUTO PRINCIPALE DELLE IMPOSTAZIONI */
export const SettingsContent: React.FC<SettingsContentProps> = ({ activeCategory }) => {
    const ContentComponent = SETTINGS_CONTENT[activeCategory];

    return (
        <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-1 overflow-auto p-6 min-w-0 max-w-full"
        >
            <ContentComponent />
        </motion.div>
    );
};

/** PANNELLO IMPOSTAZIONI COMPLETO */
const Settings: React.FC<SettingsProps> = ({ isOpen, showSidebar }) => {
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>('prompts');

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="settings-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="absolute inset-0 z-30 flex bg-white dark:bg-zinc-800"
                >
                    <SettingsSidebar
                        open={showSidebar}
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                    />

                    <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${showSidebar ? 'ml-[280px]' : 'ml-0'} transition-margin duration-300`}>
                        <SettingsContent activeCategory={activeCategory} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// ——————————————————————————————————————————————————————————
// EXPORTS
// ——————————————————————————————————————————————————————————
export default Settings;
export { SETTINGS_CATEGORIES };
export type { SettingsCategoryItem };