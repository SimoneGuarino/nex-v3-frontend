import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiRefreshCcw, } from "react-icons/fi";
import { Pattern } from "./types/types";
import { FDBackdrop, FDButton } from "@nex/fd-ui";

const FiXIcon = FiX as React.FC<{ className?: string }>;
const FiRefreshCcwIcon = FiRefreshCcw as React.FC<{ className?: string }>;

type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";

export interface WidgetDrawerProps {
    open: boolean;
    //onClose: () => void;
    onClose: (e?: any, reason?: CloseReason) => void;
    palette: { id: string; title: string }[];
    onDragStart: (e: React.DragEvent, widgetId: string) => void;
    onDragEnd: () => void;
    locked?: boolean;
    isDraggingFromDrawer?: boolean;
    patternData: {
        activePatternId: string | null;
        patternList: Pattern[];
        onPatternChange: (id: string) => void;
    };
    resetLayout: () => void;
    onPickForMobile?: (id: string) => void;
}

const PatternButton: React.FC<{
    p: Pattern;
    active: boolean;
    onClick: () => void;
}> = ({ p, active, onClick }) => (
    <button
        onClick={onClick}
        className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${active
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
            : "border-white/10 bg-neutral-900/60 text-neutral-300 hover:bg-neutral-800/60"
            }`}
        title={p.description}
    >
        <span className="opacity-80">{p.icon}</span>
        {p.name}
    </button>
);

const WidgetDrawer: React.FC<WidgetDrawerProps> = ({
    open,
    onClose,
    palette,
    onDragStart,
    onDragEnd,
    locked = false,
    isDraggingFromDrawer,
    patternData,
    resetLayout,
    onPickForMobile
}) => {
    React.useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape")
                //onClose(); 
                onClose?.(undefined, "escapeKeyDown");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const hasFinePointer = React.useMemo(
        () => window.matchMedia?.("(any-pointer: fine)").matches ?? true,
        []
    );

    return (
        <AnimatePresence>
            {open && (
                <>
                    <FDBackdrop
                        //onClick={onClose} 
                        onClick={() => onClose?.(undefined, "backdropClick")}
                        passThrough={isDraggingFromDrawer} />
                    <motion.aside
                        className="fixed right-0 top-0 flex flex-col z-[61] h-full w-[320px] 
                        max-w-[85vw] border-l border-white/10 bg-neutral-900/90 backdrop-blur-md space-y-2"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Widget disponibili"
                        initial={{ x: 340 }}
                        animate={{ x: 0 }}
                        exit={{ x: 340 }}
                        transition={{ type: "spring", stiffness: 280, damping: 28 }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 p-3">
                            <h3 className="text-sm font-semibold text-neutral-200">
                                Impostazioni
                            </h3>
                            <button
                                data-tour="widget-drawer-close"
                                //onClick={onClose}
                                onClick={(e) => onClose?.(e, "itemClick")}
                                className="rounded-md p-2 text-neutral-300 hover:bg-white/5"
                                title="Chiudi"
                                aria-label="Chiudi"
                            >
                                <FiXIcon />
                            </button>
                        </div>

                        { /* Pattern Switcher */}
                        <div className="p-3 flex flex-wrap items-center gap-2" data-tour="dash-widget-view">
                            {patternData.patternList.map((p) => (
                                <PatternButton
                                    key={p.id}
                                    p={p}
                                    active={patternData.activePatternId === p.id}
                                    onClick={() => patternData.onPatternChange(p.id)}
                                />
                            ))}
                        </div>

                        {/* Widget Disponibili */}
                        <div className="p-3 space-y-4" data-tour="dash-widget-available">
                            <h3 className="text-sm font-semibold text-neutral-200">
                                Widget disponibili
                            </h3>
                            {locked && (
                                <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                                    Layout bloccato: sblocca per trascinare nuovi widget.
                                </div>
                            )}

                            {palette.length === 0 ? (
                                <div className="text-xs text-neutral-500">Nessun widget in palette.</div>
                            ) : (
                                <ul className="space-y-2">
                                    {palette.map((w) => {
                                        const canDrag = !locked && hasFinePointer;   // desktop/laptop/ibridi con mouse
                                        const canPick = !locked && !hasFinePointer;  // dispositivi solo-touch

                                        return (
                                            <li key={w.id}>
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    draggable={canDrag}
                                                    onDragStart={canDrag ? (e) => onDragStart(e as any, w.id) : undefined}
                                                    onDragEnd={canDrag ? onDragEnd : undefined}
                                                    onClick={canPick ? () => onPickForMobile?.(w.id) : undefined}
                                                    className={`rounded-lg border px-3 py-2 text-sm
                                                        ${locked
                                                            ? "cursor-not-allowed border-white/10 bg-neutral-900/40 text-neutral-500"
                                                            : canDrag
                                                                ? "cursor-grab border-white/10 bg-neutral-800/70 text-neutral-200 hover:bg-neutral-800"
                                                                : "cursor-pointer border-white/10 bg-neutral-800/70 text-neutral-200 hover:bg-neutral-800"}`}
                                                    title={locked ? "Sblocca per aggiungere" : (canDrag ? "Trascina su uno slot" : "Tocca, poi tocca uno slot")}
                                                    aria-disabled={locked}
                                                >
                                                    {w.title}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                            <p className="mt-4 text-[11px] leading-5 text-neutral-500">
                                {hasFinePointer
                                    ? "Tocca un widget e poi tocca lo slot dove posizionarlo."
                                    : "Suggerimento: trascina un widget dalla barra laterale e rilascialo direttamente su uno slot libero (o occupato per fare swap)."}
                            </p>
                        </div>

                        {/* Reset Delle impostazioni */}
                        <div className="flex flex-col w-full h-full justify-end">
                            <span data-tour="dash-layout-reset" className="flex flex-col justify-end">
                                <FDButton
                                    variant='outline'
                                    color="error"
                                    onClick={resetLayout}
                                    className="m-2 space-x-2 mt-auto"
                                    icon={<FiRefreshCcwIcon className="opacity-80" />}
                                >
                                    Reset Layout
                                </FDButton>
                            </span>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};

export default WidgetDrawer;