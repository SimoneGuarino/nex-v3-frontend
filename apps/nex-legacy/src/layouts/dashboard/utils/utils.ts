// utils.ts
import type { Pattern, PersistedCustomPattern, PersistedStateV2, SlotDef, SlotGeom, SlotId, WidgetId } from "../types/types";

//export const STORAGE_KEY = "smart-dashboard.layout.v2";
export const STORAGE_KEY_V3 = "smart-dashboard.layout.v3";

// Pad/truncate mantenendo buchi (null) in coda
export function padOrder(
    ids: (WidgetId | null)[],
    slotsLen: number
): (WidgetId | null)[] {
    const out = ids.slice(0, slotsLen);
    while (out.length < slotsLen) out.push(null);
    return out;
};

// Adatta l'ordine a un nuovo numero di slot preservando la sequenza visibile
export function fitOrderToSlots(
    prevOrder: (WidgetId | null)[],
    newSlotsLen: number
): (WidgetId | null)[] {
    const compact = prevOrder.filter((x): x is WidgetId => !!x);
    return padOrder(compact, newSlotsLen);
};

// Mappa slot → widgetId (o null). Accetta order con null.
export function mapWidgetsToSlots(
    pattern: Pattern,
    widgetOrder: (WidgetId | null)[]
): Record<SlotId, WidgetId | null> {
    const mapping = {} as Record<SlotId, WidgetId | null>;
    const slots = pattern.slots.map((s) => s.id);
    for (let i = 0; i < slots.length; i++) {
        mapping[slots[i]] = widgetOrder[i] ?? null;
    }
    return mapping;
};

// Restituisce i widget NON presenti in widgetOrder (cioè in palette)
export function computePalette(
    all: { id: string; title: string }[],
    order: (string | null)[]
) {
    const placed = new Set(order.filter(Boolean) as string[]);
    return all.filter(w => !placed.has(w.id));
};

/** Converte geom in classi Tailwind (solo md+ per semplicità)______________________________ */
export function geomToClass(geom: SlotGeom): string {
    // md:grid-cols-12 su container; qui applichiamo solo md:col-start/span e row
    const { colStart, colSpan, rowStart, rowSpan } = geom;
    return [
        `md:col-start-${colStart}`,
        `md:col-span-${colSpan}`,
        `md:row-start-${rowStart}`,
        `md:row-span-${rowSpan}`,
    ].join(" ");
};

export function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
;}

/** Snap su griglia (colonne/righe intere) */
export function snapGeom(
    g: SlotGeom,
    cols: number,
    opts?: { minCols?: number; minRows?: number; maxRows?: number }
): SlotGeom {
    const minCols = Math.max(1, opts?.minCols ?? 3);
    const minRows = Math.max(1, opts?.minRows ?? 3);
    const maxRows = opts?.maxRows ?? 200;

    const colStart = Math.max(1, Math.min(Math.round(g.colStart), cols));
    const colMaxSpan = cols - colStart + 1;
    const colSpan = Math.max(minCols, Math.min(Math.round(g.colSpan), colMaxSpan));

    const rowStart = Math.max(1, Math.min(Math.round(g.rowStart), maxRows));
    const rowMaxSpan = maxRows - rowStart + 1;
    const rowSpan = Math.max(minRows, Math.min(Math.round(g.rowSpan), rowMaxSpan));

    return { colStart, colSpan, rowStart, rowSpan };
};
/** Crea uno slot nuovo con id incrementale */
export function makeSlot(nextIndex: number, geom: SlotGeom): SlotDef {
    return { id: `slot-${nextIndex}` as SlotId, geom, className: geomToClass(geom) };
};

/** Restituisce il primo SlotId libero: slot-1, slot-2, ... */
function nextFreeSlotId(slots: SlotDef[]): SlotId {
  const used = new Set(slots.map(s => s.id));
  let i = 1;
  while (used.has(`slot-${i}` as SlotId)) i++;
  return `slot-${i}` as SlotId;
};

/** Aggiunge uno slot con ID univoco e aggiusta widgetOrder (aggiunge un "buco" null in coda). */
export function addSlot(
  slots: SlotDef[],
  widgetOrder: (WidgetId | null)[],
  geom: SlotGeom
): { slots: SlotDef[]; widgetOrder: (WidgetId | null)[] } {
  const id = nextFreeSlotId(slots);
  const nextSlots: SlotDef[] = [...slots, { id, geom }];
  const nextOrder = [...widgetOrder, null]; // nuovo slot vuoto
  return { slots: nextSlots, widgetOrder: nextOrder };
};

/** Rimuove uno slot per id, tenendo allineato l'ordine widget per indice di slot. */
export function removeSlot(
  slots: SlotDef[],
  widgetOrder: (WidgetId | null)[],
  slotId: SlotId
): { slots: SlotDef[]; widgetOrder: (WidgetId | null)[] } {
  const idx = slots.findIndex(s => s.id === slotId);
  if (idx < 0) return { slots, widgetOrder };

  const nextSlots = slots.slice(0, idx).concat(slots.slice(idx + 1));
  const nextOrder = widgetOrder.slice(0, idx).concat(widgetOrder.slice(idx + 1));
  return { slots: nextSlots, widgetOrder: nextOrder };
};

export function updateSlotGeom(slots: SlotDef[], slotId: SlotId, geom: SlotGeom) {
    return slots.map(s => s.id === slotId ? { ...s, geom, className: geomToClass(geom) } : s);
};

/** Persistenza v3: salva anche il pattern custom */
export function loadPersistedV3(
    defaults: { patternId: string; widgetOrder: (WidgetId | null)[]; custom?: PersistedCustomPattern }
): PersistedStateV2 {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_V3);
        if (!raw) throw new Error("no persisted");
        const parsed = JSON.parse(raw) as PersistedStateV2;
        return {
            patternId: parsed.patternId ?? defaults.patternId,
            widgetOrder: Array.isArray(parsed.widgetOrder) ? parsed.widgetOrder : defaults.widgetOrder,
            custom: parsed.custom ?? defaults.custom,
        };
    } catch {
        return defaults;
    }
};

export function savePersistedV3(state: PersistedStateV2) {
    try { localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(state)); } catch { }
};

export function mapGeomBetweenCols(
  g: { colStart: number; colSpan: number; rowStart: number; rowSpan: number },
  fromCols: number,
  toCols: number,
  minCols = 1
) {
  const scale = toCols / Math.max(1, fromCols);
  let colStart = Math.max(1, Math.round((g.colStart - 1) * scale) + 1);
  let colSpan  = Math.max(minCols, Math.round(g.colSpan * scale));

  // clamp per non sforare a destra
  if (colStart + colSpan - 1 > toCols) {
    colSpan = Math.max(minCols, toCols - colStart + 1);
    if (colSpan < minCols) { colSpan = minCols; colStart = Math.max(1, toCols - colSpan + 1); }
  }
  return { colStart, colSpan, rowStart: g.rowStart, rowSpan: g.rowSpan };
};