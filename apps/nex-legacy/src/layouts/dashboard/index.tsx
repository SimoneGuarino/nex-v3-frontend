import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiGrid,
    FiColumns,
    FiLayout,
    FiMove,
    FiPlus,
    FiLock,
    FiUnlock,
    FiEdit3,
} from "react-icons/fi";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import CustomLayoutBuilder from "./CustomLayoutBuilder";
import {
    loadPersistedV3, savePersistedV3,
    addSlot, removeSlot,
    padOrder,
    computePalette,
    mapWidgetsToSlots,
    mapGeomBetweenCols
} from "./utils/utils";
import { PersistedCustomPattern, Pattern, SlotDef, SlotId, WidgetDef, WidgetId } from "./types/types";

import WidgetDrawer from "./WidgetDrawer";
import CalendarWidget from "./widgets/CalendarWidget";
import { FDIconButton, FDButton } from "@nex/fd-ui";
import { Tooltip } from "react-tooltip";
import NotesWidget from "./widgets/NotesWidget";
import FidiStatusWidget from "./widgets/FidiStatusWidget";
import WelcomeBackWidget from "./widgets/WelcomeBackWidget";
import CompareStatsWidget from "./widgets/CompareStatsWidget";
import { useUserContext } from "context/UserContext";
import { parseRolesEnv } from "utils/data/getNestedProperty";
import OrderFBWidget from "./widgets/OrderFBWidget";
import { useSectionTour } from "tour/useSectionTour";
import { Role } from "tour/types";
import ReleaseNotesWidget from "./widgets/ReleaseNotesWidget";



const FiMoveIcon = FiMove as React.FC<{ className?: string }>;
const FiLayoutIcon = FiLayout as React.FC<{ className?: string }>;
const FiColumnsIcon = FiColumns as React.FC<{ className?: string }>;
const FiGridIcon = FiGrid as React.FC<{ className?: string }>;
const FiPlusIcon = FiPlus as React.FC<{ className?: string }>;
const FiLockIcon = FiLock as React.FC<{ className?: string }>;
const FiUnlockIcon = FiUnlock as React.FC<{ className?: string }>;
const FiEdit3Icon = FiEdit3 as React.FC<{ className?: string }>;


// ==========================
// Utils
// ==========================
const ROLES_MAP = parseRolesEnv();           // { "0":"Dev", "1":"Admin", ... }
type RoleName = string;

function normalizeRoleName(role?: string | null): RoleName | null {
    if (!role) return null;
    // normalizza (case-insensitive, togli spazi extra)
    return String(role).trim();
}

function canUseWidget(def: WidgetDef, role: RoleName | null): boolean {
    if (!def || !def.id) return false;
    if (!def.roles || def.roles.length === 0) return true; // pubblico
    if (!role) return false;
    //converti il ruolo utente in index e verifica
    const roles = Object.values(ROLES_MAP).map(r => normalizeRoleName(r)).filter(Boolean) as string[];
    const index = roles.indexOf(role);
    if (index === -1) return false; // ruolo utente non trovato
    if (!def.roles.includes(index)) return false; // ruolo utente non permesso

    // ruolo utente permesso
    return true;
}

/**
 * SmartDashboard.tsx
 * --------------------------------------------------
 * A composable, pattern‑based dashboard shell with drag‑and‑drop widgets,
 * pattern switching, and local persistence. Built with React + TailwindCSS
 * (+ Framer Motion for pleasant transitions) and React‑Icons.
 *
 * Drop this file in your React project and render <SmartDashboard />.
 *
 * Optional deps (install if not present):
 *   npm i framer-motion react-icons
 *
 * Tailwind: no special plugin needed. This uses basic grid utilities.
 */



