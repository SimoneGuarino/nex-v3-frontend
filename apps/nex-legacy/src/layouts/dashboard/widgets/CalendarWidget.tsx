import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiPlus, FiX } from "react-icons/fi";
import { FDIconButton } from "@nex/fd-ui";

const FiChevronLeftIcon = FiChevronLeft as React.FC<{ className?: string }>;
const FiChevronRightIcon = FiChevronRight as React.FC<{ className?: string }>;
const FiPlusIcon = FiPlus as React.FC<{ className?: string }>;
const FiXIcon = FiX as React.FC<{ className?: string }>;

type EventColor = "emerald" | "amber" | "violet" | "sky";
interface CalendarEvent {
    id: string;
    title: string;
    date: string;         // "YYYY-MM-DD"
    start?: string;       // "HH:MM"
    end?: string;         // "HH:MM"
    color?: EventColor;   // dot color
}
const LS_KEY = "smartdash.calendar.events.v1";

const IT_WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const COLORS: Record<EventColor, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-400",
    violet: "bg-violet-500",
    sky: "bg-sky-500",
};

function fmtMonthLabel(d: Date) {
    return new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" })
        .format(d)
        .replace(/^\w/, (m) => m.toUpperCase());
}
function toISODate(d: Date) {
    return d.toISOString().slice(0, 10);
}
function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}
/** Matrice mese: 6 settimane x 7 giorni, settimana da LUN */
function getMonthMatrix(year: number, month: number): Date[] {
    const first = new Date(year, month, 1);
    const firstWeekday = (first.getDay() + 6) % 7; // 0=Mon … 6=Sun
    const start = new Date(year, month, 1 - firstWeekday);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
    }
    return days;
}

function useLocalEvents() {
    const [events, setEvents] = React.useState<CalendarEvent[]>([]);
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) setEvents(JSON.parse(raw));
        } catch { }
    }, []);
    React.useEffect(() => {
        try { localStorage.setItem(LS_KEY, JSON.stringify(events)); } catch { }
    }, [events]);
    return { events, setEvents };
}

const NewEventForm: React.FC<{
    date: string; onSave: (e: CalendarEvent) => void; onClose: () => void;
}> = ({ date, onSave, onClose }) => {
    const [title, setTitle] = React.useState("");
    const [start, setStart] = React.useState("09:00");
    const [end, setEnd] = React.useState("10:00");
    const [color, setColor] = React.useState<EventColor>("emerald");
    const canSave = title.trim().length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="rounded-xl border border-white/10 bg-neutral-900/95 p-3 shadow-xl"
        >
            <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-200">Nuovo evento</div>
                <button onClick={onClose} className="rounded p-1 text-neutral-400 hover:bg-white/5"><FiXIcon /></button>
            </div>
            <div className="space-y-2">
                <div className="text-xs text-neutral-400">Data: {date.split("-").reverse().join("/")}</div>
                <input
                    value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titolo"
                    className="w-full rounded-md border border-white/10 bg-neutral-800/70 px-2 py-1 text-sm text-neutral-100"
                />
                <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-neutral-400">Inizio
                        <input value={start} onChange={(e) => setStart(e.target.value)} type="time"
                            className="mt-1 w-full rounded-md border border-white/10 bg-neutral-800/70 px-2 py-1 text-sm text-neutral-100" />
                    </label>
                    <label className="text-xs text-neutral-400">Fine
                        <input value={end} onChange={(e) => setEnd(e.target.value)} type="time"
                            className="mt-1 w-full rounded-md border border-white/10 bg-neutral-800/70 px-2 py-1 text-sm text-neutral-100" />
                    </label>
                </div>
                <label className="text-xs text-neutral-400">Colore
                    <select value={color} onChange={(e) => setColor(e.target.value as EventColor)}
                        className="mt-1 w-full rounded-md border border-white/10 bg-neutral-800/70 px-2 py-1 text-sm text-neutral-100">
                        <option value="emerald">Verde</option>
                        <option value="amber">Giallo</option>
                        <option value="violet">Viola</option>
                        <option value="sky">Azzurro</option>
                    </select>
                </label>
                <button
                    disabled={!canSave}
                    onClick={() => onSave({ id: crypto.randomUUID(), title, date, start, end, color })}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm mt-4 ${canSave
                        ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                        : "cursor-not-allowed border border-white/10 bg-neutral-900/40 text-neutral-500"
                        }`}
                >
                    <FiPlusIcon /> Salva
                </button>
            </div>
        </motion.div>
    );
};

const DayEventsCard: React.FC<{
    dateISO: string; events: CalendarEvent[]; onDelete: (id: string) => void;
}> = ({ dateISO, events, onDelete }) => {
    const label = dateISO.split("-").reverse().join("/");
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="rounded-xl border border-white/10 bg-white/90 p-3 text-neutral-900 shadow-xl backdrop-blur"
        >
            <div className="mb-1 text-[11px] text-neutral-500">Eventi – {label}</div>
            <ul className="space-y-1">
                {events.map(ev => (
                    <li key={ev.id} className="flex items-center justify-between rounded-md bg-white/70 px-2 py-1">
                        <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${COLORS[ev.color ?? "emerald"]}`} />
                            <div className="text-sm font-medium">{ev.title}</div>
                            <div className="text-xs text-neutral-500">
                                {ev.start}–{ev.end}
                            </div>
                        </div>
                        <button onClick={() => onDelete(ev.id)} className="rounded p-1 text-neutral-500 hover:bg-neutral-900/5">
                            <FiXIcon />
                        </button>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
};

