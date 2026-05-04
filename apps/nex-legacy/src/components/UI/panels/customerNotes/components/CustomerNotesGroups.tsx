// src/components/UI/panels/customerNotes/components/CustomerNotesGroups.tsx
/**
 * descrizione: Render della lista note raggruppata per cliente.
 * compito:     mostrare metadati nota e azioni contestuali (discussione/eliminazione).
 */
import React from "react";
import FDButton from "components/UI/buttons/FDButton";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { MdDelete } from "react-icons/md";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import type { ImpaginationState, NotesGroup } from "../types";
import {
    extractHistoryRows,
    extractNoteId,
    extractNoteOwnerLabel,
    extractNoteText,
    extractNoteTypeCode,
    extractNoteTypeLabel,
    formatNoteTypeDisplay,
    formatDateTime,
    isAdministrativeNote,
    truncateText,

} from "../utils";
import { FDSkeletonLayout, FDSkeletonPresets, FDSkeletonSwitch } from "components/UI/box/FDSkeleton";

type CustomerNotesGroupsProps = {
    loadingInitial: boolean;
    groupedNotes: NotesGroup[];
    customerCode: String;
    rowsCount: number;
    pagination: ImpaginationState;
    loadingMore: boolean;
    canDeleteNoteRow: (row: any) => boolean;
    canEditNote: (row: any) => boolean;
    onOpenCreateDialog: (customerCode?: string) => void;
    onOpenDiscussion: (row: any) => void;
    onOpenDeleteNoteDialog: (row: any) => void;
    onFetchMore: () => void;
};

/** Lista note in formato lineare (no card) con azioni CRUD essenziali. */
export const CustomerNotesGroups: React.FC<CustomerNotesGroupsProps> = ({
    loadingInitial,
    groupedNotes,
    rowsCount,
    pagination,
    loadingMore,
    canDeleteNoteRow,
    canEditNote,
    onOpenCreateDialog,
    onOpenDiscussion,
    onOpenDeleteNoteDialog,
    onFetchMore,
}) => {
    /** Empty state quando i filtri correnti non restituiscono alcuna nota visibile. */
    if (!loadingInitial && groupedNotes.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center dark:border-neutral-700 dark:bg-neutral-900/60">
                <p className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                    Nessuna nota trovata con i filtri correnti
                </p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    Prova a cambiare ricerca/scope o crea una nuova nota.
                </p>
            </div>
        );
    };

    return (
        <FDSkeletonSwitch
            loading={loadingInitial}
            skeleton={<FDSkeletonLayout layout={FDSkeletonPresets.cardList(6, { randomizeHeight: true, rangeRowHeight: [80, 160], rowHeight: 20 })} />}
            className="min-h-0 flex-1 overflow-hidden h-full overflow-y-auto py-4 space-y-5 h-full"
        >
            {groupedNotes.map((group) => (
                <section key={group.customerCode} className="space-y-3">
                    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                        {group.notes.map((row: any, index: number) => {
                            /** Id mongo: abilita discussione e operazioni CRUD complete. */
                            const noteId = extractNoteId(row);
                            const canDelete = canDeleteNoteRow(row);
                            const canDiscuss = Boolean(noteId);
                            const canEdit = canEditNote(row);
                            const isAdminNote = isAdministrativeNote(row);
                            const historyCount = extractHistoryRows(row).length;
                            const noteTypeCode = extractNoteTypeCode(row);
                            const noteTypeLabel = extractNoteTypeLabel(row);
                            const noteTypeDisplay = formatNoteTypeDisplay(
                                noteTypeCode,
                                noteTypeLabel,
                                "COMM"
                            );
                            const noteOwnerLabel = extractNoteOwnerLabel(row);
                            const noteDate = formatDateTime(row?.DATA_NOTA || row?.Data);
                            const lastUpdate = formatDateTime(row?.ULTIMA_MODIFICA || row?.DataModifica);

                            return (
                                <article
                                    key={noteId || `${group.customerCode}-${index}`}
                                    className="border-b border-neutral-200 p-4 last:border-b-0 dark:border-neutral-700"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${isAdminNote
                                                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                                                        : "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
                                                        }`}
                                                >
                                                    {noteTypeDisplay}
                                                </span>
                                            </div>

                                            <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap break-all">
                                                {truncateText(extractNoteText(row) || "-", 200)}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                                                <span>Utente: {noteOwnerLabel || "-"}</span>
                                                <span>Data: {noteDate}</span>
                                                <span>Ultima mod: {lastUpdate}</span>
                                                <span>Cliente: {group.customerCode} - {group.customerLabel}</span>
                                                {canDiscuss && <span>Discussione: {historyCount} messaggi</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {canDiscuss && (
                                                <FDButton
                                                    variant="soft"
                                                    color="neutral"
                                                    size="small"
                                                    icon={IoChatbubbleEllipsesOutline({})}
                                                    onClick={() => onOpenDiscussion(row)}
                                                >
                                                    {canEdit ? "Discussione" : "Visualizza"}
                                                </FDButton>
                                            )}
                                            {canDelete && (
                                                <FDIconButton
                                                    icon={MdDelete({})}
                                                    variant="danger"
                                                    size="small"
                                                    ariaLabel="Elimina nota cliente"
                                                    onClick={() => onOpenDeleteNoteDialog(row)}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
            ))}

            {pagination?.hasMore && (
                <div className="flex justify-center">
                    <FDButton
                        variant="outline"
                        color="neutral"
                        loading={loadingMore}
                        onClick={onFetchMore}
                    >
                        Carica altre note
                    </FDButton>
                </div>
            )}
        </FDSkeletonSwitch>
    );
};

export default CustomerNotesGroups;
