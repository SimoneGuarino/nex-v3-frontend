/**
 * descrizione: Contratti tipizzati del modulo note cliente.
 * include:     payload UI, stati dialog, tipi sorting/filtering e props dei componenti principali.
 */
import type React from "react";
import type { ChangeLoadStatusArgs } from "layouts/clienti/types/load";

/** Sorting direction supported by note list APIs. */
export type SortDirection = "asc" | "desc";

/** Sorting fields supported by note list APIs. */
export type SortField =
    | "CLIENTE"
    | "RAGIONE_SOCIALE"
    | "PARTITA_IVA"
    | "CODICE_AGENTE"
    | "AGENTE"
    | "MICROSETTORE"
    | "CANALE_VENDITA"
    | "PROGRESSIONE_NOTA"
    | "NOTA"
    | "DATA_NOTA"
    | "TIPO_NOTA"
    | "UTENTE"
    | "ULTIMA_MODIFICA";

export type SortPresetValue = `${SortField}:${SortDirection}`;
/** Filtro locale per separare note commerciali/amministrative. */
export type NotesScopeFilter = "all" | "commerciali" | "amministrative";

/** Firma usata per sincronizzare lo stato di loading verso il parent. */
export type ChangeLoadStatusFn = (args: ChangeLoadStatusArgs) => void;

/** Active discussion context for the note thread dialog. */
export type DiscussionState = {
    noteId: string;
    customerCode: string;
    customerLabel: string;
    noteText: string;
    noteTypeCode: string;
    noteTypeLabel: string;
    ownerLabel: string;
    history: any[];
    sourceRow: any;
};

export type DeleteNoteState = {
    noteId: string;
    customerCode: string;
    noteText: string;
    ownerLabel: string;
} | null;

export type DeleteChangeState = {
    noteId: string;
    historyIndex: number;
    customerCode: string;
    ownerLabel: string;
    modifiedAt: string;
    noteText: string;
} | null;

/** Gruppo note per cliente (usato nel rendering lista). */
export type NotesGroup = {
    customerCode: string;
    customerLabel: string;
    notes: any[];
};

/** Metriche aggregate mostrate nell'header del manager. */
export type NotesSummary = {
    total: number;
    ammi: number;
    commerciali: number;
};

/** `openFor` segue il pattern storico usato dai side panel nel progetto. */
export type CustomerNotesPanelOpenFor = boolean | string | null;

/** Props del pannello note standalone (overlay + side shell). */
export type CustomerNotesPanelProps = {
    cliente: string | number;
    openFor: CustomerNotesPanelOpenFor;
    onClose: () => void;
    requestBody?: Record<string, any>;
    title?: React.ReactNode;
    sizeClassName?: string;
    closeOnBackdrop?: boolean;
    closeOnEsc?: boolean;
    className?: string;
    zIndexClassName?: string;
};

/** Props del manager centralizzato (stato + azioni + dialog). */
export type CustomerNotesManagerProps = {
    userContext: any;
    queryBody: Record<string, any>;
    changeLoadStatus?: ChangeLoadStatusFn;
    enabled?: boolean;
    className?: string;
    onDiscussionOpenChange?: (open: boolean) => void;
    onDiscussionCloseRequestChange?: (closeHandler: (() => void) | null) => void;
    onCustomerLabelChange?: (label: string) => void;
};

/** Parametri minimi richiesti dall'hook orchestratore. */
export type UseCustomerNotesManagerParams = {
    userContext: any;
    queryBody: Record<string, any>;
    changeMainLoadStatus: ChangeLoadStatusFn;
    enabled?: boolean;
};

export type NotesCursorEntry = {
    d?: string;
    t?: string;
    e?: string;
    p?: string;
    i?: string;
};

export type NotesFederatedCursor = Partial<{
    S01: NotesCursorEntry;
    S02: NotesCursorEntry;
    S03: NotesCursorEntry;
}>;

export type ImpaginationState = {
    hasMore?: boolean;
    nextOffset?: number; // legacy fallback
    total?: number;
    cursor?: NotesFederatedCursor | null;
} | null;

/** Payload usato per togglare o impostare uno specifico loader. */
export type ChangeLoadArgs = {
    from: keyof NotesManagerLoadStatus;
    bool?: boolean;
};

export type NotesManagerLoadStatus = {
    total?: boolean;
    search?: boolean;
}