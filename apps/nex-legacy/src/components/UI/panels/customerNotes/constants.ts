// src/components/UI/panels/customerNotes/constants.ts
/**
 * descrizione: Costanti UI del modulo note cliente.
 * include:     opzioni ordinamento, filtri scope e fallback tipologia nota.
 */
import type { FDSelectOption } from "components/UI/input/FDSelect";
import type { NotesScopeFilter, SortPresetValue } from "./types";

/** Preset di ordinamento inviati al backend tramite `parseSortPreset`. */
export const SORT_PRESET_OPTIONS: FDSelectOption<SortPresetValue>[] = [
    { value: "DATA_NOTA:desc", label: "Data creazione: piu recenti" },
    { value: "DATA_NOTA:asc", label: "Data creazione: meno recenti" },
    { value: "ULTIMA_MODIFICA:desc", label: "Ultima modifica: piu recenti" },
    { value: "ULTIMA_MODIFICA:asc", label: "Ultima modifica: meno recenti" },
];

/** Opzioni filtro locale per tipologia funzionale della nota. */
export const NOTE_SCOPE_OPTIONS: Array<{ value: NotesScopeFilter; label: string }> = [
    { value: "all", label: "Tutte" },
    { value: "commerciali", label: "Commerciali" },
    { value: "amministrative", label: "Amministrative" },
];

/** Opzione placeholder usata quando le tipologie non sono ancora caricate. */
export const EMPTY_NOTE_TYPE_OPTIONS: FDSelectOption<string>[] = [
    { value: "", label: "Nessuna tipologia" },
];