// ==========================
// Sample Widgets (replace with your actual widgets)
// ==========================
const CardShell: React.FC<{
    title: string;
    children: React.ReactNode;
    dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
    onRemove?: () => void;
    locked?: boolean; // 🔒
}> = ({ title, children, dragHandleProps, onRemove, locked }) => (
    <div className="flex flex-col 
    h-full rounded-2xl dark:border dark:border-white/10 bg-white dark:bg-neutral-900/60 dark:shadow-xl backdrop-blur-sm">
        <div
            className="flex items-center justify-between gap-2 border-b border-white/10 p-4"
            {...(!locked ? dragHandleProps : {})} // niente drag handle in lock
        >
            <div className="flex items-center gap-2 text-sm font-medium dark:text-neutral-50 text-neutral-800">
                {!locked && <FiMoveIcon className="opacity-50" aria-hidden />}  {/* no handle quando bloccato */}
                <span>{title}</span>
            </div>

            <div className="flex items-center gap-2">
                {!locked && <div className="text-xs text-neutral-400">drag me</div>}
                {onRemove && !locked && (
                    <button
                        onClick={onRemove}
                        className="rounded-md px-2 py-1 text-xs text-neutral-300 hover:bg-red-500/10 hover:text-red-300"
                        title="Rimuovi widget"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
        {children}
    </div>
);

// Registry — swap these with your real widgets (e.g. adapters around old components)
export const WIDGETS: WidgetDef[] = [
    { id: "welcome", title: "Benvenuto", component: () => <WelcomeBackWidget />, minH: "min-h-[160px]", minCols: 5, minRows: 6 },
    { id: "notes", title: "BlockNote", component: () => <NotesWidget />, minH: "min-h-[380px]", minCols: 3, minRows: 13 },
    { id: "fidi-status", title: "Stato dei Fidi", component: () => <FidiStatusWidget timeframeLabel="(ultimi 7gg)" />, minH: "min-h-[380px]", minCols: 4, minRows: 8, roles: [0, 1] },
    { id: "calendar", title: "Calendario", component: () => <CalendarWidget />, minH: "min-h-[360px]", minCols: 4, minRows: 10, },
    { id: "compare", title: "Comparatore", component: () => <CompareStatsWidget />, minH: "min-h-[360px]", minCols: 4, minRows: 6, roles: [0, 1, 2] },
    { id: "order-fb", title: "Ordini FB", component: () => <OrderFBWidget />, minH: "min-h-[160px]", minCols: 3, minRows: 5, roles: [0, 1, 3] },
    //{ id: "stock-target", title: "Andamento Buyers", component: () => <StocksTargetWidget />, minH: "min-h-[160px]", minCols: 8, minRows: 8, roles: [0, 1] },
    { id: "release-notes", title: "Novità e aggiornamenti", component: () => <ReleaseNotesWidget />, minH: "min-h-[320px]", minCols: 4, minRows: 7, },
];

// ==========================
// Layout Patterns (add/adjust freely)
// ==========================
const PATTERNS: Pattern[] = [
    {
        id: "headline-3-wide",
        name: "Headline + 3 + Wide",
        description: "Hero in alto, 3 card, poi una wide",
        icon: <FiLayoutIcon />,
        gridClass:
            "grid gap-4 grid-cols-1 md:grid-cols-12 md:auto-rows-[minmax(160px,auto)]",
        slots: [
            { id: "slot-1", className: "md:col-span-12" }, // headline wide
            { id: "slot-2", className: "md:col-span-4" },
            { id: "slot-3", className: "md:col-span-4" },
            { id: "slot-4", className: "md:col-span-4" },
            { id: "slot-5", className: "md:col-span-4" },
            { id: "slot-6", className: "md:col-span-4" },
            { id: "slot-7", className: "md:col-span-4" },
            { id: "slot-8", className: "md:col-span-12" }, // footer wide
        ],
    },
    {
        id: "grid-2x2",
        name: "2×2",
        description: "Quattro slot, griglia bilanciata",
        icon: <FiGridIcon />,
        gridClass:
            "grid gap-4 md:grid-cols-2 md:auto-rows-[minmax(160px,auto)] lg:grid-cols-2",
        slots: [
            { id: "slot-1", className: "col-span-1" },
            { id: "slot-2", className: "col-span-1" },
            { id: "slot-3", className: "col-span-1" },
            { id: "slot-4", className: "col-span-1" },
            { id: "slot-5", className: "col-span-1" },
            { id: "slot-6", className: "col-span-1" },
        ],
    },
    {
        id: "sidebar-2rows",
        name: "Sidebar + 3",
        description: "Sidebar a sinistra e due righe a destra",
        icon: <FiColumnsIcon />,
        gridClass:
            "grid gap-4 grid-cols-1 md:grid-cols-12 md:auto-rows-[minmax(160px,auto)]",
        slots: [
            { id: "slot-2", className: "md:col-span-3 md:row-span-4" }, // sidebar
            { id: "slot-1", className: "md:col-span-9" }, // top right
            { id: "slot-3", className: "md:col-span-9" }, // bottom right
            { id: "slot-4", className: "md:col-span-9" }, // top right
            { id: "slot-5", className: "md:col-span-9" }, // bottom right
        ],
    },
];

// ==========================
export function useIsLgUp() {
    const [ok, setOk] = React.useState(() => window.matchMedia("(min-width: 1024px)").matches);
    React.useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const h = () => setOk(mq.matches);
        mq.addEventListener?.("change", h);
        return () => mq.removeEventListener?.("change", h);
    }, []);
    return ok;
};

