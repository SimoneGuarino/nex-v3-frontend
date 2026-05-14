import React from "react";
import FDBox, { type FDBoxProps, clsx } from "components/UI/box/FDBox";
import { motion, type Variants } from "framer-motion";
import { FiX } from "react-icons/fi";

const FiXIcon = FiX as React.FC<{ className?: string }>;

// Variants del guscio
const slideFromRightVariants: Variants = {
    hidden: {
        x: "100%",
        opacity: 0,
    },
    visible: {
        x: 0,
        scale: 1,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 420,
            damping: 34,
            mass: 0.9,
        },
    },
    background: {
        x: 56,
        scale: 0.94,
        opacity: 0.7,
        transition: {
            type: "spring",
            stiffness: 360,
            damping: 32,
            mass: 0.9,
        },
    },
    exit: {
        x: "100%",
        opacity: 0,
        transition: {
            duration: 0.22,
            ease: "easeInOut",
        },
    },
};

// Variants contenuto interno (fade/blur)
const contentVariants: Variants = {
    front: {
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.18, ease: "easeInOut" },
    },
    background: {
        opacity: 0,
        filter: "blur(2px)",
        transition: { duration: 0.18, ease: "easeInOut" },
    },
};

export interface SidePanelShellProps extends Omit<FDBoxProps, "title"> {
    title?: React.ReactNode;
    footer?: React.ReactNode;
    onClose?: () => void;
    /** data-tour opzionale per il bottone di chiusura (X). */
    closeButtonDataTour?: string;
    /** Se true disabilita la X del pannello. */
    closeDisabled?: boolean;
    /** Slot opzionale per azioni/info a destra nell'header (prima del pulsante close). */
    headerRight?: React.ReactNode;
    /** "visible" → pannello in primo piano, "background" → pannello rimpicciolito */
    animateVariant?: "visible" | "background";
    /** Stato del contenuto interno per il fade */
    contentState?: "front" | "background";
    children: React.ReactNode;
}

export const SidePanelShell: React.FC<SidePanelShellProps> = ({
    title,
    onClose,
    closeButtonDataTour,
    closeDisabled = false,
    headerRight,
    animateVariant = "visible",
    contentState = "front",
    footer,
    className,
    children,
    ...rest
}) => {
    return (
        <FDBox
            asMotion
            initial="hidden"
            animate={animateVariant}
            exit="exit"
            variants={slideFromRightVariants}
            radius="2xl"
            shadow="2xl"
            pad="none"
            color="light"
            variant="gradient"
            border
            style={{
                transformOrigin: "right center",
                ...(rest.style || {}),
            }}
            className={clsx(
                "pointer-events-auto",
                "h-full w-full",
                "flex flex-col",
                "will-change-transform",
                className,
            )}
            {...rest}
        >
            {/* HEADER */}
            <header className="flex items-center justify-between px-5 py-4 border-b border-white/10 dark:border-neutral-800/80">
                <div className="min-w-0">
                    {title && (
                        <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 truncate">
                            {title}
                        </h2>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {headerRight}
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={closeDisabled}
                            data-tour={closeButtonDataTour}
                            className={[
                                "inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/5 bg-white/70 text-neutral-600 shadow-sm transition dark:border-white/10 dark:bg-neutral-900/70 dark:text-neutral-300",
                                closeDisabled
                                    ? "cursor-not-allowed opacity-50"
                                    : "hover:bg-white hover:text-neutral-900 dark:hover:bg-neutral-900",
                            ].join(" ")}
                            aria-label="Chiudi pannello"
                        >
                            <FiXIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </header>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
                <motion.div
                    initial={false}
                    animate={contentState}
                    variants={contentVariants}
                    className="h-full"
                >
                    {children}
                </motion.div>
            </div>

            {/* FOOTER */}
            {footer && footer}
        </FDBox>
    );
};
