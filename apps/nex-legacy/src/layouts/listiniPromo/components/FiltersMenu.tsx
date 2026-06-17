import React from "react";
import { FDIconButton } from "@nex/fd-ui";
import { IoCloseSharp } from "react-icons/io5";
import { FDButton, ContextMenu, FDSelect, FDSelectOption } from "@nex/fd-ui";
import { useTour } from "tour/TourProvider";

const CloseIcon = IoCloseSharp as React.FC<{ size?: number; className?: string }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
/**
 * Filtro prodotto selezionato dalla ricerca mirata (AdvancedSearch).
 * Se presente, viene mostrato nel menu e può essere rimosso con la "x".
 */
type SelectedProductFilter = {
    code: string; //codice prodotto
    label: string; //label leggibile (codice + descrizione)
    codiceListino?: string; //eventuale listino associato (se disponibile)
} | null;

/**
 * Props del pannello filtri (ContextMenu) usato nella pagina ListiniPromo.
 */
type Props = {
    open: boolean; //true se il menu è aperto
    anchorRef: React.MutableRefObject<HTMLDivElement | null>; //ref elemento ancora per posizionare il menu
    onClose: () => void; //callback chiusura menu

    listinoOptions: FDSelectOption<string>[]; //opzioni listini disponibili per la promo corrente
    selectedListino?: string[]; //listini selezionati (multi-select)
    onListinoChange: (value?: string[] | null) => void; //callback cambio selezione listini

    selectedProductFilter: SelectedProductFilter; //prodotto selezionato da ricerca mirata (se presente)
    onClearProductFilter: () => void; //callback rimozione filtro prodotto

    /** reset di tutti i filtri del pannello + refetch */
    onResetFilters: () => void; //callback reset completo filtri
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Menu contestuale dei filtri per ListiniPromo:
 * - mostra (se presente) il prodotto selezionato da ricerca mirata e permette di rimuoverlo
 * - filtro multi-select dei listini disponibili
 * - pulsante reset (reset filtri + chiusura menu)
 * @returns
 */
const FiltersMenu: React.FC<Props> = ({
    open,
    anchorRef,
    onClose,
    listinoOptions,
    selectedListino,
    onListinoChange,
    selectedProductFilter,
    onClearProductFilter,
    onResetFilters,
}) => {

    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && (tourIndex === 10);
    //funzione per ignorare la chiusura dei menu contestuali durante il tour    
    type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";
    const shouldIgnoreClose = (reason?: CloseReason) => {
        if (!isOpen) return false;
        // se chiudo da codice (no reason) → NON bloccare
        if (!reason) return false;
        // durante il tour: ignora solo click fuori ed ESC
        return (
            reason === "backdropClick" ||
            reason === "clickAway" ||
            reason === "escapeKeyDown" ||
            reason === "itemClick"
        );
    };

    return (
        <ContextMenu
            openFor={open}
            pos={anchorRef}
            // onClose={onClose}
            onClose={(_e?: any, reason?: CloseReason) => {
                if (shouldIgnoreClose(reason)) return;
                onClose();
            }}
            placement="left-start"
            panel={
                <div className="w-[360px] max-w-full space-y-4" data-tour="listiniPromo-filters-panel">
                    {lockInteractions && (
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
                    )}
                    {/* Header */}
                    <div className="text-sm font-medium">Filtri</div>

                    {/* Prodotto selezionato da ricerca mirata */}
                    {selectedProductFilter && (
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="opacity-80">Prodotto selezionato</span>

                            <div className="flex items-center space-x-2 max-w-[180px]">
                                <span
                                    className="truncate"
                                    title={selectedProductFilter.label}
                                >
                                    {selectedProductFilter.label}
                                </span>

                                <FDIconButton
                                    icon={<CloseIcon size={14} />}
                                    onClick={onClearProductFilter}
                                    size="small"
                                    variant="danger"
                                />
                            </div>
                        </div>
                    )}

                    {/* filtro listino */}
                    <div className="flex flex-col w-full">
                        <span className="text-xs ml-2 mb-1">Listini</span>

                        <FDSelect
                            options={listinoOptions}
                            value={selectedListino}
                            onChange={(v) => {
                                // con multiple, v sarà tipicamente string[] | null | undefined
                                if (Array.isArray(v)) {
                                    onListinoChange(v);
                                } else {
                                    onListinoChange(null);
                                }
                            }}
                            fullWidth
                            radius="md"
                            color="dark"
                            clearable
                            multiple
                            size="sm"
                            placeholder={
                                listinoOptions.length
                                    ? "Filtra per uno o più listini disponibili"
                                    : "Nessun listino disponibile"
                            }
                        />

                        <div className="flex w-full justify-end items-center mt-3">
                            <FDButton
                                variant="outline"
                                color="dark"
                                size="small"
                                onClick={() => {
                                    onResetFilters(); //reset filtri + refetch (gestito dal parent)
                                    onClose(); //chiude il menu dopo il reset
                                }}
                            >
                                Reset
                            </FDButton>
                        </div>
                    </div>
                </div>
            }
        />
    );
};

export default FiltersMenu;
