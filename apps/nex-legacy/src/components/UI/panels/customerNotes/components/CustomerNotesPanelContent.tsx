// src/components/UI/panels/customerNotes/components/CustomerNotesPanelContent.tsx
/**
 * descrizione: Adapter di contenuto per usare il manager dentro altri panel/shell.
 * compito:     validare il customerCode e mostrare fallback UI se non valido.
 */
import React from "react";
import { CustomerNotesManager } from "../CustomerNotesManager";

type CustomerNotesPanelContentProps = {
    customerCode: string | null;
    queryBody: Record<string, any>;
    userContext: any;
    enabled: boolean;
    onDiscussionOpenChange?: (open: boolean) => void;
    onDiscussionCloseRequestChange?: (closeHandler: (() => void) | null) => void;
    onCustomerLabelChange?: (label: string) => void;
};

export const CustomerNotesPanelContent: React.FC<CustomerNotesPanelContentProps> = ({
    customerCode,
    queryBody,
    userContext,
    enabled,
    onDiscussionOpenChange,
    onDiscussionCloseRequestChange,
    onCustomerLabelChange,
}) => {
    /** Guard rail: il manager lavora solo con codici cliente numerici validi. */
    if (!customerCode) {
        return (
            <div className="p-5">
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-4 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300">
                    Codice cliente non valido.
                </div>
            </div>
        );
    }

    return (
        /** Delega tutta la logica operativa al manager principale. */
        <CustomerNotesManager
            userContext={userContext}
            queryBody={queryBody}
            enabled={enabled}
            className="h-full"
            onDiscussionOpenChange={onDiscussionOpenChange}
            onDiscussionCloseRequestChange={onDiscussionCloseRequestChange}
            onCustomerLabelChange={onCustomerLabelChange}
        />
    );
};

export default CustomerNotesPanelContent;
