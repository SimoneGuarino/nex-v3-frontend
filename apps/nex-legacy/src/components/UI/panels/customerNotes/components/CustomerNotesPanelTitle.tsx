/**
 * descrizione: Titolo header del pannello note.
 * compito:     mostra customerCode/ragione sociale e badge di validita codice.
 */
import React from "react";

type CustomerNotesPanelTitleProps = {
    title?: React.ReactNode;
    customerCode: string | null;
    ragioneSociale?: string | null;
};

export const CustomerNotesPanelTitle: React.FC<CustomerNotesPanelTitleProps> = ({
    title,
    customerCode,
    ragioneSociale,
}) => {
    /** Fallback automatico quando il parent non fornisce un titolo custom. */
    const resolvedTitle = title ?? `${customerCode || "-"} - ${ragioneSociale || "-"}`;
    /** Il badge cambia stile/stato in base alla validita del codice cliente. */
    const hasCustomerCode = Boolean(customerCode);

    return (
        <div className="flex min-w-0 items-center gap-2">
            <span className="truncate">{resolvedTitle}</span>
            <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${hasCustomerCode
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                    }`}
            >
                {hasCustomerCode ? "Cliente valido" : "Codice non valido"}
            </span>
        </div>
    );
};

export default CustomerNotesPanelTitle;
