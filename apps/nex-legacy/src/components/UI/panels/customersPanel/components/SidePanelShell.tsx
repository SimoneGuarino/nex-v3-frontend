import React from "react";
import FDBox, { type FDBoxProps, clsx } from "components/UI/box/FDBox";
import { motion, type Variants } from "framer-motion";
import { FiX } from "react-icons/fi";
import FDIconButton from "components/UI/buttons/FDIconButton";

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
    headerActions?: React.ReactNode;
    footer?: React.ReactNode;
    onClose?: () => void;
    animateVariant?: "visible" | "background";
    contentState?: "front" | "background";
    bodyScrollable?: boolean;
    bodyClassName?: string;
    children: React.ReactNode;
}

/**
 * Shell riusabile dei pannelli laterali (primario e secondario).
 * Centralizza animazioni, header, body scrollabile e footer opzionale.
 */
export const SidePanelShell: React.FC<SidePanelShellProps> = ({
    title,
    headerActions,
    onClose,
    animateVariant = "visible",
    contentState = "front",
    footer,
    bodyScrollable = true,
    bodyClassName,
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
            <header className="flex items-center justify-between px-5 py-4 border-b border-white/10 dark:border-neutral-800/80">
                <div className="min-w-0">
                    {title && (
                        <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 truncate">
                            {title}
                        </h2>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {headerActions}
                    {onClose && (
                        <FDIconButton
                            icon={FiX({})}
                            onClick={onClose}
                            disabled={!onClose}
                        />
                    )}
                </div>
            </header>

            <div className={clsx("flex-1 px-5 py-4", bodyScrollable ? "overflow-y-auto" : "overflow-hidden", bodyClassName)}>
                <motion.div
                    initial={false}
                    animate={contentState}
                    variants={contentVariants}
                    className="h-full"
                >
                    {children}
                </motion.div>
            </div>

            {footer && footer}
        </FDBox>
    );
};