//Quando sei ≥ lg, non forzare sempre 12 colonne: calcola dinamicamente quante colonne “stanno” bene nel container
function useResponsiveCols(ref: React.RefObject<HTMLElement>, baseCols: number, minTrackPx = 260) {
    const [cols, setCols] = React.useState(baseCols);
    React.useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        const ro = new ResizeObserver((entries) => {
            const w = entries[0].contentRect.width;
            const next = Math.max(1, Math.min(baseCols, Math.floor(w / minTrackPx)));
            setCols(next || 1);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [ref, baseCols, minTrackPx]);
    return cols;
};

// ==========================
// Dashboard Shell
// ==========================
export default function SmartDashboard() {
    const [userContext] = useUserContext();
    const [openLatestNotes, setOpenLatestNotes] = React.useState(false);

    const openLatest = React.useCallback(() => setOpenLatestNotes(true), []);
    const closeLatest = React.useCallback(() => setOpenLatestNotes(false), []);

    // Tour-system
    type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";

    const shouldIgnoreClose = (reason?: CloseReason) =>
        tour.isOpen && (reason === "backdropClick" || reason === "clickAway" || reason === "escapeKeyDown");

    const tour = useSectionTour({
        id: "nex_v2_dashboard",
        version: "1.0.0",
        user: {
            id: userContext?.details?.id ?? "",
            role: (userContext?.details?.authz?.activeGroup?.key as Role) ?? "Tester",
        },
        keys: "dashboard",
        actions: {
            2: () => { setDrawerOpen(false); setLocked(false); },
            3: () => { setDrawerOpen(true) },
            6: () => { setDrawerOpen(true) },
            7: () => { setDrawerOpen(false); setLocked(true); }
        }
    });

    const currentRole: RoleName | null = normalizeRoleName(userContext?.details?.authz?.activeGroup?.name);

    // Lista widget permessi per il ruolo
    const allowedWidgets = React.useMemo(
        () => WIDGETS.filter(w => canUseWidget(w, currentRole)),
        [currentRole]
    );

    const [activePatternId, setActivePatternId] = React.useState(PATTERNS[0].id);

    // WidgetOrder può contenere null e ha lunghezza = #slot
    const [widgetOrder, setWidgetOrder] = React.useState<(WidgetId | null)[]>(() =>
        padOrder(WIDGETS.map((w) => w.id), PATTERNS[0].slots.length)
    );

    const isLgUp = useIsLgUp();

    // tracciamo la sorgente del drag (grid vs palette)
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [drawerDragging, setDrawerDragging] = React.useState(false); // traccia quando stai al drawer e passalo al Drawer


    // layout lock
    const [locked, setLocked] = React.useState<boolean>(() => {
        try { return JSON.parse(localStorage.getItem("smart-dashboard.locked") || "true"); } catch { return true; }
    });

    // modalità editor + stato pattern custom
    const [editing, setEditing] = React.useState(false);
    const [custom, setCustom] = React.useState<PersistedCustomPattern>({
        id: "custom",
        cols: 12,
        slots: [], // sarà inizializzato al primo switch
    });

    // UX: su mobile → “seleziona widget” → “tocca slot”
    const [selectedToPlace, setSelectedToPlace] = React.useState<WidgetId | null>(null);
    // selezione di un widget esistente (mobile move)
    const [selectedToMove, setSelectedToMove] = React.useState<{ wid: WidgetId; srcIndex: number } | null>(null);

    const gridRef = React.useRef<HTMLDivElement>(null);
    const baseCols = custom.cols ?? 12;
    const responsiveCols = useResponsiveCols(gridRef, baseCols, 260);

    // palette = tutti i widget non posizionati
    const palette = React.useMemo(
        () => computePalette(allowedWidgets, widgetOrder),
        [allowedWidgets, widgetOrder]
    );

    const customSelectorPattern: Pattern = React.useMemo(() => ({
        id: "custom",
        name: "Custom",
        description: "Layout personalizzato",
        icon: <FiLayoutIcon />,
        gridClass: "grid gap-4 grid-cols-1",  // niente auto-rows qui: lo mettiamo inline
        slots: (custom?.slots?.length ?? 0) > 0
            ? custom.slots.map(s => ({ ...s }))   // niente className dinamiche
            : [{ id: "slot-preview" as SlotId, className: "hidden" }],
        cols: custom.cols,
    }), [custom]);

    // 2) La lista dei pattern contiene SEMPRE “Custom”
    const patternList: Pattern[] = React.useMemo(() => {
        return [...PATTERNS, customSelectorPattern];
    }, [customSelectorPattern]);

    const activePattern = React.useMemo(
        () => patternList.find((p) => p.id === activePatternId) ?? patternList[0],
        [patternList, activePatternId]
    );

    const effectiveCols = activePattern.id === "custom" && isLgUp ? responsiveCols : 1;

    // mapping derivato, ora accetta null
    const slotToWidget = React.useMemo(
        () => mapWidgetsToSlots(activePattern, widgetOrder),
        [activePattern, widgetOrder]
    );

    const [hoveredSlot, setHoveredSlot] = React.useState<SlotId | null>(null);
    const [draggingWidget, setDraggingWidget] = React.useState<WidgetId | null>(null);

    const isPlacing = !!selectedToPlace && !isLgUp && !locked

    // Load persisted (e fai pad alla lunghezza del pattern caricato)
    React.useEffect(() => {
        const defaults: any = {
            patternId: PATTERNS[0].id,
            widgetOrder: padOrder(WIDGETS.map(w => w.id), PATTERNS[0].slots.length),
            custom: { id: "custom", cols: 12, slots: [] as SlotDef[] }
        };
        const st = loadPersistedV3(defaults);
        setActivePatternId(st.patternId);
        setWidgetOrder(st.widgetOrder);
        if (st.custom) setCustom(st.custom);
    }, []);

    // save persisted v3
    React.useEffect(() => {
        savePersistedV3({ patternId: activePatternId, widgetOrder, custom });
    }, [activePatternId, widgetOrder, custom]);

    React.useEffect(() => {
        try { localStorage.setItem("smart-dashboard.locked", JSON.stringify(locked)); } catch { }
    }, [locked]);

    // quando cambia ruolo → rimuovi dagli slot i widget non permessi
    React.useEffect(() => {
        setWidgetOrder(prev => {
            const len = activePattern.slots.length;
            const next = padOrder(prev, len);
            let changed = false;
            for (let i = 0; i < next.length; i++) {
                const wid = next[i];
                if (!wid) continue;
                const def = WIDGETS.find(w => w.id === wid);
                if (!def || !canUseWidget(def, currentRole)) {
                    next[i] = null;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
        // opzionale: chiudi palette per evitare drop immediati di widget non permessi
        //setDrawerOpen(false);
        if (!tour.isOpen) {
            // se vuoi chiudere solo quando cambia RUOLO (non pattern),
            // lascia pure questo close, altrimenti commentalo del tutto.
            setDrawerOpen(false);
        }
    }, [currentRole, activePattern.slots.length, tour.isOpen]);

    // quando cambia pattern (o lock) → resetta selezione move (se in corso)
    React.useEffect(() => { setSelectedToMove(null); }, [activePatternId, locked]);
    // ESC per annullare selezioni mobili
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (selectedToPlace) setSelectedToPlace(null);
                if (selectedToMove) setSelectedToMove(null);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selectedToPlace, selectedToMove]);


    const onPatternChange = (id: string) => {
        if (id === "custom" && (!custom.slots || custom.slots.length === 0)) {
            const first: SlotDef = { id: "slot-1", geom: { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 3 } };
            setCustom({ id: "custom", cols: 12, slots: [first] });
            setWidgetOrder([widgetOrder[0] ?? WIDGETS[0].id]);
        }
        setActivePatternId(id);

        const slotsLen =
            id === "custom"
                ? (custom.slots?.length || 1) // se era vuoto, abbiamo appena messo 1 slot
                : (PATTERNS.find(p => p.id === id)?.slots.length || 1);

        setWidgetOrder(prev => padOrder(prev.filter(Boolean) as (WidgetId | null)[], slotsLen));
        if (tour.isOpen) setDrawerOpen(true);
    };


    // ========== Drag handlers ==========
    const onDragStart = (e: React.DragEvent, wid: WidgetId, source: "grid" | "palette" = "grid") => {
        if (locked) return;
        setDraggingWidget(wid);
        // usa un mime type custom per evitare interferenze
        try { e.dataTransfer.setData("text/x-widget-id", wid); } catch { }
        e.dataTransfer.setData("text/plain", wid); // fallback
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragEnd = () => {
        if (locked) return;
        setDraggingWidget(null);
    };

    const onDragOverSlot = (e: React.DragEvent, slotId: SlotId) => {
        if (locked) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setHoveredSlot(slotId);
    };

    const onDragLeaveSlot = () => setHoveredSlot(null);

    // Drop su slot con gestione palette + swap
    const onDropToSlot = (e: React.DragEvent, destSlot: SlotId) => {
        if (locked) return;
        e.preventDefault();
        const wid =
            (e.dataTransfer.getData("text/x-widget-id") ||
                e.dataTransfer.getData("text/plain") ||
                draggingWidget) as WidgetId | null;

        setHoveredSlot(null);
        if (!wid) return;

        const def = WIDGETS.find(w => w.id === wid);
        if (!def || !canUseWidget(def, currentRole)) {
            // opzionale: toast/tooltip "Widget non disponibile per il tuo ruolo"
            return;
        }

        setWidgetOrder((prev) => {
            const len = activePattern.slots.length;
            const next = padOrder(prev, len);

            const destIndex = activePattern.slots.findIndex((s) => s.id === destSlot);
            if (destIndex < 0) return prev;

            const srcIndex = next.findIndex((x) => x === wid);

            // Se proviene dalla grid (srcIndex >= 0): move/swap classico
            if (srcIndex >= 0) {
                const occupying = next[destIndex];
                next[srcIndex] = null;
                next[destIndex] = wid;
                if (occupying && srcIndex !== destIndex) next[srcIndex] = occupying;
                return next;
            }

            // Se proviene dalla palette (srcIndex === -1):
            //  - Se lo slot è occupato, l'occupante torna in palette (slot diventa wid)
            //  - Se è vuoto, semplicemente piazza wid
            next[destIndex] = wid;
            return next;
        });

        setDraggingWidget(null);
    };

    // handler rimozione via bottone
    const removeWidget = (wid: WidgetId) => {
        setWidgetOrder((prev) => {
            const len = activePattern.slots.length;
            const next = padOrder(prev, len);
            const idx = next.findIndex((x) => x === wid);
            if (idx >= 0) next[idx] = null;
            return next;
        });
    };

    const resetLayout = () => {
        const defaultOrder = padOrder(WIDGETS.map((w) => w.id), PATTERNS[0].slots.length);
        setWidgetOrder(defaultOrder);
        setActivePatternId(PATTERNS[0].id);
    };

    // renderer del widget: passa onRemove
    const renderWidget = (wid: WidgetId | null) => {
        if (!wid) return null;
        const def = WIDGETS.find((w) => w.id === wid)!;
        if (!canUseWidget(def, currentRole)) {
            return null;
        }

        const Comp = def.component;
        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                draggable={!locked && isLgUp}
                onDragStart={!locked && isLgUp ? (e: any) => onDragStart(e, def.id, "grid") : undefined}
                onDragEnd={!locked && isLgUp ? onDragEnd : undefined}
                className={`${def.minH ?? ""} ${locked ? "cursor-default" : ""} h-full`}
                role="group"
                aria-roledescription="widget"
                aria-label={def.title}
                tabIndex={0}
            >
                <CardShell title={def.title}
                    onRemove={!locked ? () => removeWidget(def.id) : undefined}
                    locked={locked}>
                    <Comp />
                </CardShell>
            </motion.div >
        );
    };

    const getSlotMin = React.useCallback((slotId: SlotId) => {
        // trova l’indice dello slot nel custom.slots
        const idx = custom.slots.findIndex(s => s.id === slotId);
        if (idx < 0) return { minCols: 3, minRows: 3 };

        const wid = widgetOrder[idx];
        const def = wid ? WIDGETS.find(w => w.id === wid) : undefined;
        return { minCols: def?.minCols ?? 3, minRows: def?.minRows ?? 3 };
    }, [custom.slots, widgetOrder]);

    //UX: su mobile → “seleziona widget” → “tocca slot”
    const tryPlaceHere = (slotId: SlotId) => {
        // MOVE di un widget esistente (mobile)
        if (selectedToMove) {
            setWidgetOrder(prev => {
                const next = padOrder(prev, activePattern.slots.length);
                const destIndex = activePattern.slots.findIndex(s => s.id === slotId);
                if (destIndex < 0) return prev;

                // consenti solo se lo slot è libero
                if (next[destIndex] != null) return prev;

                // sposta dal src al dest
                const { wid, srcIndex } = selectedToMove;
                if (next[srcIndex] !== wid) return prev; // incoerenza, lascia stare
                next[srcIndex] = null;
                next[destIndex] = wid;
                return next;
            });
            setSelectedToMove(null);
            return;
        }

        // PLACE dalla palette (già esistente)
        if (selectedToPlace) {
            setWidgetOrder(prev => {
                const next = padOrder(prev, activePattern.slots.length);
                const destIndex = activePattern.slots.findIndex(s => s.id === slotId);
                next[destIndex] = selectedToPlace;
                return next;
            });
            setSelectedToPlace(null);
        }
    };


    return (
        <DashboardLayout>
            <div className="mx-auto w-full relative max-w-[1400px] pb-12 pt-6">
                {/* Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-semibold text-neutral-500">
                            Dashboard Smart
                        </h1>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                            beta
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {activePattern.id === "custom" && <FDButton variant="soft" color="neutral" icon={<FiEdit3Icon />}
                            disabled={locked || activePattern.id !== "custom"}
                            dataTooltipId="general-dashboard-tooltip"
                            dataTooltipContent={editing ? "Fine Modifica del Layout" : "Modifica il Layout della griglia widget"}
                            onClick={() => setEditing((v) => !v)}
                        >
                            {editing ? "Fine Modifica" : "Modifica Layout"}
                        </FDButton>}

                        <span data-tour="dash-unlock-widget">
                            <FDIconButton
                                variant={locked ? "danger" : "general"}
                                icon={locked ? <FiLockIcon className="opacity-80" /> : <FiUnlockIcon className="opacity-80" />}
                                onClick={() => { setLocked((v) => !v); setEditing(false); }}
                                className={`
                            ${locked && "text-red-800"}`}
                                dataTooltipId="general-dashboard-tooltip"
                                dataTooltipContent={locked ? "Sblocca layout" : "Blocca layout"}

                            /></span>
                        <span data-tour="dash-add-widget">
                            <FDIconButton
                                icon={<FiPlusIcon className="opacity-80" />}
                                onClick={() => !locked && setDrawerOpen(true)}
                                disabled={locked}
                                dataTooltipId="general-dashboard-tooltip"
                                dataTooltipContent={locked ? "Sblocca per aggiungere widget" : "Aggiungi widget"}
                                ariaLabel="widget-drawer"

                            /></span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-12 gap-4 overflow-hidden h-full px-4">
                    <main className="col-span-12">
                        <div className={activePattern.gridClass}
                            style={activePattern.id === "custom"
                                ? {
                                    gridTemplateColumns: `repeat(${isLgUp ? effectiveCols : 1}, minmax(0,1fr))`,
                                    gridAutoRows: isLgUp ? "40px" : undefined,
                                }
                                : undefined}
                        >
                            {activePattern.slots.map((slot: SlotDef, i: number) => {
                                const isHovered = hoveredSlot === slot.id;
                                const widgetId = slotToWidget[slot.id] ?? null;
                                const isSelectedToMove = !!selectedToMove && selectedToMove.wid === widgetId; // evidenzia se è il widget selezionato per lo spostamento
                                const highlightAsTarget = !isLgUp && !locked && !widgetId && (selectedToPlace || selectedToMove);

                                // Geom inline SOLO in custom e SOLO da lg in su
                                const style =
                                    activePattern.id === "custom" && slot.geom && isLgUp
                                        ? (() => {
                                            // rimappa 12→effectiveCols
                                            const mapped = mapGeomBetweenCols(slot.geom, baseCols, effectiveCols,
                                                // impone i minimi del widget se presente
                                                (isLgUp ? (WIDGETS.find(w => w.id === widgetId)?.minCols ?? 1) : 1)
                                            );
                                            return {
                                                gridColumn: `${mapped.colStart} / span ${mapped.colSpan}`,
                                                gridRow: `${mapped.rowStart} / span ${Math.max(
                                                    widgetId ? (WIDGETS.find(w => w.id === widgetId)?.minRows ?? 1) : 1,
                                                    slot.geom.rowSpan
                                                )}`
                                            };
                                        })()
                                        : undefined;

                                return (
                                    <div
                                        key={`${slot.id}::${i} ${highlightAsTarget ? "ring-2 ring-teal-400/70 ring-offset-2 ring-offset-transparent animate-pulse" : ""}`}
                                        className={`relative ${slot.className}`}
                                        style={style}
                                        onDragOver={!locked && isLgUp ? (e) => onDragOverSlot(e, slot.id) : undefined}
                                        onDragLeave={!locked && isLgUp ? onDragLeaveSlot : undefined}
                                        onDrop={!locked && isLgUp ? (e) => onDropToSlot(e, slot.id) : undefined}
                                        // se il widget esiste e siamo su mobile: selezionalo per spostarlo
                                        onClick={!isLgUp && !locked ? () => tryPlaceHere(slot.id) : undefined}
                                        role="region"
                                        aria-label={`Slot ${slot.id}`}
                                    >
                                        <div
                                            className={`min-h-[140px] h-full rounded-2xl transition-colors
                                            ${isSelectedToMove ? "ring-2 ring-teal-400/70 ring-offset-2 ring-offset-transparent" : ""}
                                            ${!locked && (isHovered ? "border border-teal-400/60" : "border border-black/10 dark:border-white/10")}`}
                                            onClick={
                                                !isLgUp && !locked && widgetId
                                                    ? (e) => {
                                                        e.stopPropagation();
                                                        setSelectedToPlace(null); // in caso stessi piazzando dalla palette
                                                        setSelectedToMove({ wid: widgetId as WidgetId, srcIndex: i });
                                                    }
                                                    : undefined
                                            }
                                        >

                                            <AnimatePresence mode="popLayout">
                                                {renderWidget(widgetId)}
                                            </AnimatePresence>
                                        </div>

                                        {/* niente hint quando bloccato */}
                                        {(!locked && !widgetId) && (
                                            <div className="pointer-events-none absolute inset-0 grid place-items-center">
                                                <div className="rounded-lg bg-neutral-700/60 px-3 py-1 text-xs text-neutral-300">
                                                    {(!isLgUp || selectedToPlace) ? "Tocca uno slot per posizionare" : "Trascina un widget qui"}
                                                </div>
                                            </div>
                                        )}


                                    </div>
                                );
                            })}
                        </div>
                    </main>
                </div>

                {activePattern.id === "custom" && editing && isLgUp && (
                    <div className="mb-6">
                        <CustomLayoutBuilder
                            cols={custom.cols}
                            slots={custom.slots}
                            onChangeSlots={(slots) => {
                                setCustom((c) => ({ ...c, slots }));
                                // riallinea widgetOrder alla nuova lunghezza
                                setWidgetOrder((prev) => padOrder(prev, slots.length));
                            }}
                            onAddSlot={(geom) => {
                                const { slots, widgetOrder: order } = addSlot(custom.slots, widgetOrder, geom ?? { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 2 });
                                setCustom((c) => ({ ...c, slots }));
                                setWidgetOrder(order);
                            }}
                            onRemoveSlot={(slotId) => {
                                const { slots, widgetOrder: order } = removeSlot(custom.slots, widgetOrder, slotId);
                                setCustom((c) => ({ ...c, slots }));
                                setWidgetOrder(order);
                            }}
                            locked={locked}
                            getSlotMin={getSlotMin}
                            setEditing={setEditing}
                        />
                    </div>
                )}
            </div>

            {/* Footer helper */}
            <p className="mt-6 text-xs text-neutral-500 text-center">
                Suggerimento: trascina il titolo del widget per spostarlo. Cambia pattern
                in qualsiasi momento, la disposizione viene mantenuta. Puoi adattare
                liberamente PATTERNS e il registro WIDGETS per integrare i tuoi
                componenti reali (es. FidiStats, ReasumeOfBuyersYearTarget, ecc.).
            </p>

            {/* Helper mobile: “tocca uno slot” */}
            {!isLgUp && !locked && (selectedToPlace || selectedToMove) && (
                <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-neutral-900/90 px-3 py-2 text-xs text-neutral-200 shadow-lg backdrop-blur text-center">
                    {selectedToMove
                        ? <>Tocca uno <b>slot vuoto</b> per spostare: <span className="font-medium">"{selectedToMove.wid}"</span></>
                        : <>Tocca uno <b>slot vuoto</b> per posizionare: <span className="font-medium">"{selectedToPlace}"</span></>}
                    <button
                        onClick={() => { setSelectedToPlace(null); setSelectedToMove(null); }}
                        className="ml-2 rounded bg-white/10 px-2 py-0.5 mt-2"
                    >
                        Annulla
                    </button>
                </div>
            )}

            <WidgetDrawer
                open={drawerOpen}
                //onClose={() => setDrawerOpen(false)}
                onClose={(_e, reason) => {
                    if (shouldIgnoreClose(reason)) return;     // durante il tour non chiudere per backdrop/ESC/clickAway
                    setDrawerOpen(false);                      // consenti itemClick (la X)
                }}
                palette={palette}
                onDragStart={(e, id) => {
                    setDrawerDragging(true);                 // <— abilita pass-through del backdrop
                    onDragStart(e as any, id as any, "palette");
                }}
                onDragEnd={() => {
                    setDrawerDragging(false);                // <— ripristina backdrop cliccabile
                    onDragEnd();
                }}
                locked={locked}
                isDraggingFromDrawer={drawerDragging}
                patternData={{
                    patternList,
                    activePatternId,
                    onPatternChange
                }}
                resetLayout={resetLayout}
                onPickForMobile={(id: any) => { setSelectedToPlace(id as any); setDrawerOpen(false); }}

            />
            <Tooltip id="general-dashboard-tooltip" place="bottom" className="max-w-[15vw] min-w-[150px] !text-xs text-center z-50 !rounded-md" />
        </DashboardLayout>
    );
}