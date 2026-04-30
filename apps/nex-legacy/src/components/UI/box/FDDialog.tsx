// src/components/UI/box/FDDialog.tsx
/**
 * descrizione: Dialog riutilizzabile con titolo, contenuto personalizzato e azioni.
 * props:       open, onClose, title, confirmText, cancelText, onConfirm, loading, color, children, size, hideCancel, hideActions.
 * dipendenze:  Framer Motion, FDButton, createPortal.
 */
import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { createPortal } from "react-dom";
import FDButton, { type FDColor } from "components/UI/buttons/FDButton";

export type FDDialogSize = "xs" | "sm" | "md" | "lg" | "xl" | "full";

export interface FDDialogProps {
    /** Controlla l'apertura del dialog */
    open: boolean;
    /** Callback alla chiusura (click backdrop o annulla) */
    onClose: () => void;
    /** Titolo del dialog */
    title?: React.ReactNode;
    /** Testo del pulsante di conferma */
    confirmText?: string;
    /** Testo del pulsante annulla */
    cancelText?: string;
    /** Callback alla conferma */
    onConfirm?: () => void;
    /** Mostra loader sul pulsante conferma */
    loading?: boolean;
    /** Colore del pulsante conferma */
    color?: FDColor;
    /** Contenuto del dialog */
    children?: React.ReactNode;
    /** Dimensione del dialog */
    size?: FDDialogSize;
    /** Nascondi il pulsante annulla */
    hideCancel?: boolean;
    /** Nascondi completamente la barra azioni */
    hideActions?: boolean;
    /** Disabilita chiusura su backdrop click */
    disableBackdropClose?: boolean;
    /** Icona o elemento a sinistra del titolo */
    titleIcon?: React.ReactNode;
    /** Footer custom (sostituisce azioni default) */
    customActions?: React.ReactNode;
    /** Classe CSS aggiuntiva per il paper */
    className?: string;
}

const sizeMap: Record<FDDialogSize, string> = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full mx-4",
};

const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const dialogVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, damping: 25, stiffness: 400 } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15 } },
};

export default function FDDialog({
    open, //stato per cui è aperto
    onClose, //stato da aggiornare quando si chiude
    title, //Testo da far comparire in alto nell'header
    confirmText = "Conferma", //testo del pulsante di conferma
    cancelText = "Annulla", //testo del pulsante di chiusura
    onConfirm, //funzione call back da eseguire alla conferma
    loading = false, //stato di loading
    color = "primary", //colore del pulsante di conferma
    children, //body del componente (va bene anche se inserito tra tag di apertura e chiusura <FDDialog></FDDialog>)
    size = "sm", //dimensione del dialog
    hideCancel = false, //nascondi pulsante di chiusura
    hideActions = false, //nascondi la barra delle azioni
    disableBackdropClose = false, //se true evita chiusura con out click o altre interazioni
    titleIcon, //icona nell'header
    customActions, //sostituisce il footer con azioni personalizzate (vuole un react node {})
    className = "", //ulteriori classi css
}: FDDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Chiudi con ESC
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    // Blocca scroll del body quando aperto
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (disableBackdropClose) return;
        if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const content = (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={handleBackdropClick}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        variants={backdropVariants}
                    />

                    {/* Dialog Panel */}
                    <motion.div
                        ref={dialogRef}
                        className={`
                            relative w-full ${sizeMap[size]}
                            bg-white dark:bg-neutral-900
                            border border-neutral-200 dark:border-neutral-700
                            rounded-2xl shadow-xl
                            flex flex-col max-h-[90vh]
                            ${className}
                        `}
                        variants={dialogVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {title && (
                            <div className="flex items-center gap-2 px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
                                {titleIcon}
                                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    {title}
                                </h2>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 text-neutral-700 dark:text-neutral-300">
                            {children}
                        </div>

                        {/* Actions */}
                        {!hideActions && (
                            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-200 dark:border-neutral-700">
                                {customActions ?? (
                                    <>
                                        {!hideCancel && (
                                            <FDButton variant="outline" color="neutral" onClick={onClose}>
                                                {cancelText}
                                            </FDButton>
                                        )}
                                        {onConfirm && (
                                            <FDButton variant="solid" color={color} onClick={onConfirm} loading={loading}>
                                                {confirmText}
                                            </FDButton>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Usa portal per renderizzare fuori dal DOM corrente
    if (typeof document !== "undefined") {
        return createPortal(content, document.body);
    }
    return null;
}
