// types.ts
import React from "react";

export type WidgetId = string;
export type SlotId = `slot-${number}`;

export interface WidgetDef {
    id: WidgetId;
    title: string;
    component: React.FC;
    minH?: string;
    minCols?: number; // default 3
    minRows?: number; // default 3
    roles?: number[]; // definisce quali utenti possono vedere il widget
}

/** Definizione “geometrica” dello slot su CSS Grid */
export interface SlotGeom {
    /** 1-based indices */
    colStart: number; // es. 1
    colSpan: number;  // es. 3
    rowStart: number; // es. 1
    rowSpan: number;  // es. 2
}

export interface SlotDef {
    id: SlotId;
    className?: string; // compat con pattern legacy
    geom?: SlotGeom;    // NEW: usato per pattern “custom”
}

export interface Pattern {
    id: string;
    name: string;
    description: string;
    icon?: React.ReactNode;
    /** classi container grid (breakpoint, gap, n colonne) */
    gridClass: string;
    /** slot definiti */
    slots: SlotDef[];
    /** (opz) n colonne base del layout, aiuta il builder per lo snap */
    cols?: number; // es. 12
    rowsAuto?: boolean; // default true -> auto-rows
}

/** Stato persistito per layout custom creati dall’utente */
export interface PersistedCustomPattern {
    id: "custom";
    cols: number;
    slots: SlotDef[]; // con geom valorizzato
}

export interface PersistedStateV2 {
    patternId: string;
    widgetOrder: (WidgetId | null)[];
    custom?: PersistedCustomPattern;
}
