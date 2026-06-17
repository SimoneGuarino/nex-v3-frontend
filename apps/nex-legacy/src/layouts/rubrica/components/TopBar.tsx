import React from "react";
import { FDBox, FDButton, FDIconButton } from "@nex/fd-ui";

import { RiResetRightFill } from "react-icons/ri";
import { MdSearch } from "react-icons/md";

const SearchIcon = MdSearch as React.FC<{ size?: number; className?: string }>;
const ResetIcon = RiResetRightFill as React.FC<{ size?: number; className?: string }>;

/**
 * Le 4 tab supportate dal pannello Rubrica.
 * Nota: questo union type è la “source of truth” anche per index/TablePanel.
 */
export type RubricaTabKey = "rubrica" | "paymentMethods" | "garanzia" | "microsettori";

interface TopBarProps {
    /**
     * Tab attiva (controlled).
     */
    activeTab: RubricaTabKey;

    /**
     * Callback di cambio tab.
     * In big-tech: onTabChange deve essere “command-like” e fare reset coerente.
     */
    onTabChange: (tab: RubricaTabKey) => void;

    /**
     * Click reset totale pannello (optional per riuso/feature flag).
     */
    onResetClick?: () => void;

    /**
     * SearchOpen è controlled dall’esterno (index),
     * così TopBar resta “dumb/presentational”.
     */
    searchOpen: boolean;
    setSearchOpen: (open: boolean) => void;
};

/**
 * Stile tab: separiamo in una pure function per leggibilità e coerenza.
 */
function getTabStyle(isActive: boolean) {
    return {
        variant: isActive ? "solid" : "outline",
        color: isActive ? "primary" : "neutral",
    } as const;
};

export function TopBar({ activeTab, onTabChange, onResetClick, searchOpen, setSearchOpen }: TopBarProps) {
    /**
     * Durante alcuni step del tour blocchiamo interazioni sulle tab.
     * (Invariante UX: l’utente deve seguire il percorso guidato)
     */
    // const { isOpen, index: tourIndex } = useTour();
    // const lockInteractions = isOpen && tourIndex === 4;

    return (
        <FDBox fullWidth radius="lg" pad="md" className="mb-4">
            <div className="w-full flex items-center justify-between">
                <div className="flex gap-2 items-center">
                    {/* {lockInteractions && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 10,
                                pointerEvents: "auto",
                            }}
                            onClickCapture={(e) => e.stopPropagation()}
                        />
                    )} */}

                    <FDButton {...getTabStyle(activeTab === "rubrica")} size="small" radius="md" data-tour="rubrica-tabella" onClick={() => onTabChange("rubrica")}>
                        Rubrica
                    </FDButton>

                    <FDButton
                        {...getTabStyle(activeTab === "paymentMethods")}
                        data-tour="rubrica-metodi-pagamento"
                        size="small"
                        radius="md"
                        onClick={() => onTabChange("paymentMethods")}
                    >
                        Metodi di Pagamento
                    </FDButton>

                    <FDButton {...getTabStyle(activeTab === "garanzia")} size="small" radius="md" data-tour="rubrica-condizioni-garanzia" onClick={() => onTabChange("garanzia")}>
                        Condizioni di Garanzia
                    </FDButton>

                    <FDButton
                        {...getTabStyle(activeTab === "microsettori")}
                        size="small"
                        data-tour="rubrica-microsettori"
                        radius="md"
                        onClick={() => onTabChange("microsettori")}
                    >
                        Microsettori
                    </FDButton>
                </div>

                <div className="flex gap-2 items-center justify-end">
                    <FDButton
                        dataTour="rubrica-topbar-reset"
                        variant="outline"
                        color="neutral"
                        size="small"
                        radius="md"
                        onClick={onResetClick}
                    >
                        Reset
                        <ResetIcon className="ml-1.5" />
                    </FDButton>

                    <FDIconButton
                        dataTour="rubrica-topbar-search"
                        variant="text"
                        rounded="md"
                        dataTooltipContent="Ricerca Mirata"
                        dataTooltipId="general-rubrica-tooltip"
                        size="small"
                        className="border border-neutral-200 dark:border-neutral-800"
                        onClick={() => setSearchOpen(true)} // command semplice: “open”
                        icon={<SearchIcon size={18} />}
                    />
                </div>
            </div>
        </FDBox>
    );
}

export default TopBar;