import React from "react";
import FDButton from "components/UI/buttons/FDButton";
import { GrDocumentPdf } from "react-icons/gr";
import { IoMapSharp } from "react-icons/io5";
import { BiNote } from "react-icons/bi";
import AddressesDialog from "layouts/clienti/components/AddressesDialog";
import type { AnyRecord } from "../types";
import { TourCtx } from "tour/TourProvider";
import { CUSTOMER_PANEL_TOUR_SELECTORS } from "../tour-system-utils/tours";

// Footer del pannello principale.
// Contiene azioni trasversali sempre disponibili per il cliente corrente.
type CustomersPanelPrimaryFooterProps = {
    updatedAt?: any;
    // warningsCount: number; @deprecated
    onDocumentiClick: () => void;
    onOpenAddresses: () => void;
    onOpenNotes: () => void;
    addressesOpen: boolean;
    onCloseAddresses: () => void;
    customerCode: string | number;
    userContext: AnyRecord;
    customerLabel?: string;
    lockBodyInteractions?: boolean;
};

export const CustomersPanelPrimaryFooter: React.FC<CustomersPanelPrimaryFooterProps> = ({
    updatedAt,
    // warningsCount, @deprecated
    onDocumentiClick,
    onOpenNotes,
    onOpenAddresses,
    addressesOpen,
    onCloseAddresses,
    lockBodyInteractions = false,
    customerCode,
    userContext,
    customerLabel,
}) => {
    const tourCtx = React.useContext(TourCtx);
    const isTourOpen = Boolean(tourCtx?.isOpen);
    const activeStepSelector = tourCtx?.activeStepSelector;

    /**
     * Safety-net tour:
     * oltre al lock derivato dalla config, forziamo il blocco dei 3 bottoni
     * nello step di introduzione scheda cliente.
     *
     * Questo copre sia CAD che Buyer in modo esplicito.
     */
    const isCustomerPanelIntroStep =
        isTourOpen && activeStepSelector === CUSTOMER_PANEL_TOUR_SELECTORS.panel;

    const shouldBlockFooterActions = lockBodyInteractions || isCustomerPanelIntroStep;

    return (
        <>
        <div className="border-t border-neutral-200/60 dark:border-neutral-800/80 px-5 py-4 w-full flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {updatedAt ? (
                        <>
                            Aggiornato:{" "}
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                {new Date(updatedAt).toLocaleString("it-IT")}
                            </span>
                        </>
                    ) : (
                        <span className="opacity-70">-</span>
                    )}
                </div>

                {/* {warningsCount > 0 ? (
                    <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                        {warningsCount} avviso/i
                    </span>
                ) : (
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500"> </span>
                )} */}
            </div>

            <div
                className={`w-full flex items-center gap-2 ${shouldBlockFooterActions ? "pointer-events-none opacity-60" : ""}`}
                aria-disabled={shouldBlockFooterActions}
            >
                <FDButton
                    size="small"
                    radius="md"
                    variant="soft"
                    color="neutral"
                    rightIcon={GrDocumentPdf({})}
                    onClick={onDocumentiClick}
                    disabled={shouldBlockFooterActions}
                >
                    Documenti
                </FDButton>

                <FDButton
                    size="small"
                    radius="md"
                    variant="soft"
                    color="neutral"
                    rightIcon={IoMapSharp({})}
                    onClick={onOpenAddresses}
                    disabled={shouldBlockFooterActions}
                >
                    Indirizzi
                </FDButton>

                <FDButton
                    size="small"
                    radius="md"
                    variant="soft"
                    color="neutral"
                    rightIcon={BiNote({})}
                    onClick={onOpenNotes}
                    disabled={shouldBlockFooterActions}
                >
                    Note
                </FDButton>
            </div>
        </div>

        {/* Dialog esterno al pannello ma controllato dal footer. */}
        <AddressesDialog
            open={addressesOpen}
            onClose={onCloseAddresses}
            customerCode={String(customerCode)}
            userContext={userContext ?? {}}
            customerLabel={customerLabel ?? ""}
        />
    </>
    );
};

