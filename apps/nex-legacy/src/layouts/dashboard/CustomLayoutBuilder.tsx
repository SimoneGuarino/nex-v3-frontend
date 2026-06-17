// CustomLayoutBuilder.tsx
import React from "react";
import { FiTrash2, FiPlus, FiEdit3 } from "react-icons/fi";
import type { SlotDef, SlotId, SlotGeom } from "./types/types";
import { snapGeom, updateSlotGeom } from "./utils/utils";
import { FDButton } from "@nex/fd-ui";
import { useIsLgUp } from ".";

const FiPlusIcon = FiPlus as React.FC<{ className?: string }>;
const FiTrash2Icon = FiTrash2 as React.FC<{ className?: string }>;
const FiEdit3Icon = FiEdit3 as React.FC<{ className?: string }>;

const HANDLE_SIZE = 12;

type Geom = { colStart: number; colSpan: number; rowStart: number; rowSpan: number };
function roundGeom(g: Geom): Geom {
    return {
        colStart: Math.round(g.colStart),
        colSpan: Math.max(1, Math.round(g.colSpan)),
        rowStart: Math.round(g.rowStart),
        rowSpan: Math.max(1, Math.round(g.rowSpan)),
    };
};

/**
 * Mantiene gli span >= min e fa rientrare la geometria nei limiti,
 * spostando lo start se necessario.
 */
function keepMinAndFit(
    g: Geom,
    cols: number,
    mins: { minCols: number; minRows: number },
    allowShiftStart: boolean
): Geom {
    let { colStart, colSpan, rowStart, rowSpan } = roundGeom(g);

    // applica minimi
    colSpan = Math.max(colSpan, mins.minCols);
    rowSpan = Math.max(rowSpan, mins.minRows);

    // clamp start minimo
    colStart = Math.max(1, colStart);
    rowStart = Math.max(1, rowStart);

    // fit orizzontale entro [1..cols]
    if (cols > 0) {
        const right = colStart + colSpan - 1;
        if (right > cols) {
            if (allowShiftStart) {
                // sposta a sinistra mantenendo lo span
                colStart = Math.max(1, cols - colSpan + 1);
            } else {
                // prova a ridurre span ma non sotto i minimi
                colSpan = Math.max(mins.minCols, cols - colStart + 1);
                // se ancora non basta, ultima chance: sposta start
                if (colStart + colSpan - 1 > cols) {
                    colStart = Math.max(1, cols - colSpan + 1);
                }
            }
        }
    }

    // (verticale) – non abbiamo un limite massimo di righe nel canvas,
    // quindi garantiamo solo i minimi e start >= 1.
    // Se in futuro imponi un maxRows, applica logica simile a quella orizzontale.

    return { colStart, colSpan, rowStart, rowSpan };
}


