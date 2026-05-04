// src/components/UI/panels/customerNotes/components/CustomerNotesPanelFooter.tsx
/**
 * descrizione: Footer minimale del pannello note.
 * compito:     mostra contesto cliente corrente nel footer della side shell.
 */
import React from "react";

type CustomerNotesPanelFooterProps = {
    customerCode: string | null;
    onClose: () => void;
};

export const CustomerNotesPanelFooter: React.FC<CustomerNotesPanelFooterProps> = ({
    customerCode,
    onClose,
}) => (
    /**
     * Nota: il footer espone solo contesto visuale cliente.
     * `onClose` resta in props per mantenere allineamento con altri footer panel.
     */
    <div className="w-full border-t border-neutral-200/60 px-5 py-4 dark:border-neutral-800/80">
        <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Cliente:{" "}
                <span className="font-medium text-neutral-700 dark:text-neutral-200">
                    {customerCode || "-"}
                </span>
            </div>
        </div>
    </div>
);

export default CustomerNotesPanelFooter;
