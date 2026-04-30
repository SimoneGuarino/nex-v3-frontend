import { Tag } from "components/Tag/Tag";
import FDIconButton from "components/UI/buttons/FDIconButton";
import React, { useContext } from "react";
import { IoExpandOutline, IoContractOutline, IoCloseSharp, IoCloudyOutline } from "react-icons/io5";
import { AiOutlineLock } from "react-icons/ai";
import { LuPanelLeft, LuSettings } from "react-icons/lu";
import { AIContext } from "context/AIContext";
import { FiChevronDown } from "react-icons/fi";
import FDButton from "components/UI/buttons/FDButton";

const CloseIcon = IoCloseSharp as React.FC<{ size?: number }>;
const LockIcon = AiOutlineLock as React.FC<{ size?: number }>;
const CloudIcon = IoCloudyOutline as React.FC<{ size?: number }>;
const PanelIcon = LuPanelLeft as React.FC<{ size?: number }>;
const FiChevronDownIcon = FiChevronDown as React.FC<{ size?: number }>;
const SettingIcon = LuSettings as React.FC<{ size?: number }> 


interface AIHeaderProps {
    conversation_id?: string;
    mode: "fullscreen" | "windowed"; toggleMode: () => void;
    showHero: boolean;
    isHistoryTabOpen: boolean;
    handleHistoryTab?: () => void;

    // Settings props
    isSettingsOpen: boolean;
    handleSettingsToggle: () => void;
    isSettingsSidebarOpen: boolean;
    handleSettingsSidebarToggle: () => void;

    menuRef: any;
    selectedModel: string;
    setOpenModelSelect: (open: boolean) => void;
};


const ToggleButton: React.FC<{
    mode: "fullscreen" | "windowed";
    onToggle: () => void;
}> = ({ mode, onToggle }) => {
    const Icon = (mode === "fullscreen"
        ? IoContractOutline
        : IoExpandOutline) as React.FC<{ size?: number }>;

    return (
        <FDIconButton
            onClick={onToggle}
            variant="text"
            className="z-10 h-fit"
            dataTooltipId='general-ai-tooltip'
            dataTooltipContent={`${mode === "fullscreen" ? "Riduci a finestra" : "Espandi a schermo intero"}`}
            icon={<Icon size={20} />}
        />
    );
};

const AIHeader: React.FC<AIHeaderProps> = ({ mode, conversation_id, showHero, isHistoryTabOpen, handleHistoryTab, toggleMode,
    isSettingsOpen,
    handleSettingsToggle,
    isSettingsSidebarOpen,
    handleSettingsSidebarToggle,
    menuRef,
    selectedModel,
    setOpenModelSelect,
}) => {
    const { setOpen } = useContext(AIContext);
    const [model, version] = selectedModel.split('-');



    // Determina quale sidebar toggle usare (history o settings)
    const currentSidebarToggle = isSettingsOpen ? handleSettingsSidebarToggle : handleHistoryTab;
    const sidebarTooltipText = isSettingsOpen
        ? `${isSettingsSidebarOpen ? 'Chiudi' : 'Apri'} menu impostazioni`
        : `${isHistoryTabOpen ? 'Chiudi' : 'Apri'} Tab delle conversazioni`;

    // Determina il comportamento del pulsante chiudi
    // Se settings aperto, chiude solo settings; altrimenti chiude tutto
    const handleCloseClick = () => {
        if (isSettingsOpen) {
            handleSettingsToggle(); // Chiude i settings e torna alla chat
        } else {
            setOpen(false); // Chiude tutto il pannello AI
        }
    };

    const closeTooltipText = isSettingsOpen ? 'Torna alla chat' : 'Chiudi';

    return (
        <div className={`w-auto pr-3 pb-2 pt-4 pl-6 flex dark:text-white text-black text-sm ${(!showHero || isSettingsOpen) ? 'ml-12' : 'ml-0'} transition-margin duration-300 relative z-40`}>
            <div className="flex items-center gap-2">
                <div ref={menuRef} className="hover:scale-105 transition-transform cursor-pointer mr-2"
                    onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                        if (!isSettingsOpen) {
                            setOpenModelSelect(true);
                            menuRef.current = e.currentTarget;
                        }
                    }}>
                    <FDButton variant="ghost" size="small" className="!text-xs hover:!bg-gray-100 dark:hover:!bg-neutral-700 !px-1"
                    rightIcon={!isSettingsOpen ? <FiChevronDownIcon size={12} /> : undefined} >
                        {isSettingsOpen ? '' : <>{model.replace(/_/g, " ")}<span className="ml-2 opacity-50 !text-sm">{version}</span></>}
                    </FDButton>
                </div>

                {!isSettingsOpen && (
                    <>
                        <Tag text="Private" icon={<LockIcon size={12} />} data_tooltip_id='general-ai-tooltip' data_tooltip_content="Chat privata" />
                        {conversation_id && <Tag text={conversation_id.slice(0, 6) + "..."} icon={<CloudIcon size={12} />}
                            data_tooltip_id='general-ai-tooltip' data_tooltip_content={`ID della sessione: ${conversation_id}`} />}
                    </>
                )}
            </div>
            <FDIconButton
                icon={<SettingIcon size={20} />}
                className={`h-fit ml-auto z-10 transition-colors duration-200 ${isSettingsOpen ? 'text-blue-500 dark:text-blue-400' : ''}`}
                variant="text"
                dataTooltipId='general-ai-tooltip'
                dataTooltipContent={isSettingsOpen ? "Chiudi impostazioni" : "Apri impostazioni"}
                onClick={handleSettingsToggle}
            />
            <ToggleButton onToggle={toggleMode} mode={mode} />
            <FDIconButton
                onClick={currentSidebarToggle}
                variant="text"
                className="h-fit z-10"
                dataTooltipId='general-ai-tooltip'
                dataTooltipContent={sidebarTooltipText}
                icon={<PanelIcon size={20} />}
            />
            <FDIconButton
                variant="text"
                className="h-fit z-10"
                dataTooltipId='general-ai-tooltip'
                dataTooltipContent={closeTooltipText}
                icon={<CloseIcon size={20} />}
                onClick={handleCloseClick}
            />
        </div>
    )
};

export default AIHeader;