export default function CalendarWidget() {
    const today = new Date();
    const { events, setEvents } = useLocalEvents();

    const [cursor, setCursor] = React.useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedISO, setSelectedISO] = React.useState<string | null>(null);
    const [showFormFor, setShowFormFor] = React.useState<string | null>(null);
    const [newEvent, setNewEvent] = React.useState<boolean>(false);

    const monthDays = React.useMemo(
        () => getMonthMatrix(cursor.getFullYear(), cursor.getMonth()),
        [cursor]
    );

    const eventsByDate = React.useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        for (const ev of events) {
            if (!map.has(ev.date)) map.set(ev.date, []);
            map.get(ev.date)!.push(ev);
        }
        // ordina per inizio
        for (const arr of map.values()) {
            arr.sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
        }
        return map;
    }, [events]);

    const handleAdd = (ev: CalendarEvent) => {
        console.log(ev);
        setEvents(prev => [...prev, ev]);
        setShowFormFor(null);
        setNewEvent(false);
        setSelectedISO(ev.date);
    };
    const handleDelete = (id: string) => {
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    const onPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    const onNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
    const onToday = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1));

    return (
        <React.Suspense fallback={<div className="p-4 text-xs text-neutral-400">Carico…</div>}>
            <div className="relative h-full px-4 pb-4">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between flex-wrap">
                    <div className="flex items-center gap-2 dark:text-neutral-300 text-neutral-500">
                        <FDIconButton
                            icon={<FiChevronLeftIcon />}
                            onClick={onPrev}
                            ariaLabel="Mese precedente"
                            variant="text"
                            dataTooltipId="general-dashboard-tooltip"
                            dataTooltipContent="Mese precedente"
                        />
                        <div className="ml-2 text-sm font-semibold dark:text-neutral-100 text-neutral-700">{fmtMonthLabel(cursor)}</div>
                        <FDIconButton
                            icon={<FiChevronRightIcon />}
                            onClick={onNext}
                            ariaLabel="Mese successivo"
                            variant="text"
                            dataTooltipId="general-dashboard-tooltip"
                            dataTooltipContent="Mese successivo"
                        />
                        <button onClick={onToday} className="ml-2 rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/5">
                            Oggi
                        </button>
                    </div>
                    <button
                        onClick={() => setNewEvent(true)}
                        className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/15"
                        title="Nuovo evento"
                    >
                        <FiPlusIcon />
                        <span className="hidden sm:block">Nuovo</span>
                    </button>
                </div>

                {/* Week header */}
                <div className="mb-1 grid grid-cols-7 gap-1">
                    {IT_WEEKDAYS.map((d) => (
                        <div key={d} className="px-2 py-1 text-center text-[11px] font-medium dark:text-neutral-400 text-neutral-800">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Month grid */}
                <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((d, idx) => {
                        const inMonth = d.getMonth() === cursor.getMonth();
                        const isToday = sameDay(d, today);
                        const iso = toISODate(d);
                        const evs = eventsByDate.get(iso) ?? [];
                        return (
                            <div
                                key={idx}
                                onClick={() => setShowFormFor(iso)}
                                className={`relative flex flex-col min-h-15
                                items-center rounded-xl border py-2 
                                ${evs && evs.length > 0 ? "justify-between" : "justify-center"} 
                                ${inMonth ? "dark:border-white/10 border-sky-400/30 dark:bg-neutral-900/60" : "dark:border-white/5 border-black/10 dark:bg-neutral-900/30 opacity-70"} 
                                ${selectedISO === iso ? "ring-1 ring-amber-400/60" : isToday && "ring-1 ring-sky-600"}`}
                            >
                                <span className={`h-7 w-7 place-items-center rounded-md text-sm
                            align-self-center text-center content-center
                                    ${isToday ? "bg-sky-500 text-white" : "bg-white/5 text-neutral-500 dark:text-neutral-200"}`}>
                                    {d.getDate()}
                                </span>

                                {/* Event dots */}
                                {(evs && evs.length > 0) && <div className="flex flex-wrap gap-1">
                                    {evs.slice(0, 4).map((e) => (
                                        <span key={e.id} className={`h-2 w-2 rounded-full ${COLORS[e.color ?? "emerald"]}`} />
                                    ))}
                                    {evs.length > 4 && (
                                        <span className="text-[10px] text-neutral-400">+{evs.length - 4}</span>
                                    )}
                                </div>}

                                {/* Click area to open day card */}
                                <button
                                    onClick={() => setSelectedISO(iso)}
                                    className="absolute inset-0"
                                    aria-label="Apri eventi del giorno"
                                    title="Apri eventi del giorno"
                                />

                                {/* Floating day card at bottom (appears when selected) */}
                                <AnimatePresence>
                                    {selectedISO === iso && evs.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                                            className="pointer-events-auto absolute left-1/2 z-10 w-[280px] -translate-x-1/2 translate-y-2"
                                        >
                                            <DayEventsCard dateISO={iso} events={evs} onDelete={handleDelete} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {/* New event form (overlay) */}
                <AnimatePresence>
                    {(newEvent && showFormFor) && (
                        <motion.div
                            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 rounded-2xl backdrop-blur-xs"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowFormFor(null)}
                        >
                            <div onClick={(e) => e.stopPropagation()}>
                                <NewEventForm date={showFormFor} onSave={handleAdd} onClose={() => setShowFormFor(null)} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </React.Suspense>
    );
}