// src/components/UI/panels/customerNotes/CustomerNotesPanel.tsx
/**
 * descrizione: Shell standalone del pannello note cliente.
 * compito:     gestisce overlay/esc/backdrop e delega la logica operativa a CustomerNotesManager.
 */
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUserContext } from "context/UserContext";
import { SidePanelShell } from "../customersPanel/components/SidePanelShell";
import { CustomerNotesPanelContent } from "./components/CustomerNotesPanelContent";
import { CustomerNotesPanelFooter } from "./components/CustomerNotesPanelFooter";
import { CustomerNotesPanelTitle } from "./components/CustomerNotesPanelTitle";
import type { CustomerNotesPanelProps } from "./types";
import { asDigitString } from "./utils";

/** Utility locale per comporre classi condizionali senza dipendenze aggiuntive. */
const cn = (...values: Array<string | false | null | undefined>) =>
    values.filter(Boolean).join(" ");

/** Normalizza qualunque input testuale (stringa + trim). */
const toTrimmedText = (value: unknown): string => String(value ?? "").trim();

/**
 * Estrae la ragione sociale dal `requestBody` supportando shape legacy/miste.
 * Serve per valorizzare il titolo prima che arrivi la lista note.
 */
const resolveCustomerLabelFromRequestBody = (requestBody?: Record<string, any>): string => {
    if (!requestBody) return "";

    const directCandidates = [
        requestBody.ragioneSociale,
        requestBody.ragsoc,
        requestBody.ragSoc,
        requestBody.RAGIONE_SOCIALE,
        requestBody.customerLabel,
        requestBody.customerName,
    ];

    for (const value of directCandidates) {
        const text = toTrimmedText(value);
        if (text) return text;
    }

    if (Array.isArray(requestBody.ccli)) {
        for (const item of requestBody.ccli) {
            const text = toTrimmedText(item?.ragioneSociale || item?.RAGIONE_SOCIALE);
            if (text) return text;
        }
    }

    return "";
};

/**
 * Pannello note cliente indipendente.
 * - apre un side panel con overlay
 * - mantiene sincronizzato il titolo cliente
 * - chiude prima la discussione interna e poi il pannello principale
 */
export const CustomerNotesPanel: React.FC<CustomerNotesPanelProps> = ({
    cliente,
    openFor,
    onClose,
    requestBody,
    title,
    sizeClassName = "max-w-5xl",
    closeOnBackdrop = true,
    closeOnEsc = true,
    className,
    zIndexClassName = "z-20",
}) => {
    const [userContext] = useUserContext();
    const open = Boolean(openFor);
    const resolvedCustomerCode = asDigitString(cliente);
    const requestCustomerLabel = React.useMemo(
        () => resolveCustomerLabelFromRequestBody(requestBody),
        [requestBody]
    );
    const [customerLabel, setCustomerLabel] = React.useState(requestCustomerLabel);
    const [discussionOpen, setDiscussionOpen] = React.useState(false);
    const discussionCloseHandlerRef = React.useRef<(() => void) | null>(null);

    const queryBody = React.useMemo(
        () => ({
            ...(requestBody || {}),
            ccli: resolvedCustomerCode || "",
        }),
        [requestBody, resolvedCustomerCode]
    );

    React.useEffect(() => {
        setCustomerLabel(requestCustomerLabel);
    }, [requestCustomerLabel, resolvedCustomerCode]);

    React.useEffect(() => {
        if (open) return;
        setDiscussionOpen(false);
        discussionCloseHandlerRef.current = null;
    }, [open]);

    /** Prova a chiudere la discussione interna (se presente) e ritorna esito operazione. */
    const closeDiscussionIfOpen = React.useCallback(() => {
        if (!discussionOpen) return false;
        const closeHandler = discussionCloseHandlerRef.current;
        if (!closeHandler) return false;
        closeHandler();
        return true;
    }, [discussionOpen]);

    /** Allinea lo stato locale con apertura/chiusura discussione dal manager. */
    const handleDiscussionOpenChange = React.useCallback((nextOpenValue: boolean) => {
        setDiscussionOpen(nextOpenValue);
    }, []);

    /** Registra la callback di chiusura fornita dal manager interno. */
    const handleDiscussionCloseRequestChange = React.useCallback(
        (closeHandler: (() => void) | null) => {
            discussionCloseHandlerRef.current = closeHandler;
        },
        []
    );

    /** Aggiorna la ragione sociale nel titolo quando viene rilevata dal manager. */
    const handleCustomerLabelChange = React.useCallback((nextLabel: string) => {
        const text = toTrimmedText(nextLabel);
        if (!text) return;
        setCustomerLabel(text);
    }, []);

    React.useEffect(() => {
        if (!open || !closeOnEsc) return;

        /** Gestione ESC: chiude prima discussione, poi pannello. */
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            if (closeDiscussionIfOpen()) return;
            onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [closeDiscussionIfOpen, closeOnEsc, onClose, open]);

    /** Chiusura su backdrop con la stessa priorita di ESC (discussion -> panel). */
    const handleBackdropClick = React.useCallback(() => {
        if (!closeOnBackdrop) return;
        if (closeDiscussionIfOpen()) return;
        onClose();
    }, [closeDiscussionIfOpen, closeOnBackdrop, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className={cn("fixed inset-0", zIndexClassName, "bg-black/35 dark:bg-black/55")}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.16 } }}
                        exit={{ opacity: 0, transition: { duration: 0.16 } }}
                        onClick={handleBackdropClick}
                    />

                    <div
                        className={cn("fixed inset-0", zIndexClassName, "pointer-events-none flex justify-end")}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className={cn("relative ml-auto h-full w-full pointer-events-none", sizeClassName)}>
                            <div
                                className={cn(
                                    "absolute inset-y-0 right-0 z-20 w-full pointer-events-auto",
                                    className ?? ""
                                )}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <SidePanelShell
                                    title={
                                        <CustomerNotesPanelTitle
                                            title={title}
                                            customerCode={resolvedCustomerCode}
                                            ragioneSociale={customerLabel}
                                        />
                                    }
                                    onClose={onClose}
                                    bodyScrollable={false}
                                    bodyClassName="overflow-hidden px-0 py-0"
                                    footer={
                                        <CustomerNotesPanelFooter
                                            customerCode={resolvedCustomerCode}
                                            onClose={onClose}
                                        />
                                    }
                                >
                                    <CustomerNotesPanelContent
                                        customerCode={resolvedCustomerCode}
                                        queryBody={queryBody}
                                        userContext={userContext}
                                        enabled={open}
                                        onDiscussionOpenChange={handleDiscussionOpenChange}
                                        onDiscussionCloseRequestChange={handleDiscussionCloseRequestChange}
                                        onCustomerLabelChange={handleCustomerLabelChange}
                                    />
                                </SidePanelShell>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CustomerNotesPanel;