export interface CustomLayoutBuilderProps {
    cols: number;
    slots: SlotDef[];
    onChangeSlots: (slots: SlotDef[]) => void;
    onAddSlot: (geom?: SlotGeom) => void;
    onRemoveSlot: (slotId: SlotId) => void;
    locked?: boolean;
    getSlotMin?: (slotId: SlotId) => { minCols: number; minRows: number } | null; //minimi per slot corrente (derivati dal widget assegnato)
    setEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

const CustomLayoutBuilder: React.FC<CustomLayoutBuilderProps> = ({
    cols,
    slots,
    onChangeSlots,
    onAddSlot,
    onRemoveSlot,
    locked = false,
    getSlotMin,
    setEditing,
}) => {
    const isLgUp = useIsLgUp();

    const [selected, setSelected] = React.useState<SlotId | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // movimento base: trascina l’intero slot
    const onMouseDownMove = (e: React.MouseEvent, s: SlotDef) => {
        if (locked) return;
        if (!containerRef.current || !s.geom) return;
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const start = { ...s.geom };
        const mins = getSlotMin?.(s.id) ?? { minCols: 3, minRows: 3 };

        const onMove = (ev: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const cellW = rect.width / cols;
            const deltaCols = (ev.clientX - startX) / cellW;
            const deltaRows = (ev.clientY - startY) / 40; // row height virtuale

            // prima: snap a griglia
            const snapped = snapGeom(
                {
                    colStart: start.colStart + deltaCols,
                    rowStart: start.rowStart + deltaRows,
                    colSpan: start.colSpan,
                    rowSpan: start.rowSpan,
                } as any,
                cols,
                { minCols: mins.minCols, minRows: mins.minRows }
            );

            // poi: mantieni minimi e fai rientrare senza ridurre lo span (shiftando lo start)
            const fitted = keepMinAndFit(
                snapped as Geom,
                cols,
                { minCols: mins.minCols, minRows: mins.minRows },
                /* allowShiftStart */ true
            );

            onChangeSlots(updateSlotGeom(slots, s.id, fitted));
        };

        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    // resize: handle bottom-right
    const onMouseDownResize = (e: React.MouseEvent, s: SlotDef) => {
        if (locked) return;
        if (!containerRef.current || !s.geom) return;
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const start = { ...s.geom };
        const mins = getSlotMin?.(s.id) ?? { minCols: 3, minRows: 3 };

        const onMove = (ev: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const cellW = rect.width / cols;
            const deltaCols = (ev.clientX - startX) / cellW;
            const deltaRows = (ev.clientY - startY) / 40;

            const snapped = snapGeom(
                {
                    colStart: start.colStart,
                    rowStart: start.rowStart,
                    colSpan: start.colSpan + deltaCols,
                    rowSpan: start.rowSpan + deltaRows,
                } as any,
                cols,
                { minCols: mins.minCols, minRows: mins.minRows }
            );

            // In resize preferiamo NON spostare lo start,
            // ma se lo spazio non basta per i minimi, spostiamo lo start quel tanto che serve.
            const fitted = keepMinAndFit(
                snapped as Geom,
                cols,
                { minCols: mins.minCols, minRows: mins.minRows },
                /* allowShiftStart */ false
            );

            onChangeSlots(updateSlotGeom(slots, s.id, fitted));
        };

        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    return (
        <div className="absolute flex flex-col top-0 mx-auto w-full h-full max-w-[1400px] 
        rounded-2xl border border-white/10 bg-neutral-900/60 px-4 pt-6 backdrop-blur-xs">
            {/* Toolbar */}
            <div className="mb-6 flex items-center gap-3">
                {/* Impostazione delle Colonne */}
                <button
                    disabled={locked}
                    onClick={() => onAddSlot({ colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 3 })}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ${locked
                        ? "cursor-not-allowed border border-white/10 bg-neutral-900/40 text-neutral-500"
                        : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                        }`}
                    title="Aggiungi slot 3x2"
                >
                    <FiPlusIcon />
                    Aggiungi Slot
                </button>
                {selected && (
                    <button
                        disabled={locked}
                        onClick={() => onRemoveSlot(selected)}
                        className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ${locked
                            ? "cursor-not-allowed border border-white/10 bg-neutral-900/40 text-neutral-500"
                            : "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                            }`}
                        title="Rimuovi slot selezionato"
                    >
                        <FiTrash2Icon />
                        Rimuovi Slot
                    </button>
                )}
                {/* Fine Modifica del Layout */}
                <FDButton variant="soft" color="secondary" icon={<FiEdit3Icon />}
                    dataTooltipId="general-dashboard-tooltip"
                    dataTooltipContent={"Fine Modifica del Layout"}
                    onClick={() => setEditing((v) => !v)}
                    className="ml-auto"
                >
                    Fine Modifica
                </FDButton>
            </div>

            {/* Canvas (editor) */}
            <div className="grid grid-cols-12 gap-4 overflow-x-hidden h-full">
                <main className="col-span-12">
                    <div
                        ref={containerRef}
                        className={`h-full relative grid gap-4 grid-cols-1`}
                        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridAutoRows: isLgUp ? "40px" : undefined, }}
                    >
                        {/* griglia di sfondo (righe/colonne) */}
                        <div className="pointer-events-none absolute inset-0">
                            <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:calc((100%)/var(--cols))_100%,100%_40px]"
                                style={{ ['--cols' as any]: cols }} />
                        </div>

                        {slots.map((s) => {
                            const geom = s.geom!;
                            const style: React.CSSProperties = {
                                gridColumn: `${geom.colStart} / span ${geom.colSpan}`,
                                gridRow: `${geom.rowStart} / span ${geom.rowSpan}`,
                            };
                            const isSelected = selected === s.id;
                            return (
                                <div
                                    key={s.id}
                                    style={style}
                                    className={`relative rounded-xl border ${isSelected ? "border-emerald-400/60" : "border-white/10"
                                        } bg-neutral-800/70 px-3 py-2 text-xs text-neutral-300`}
                                    onMouseDown={(e) => {
                                        setSelected(s.id);
                                        onMouseDownMove(e, s);
                                    }}
                                >
                                    <div className="pointer-events-none select-none">
                                        {s.id} – {geom.colSpan}×{geom.rowSpan}
                                    </div>
                                    {/* handle resize */}
                                    <div
                                        onMouseDown={(e) => onMouseDownResize(e, s)}
                                        className="absolute bottom-1 right-1 h-3 w-3 cursor-se-resize rounded-sm bg-emerald-400"
                                        style={{ width: HANDLE_SIZE, height: HANDLE_SIZE }}
                                        title="Ridimensiona"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustomLayoutBuilder;