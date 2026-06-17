/**
 * descrizione: Side panel secondario per thread discussione nota.
 * compito:     visualizza storico, permette nuovi aggiornamenti e cancellazioni permesse.
 */
import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FDButton, FDIconButton, FDTextArea, SidePanelShell } from "@nex/fd-ui";
import { MdDelete, MdRefresh } from "react-icons/md";
import { IoAddOutline, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { SectionActionButton } from "../../../customersPanel/components/sectionUi";
import type { DeleteChangeState, DiscussionState } from "../../types";
import {
    extractHistoryEntryDate,
    extractHistoryEntryNoteText,
    extractHistoryEntryUserId,
    extractHistoryEntryUserLabel,
    formatNoteTypeDisplay,
    isAdministrativeTypeCode,
    isEntryOwnedByRequester,
    normalizeText,
} from "../../utils";

import { TbLayoutSidebarRightExpandFilled, TbLayoutSidebarLeftExpandFilled } from "react-icons/tb";


type CustomerNotesDiscussionDialogProps = {
    discussion: DiscussionState | null;
    discussionLoading: boolean;
    discussionText: string;
    savingDiscussion: boolean;
    deletingChange: DeleteChangeState;
    deletingChangeLoading: boolean;
    deletingNoteLoading: boolean;
    canEditDiscussion: boolean;
    requesterIdentityKeys: Set<string>;
    requesterLabel: string;
    canDeleteNoteRow: (row: any) => boolean;
    canDeleteHistoryEntry: (entry: any) => boolean;
    onClose: () => void;
    onDiscussionTextChange: (value: string) => void;
    onRefreshDiscussion: () => void;
    onAddDiscussionChange: () => void;
    onOpenDeleteNoteDialog: (row: any) => void;
    onOpenDeleteChangeDialog: (entry: any, historyIndex: number) => void;
};

/** Side shell secondaria che mostra e aggiorna la discussione storica di una nota Mongo. */
export const CustomerNotesDiscussionDialog: React.FC<CustomerNotesDiscussionDialogProps> = ({
    discussion,
    discussionLoading,
    discussionText,
    savingDiscussion,
    deletingChange,
    deletingChangeLoading,
    deletingNoteLoading,
    canEditDiscussion,
    requesterIdentityKeys,
    requesterLabel,
    canDeleteNoteRow,
    canDeleteHistoryEntry,
    onClose,
    onDiscussionTextChange,
    onRefreshDiscussion,
    onAddDiscussionChange,
    onOpenDeleteNoteDialog,
    onOpenDeleteChangeDialog,
}) => {
    /** Se esiste una mutation in corso la chiusura e bloccata per evitare stati inconsistenti. */
    const canClose = !(savingDiscussion || deletingChangeLoading || deletingNoteLoading);
    /** Etichetta tipologia uniformata (es. "Amministrativa (AMMI)"). */
    const noteTypeDisplay = formatNoteTypeDisplay(
        discussion?.noteTypeCode,
        discussion?.noteTypeLabel,
        "COMM"
    );

    /** Chiusura protetta del panel discussione. */
    const handleClose = React.useCallback(() => {
        if (!canClose) return;
        onClose();
    }, [canClose, onClose]);

    /** Refresh esplicito storico discussione (disabilitato durante loading). */
    const handleRefreshDiscussion = React.useCallback(() => {
        if (discussionLoading) return;
        onRefreshDiscussion();
    }, [discussionLoading, onRefreshDiscussion]);

    /** ESC locale: chiude la discussione senza impattare il panel parent. */
    React.useEffect(() => {
        if (!discussion) return;

        /** ESC nel side panel discussione. */
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            handleClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [discussion, handleClose]);

    /** Toggle layout compatto/espanso della discussione. */
    const [expand, setExpand] = useState(true);

    return (
        <AnimatePresence>
            {discussion && (
                <div className="absolute inset-y-0 right-0 z-40 w-[92%] overflow-hidden pointer-events-auto">
                    <SidePanelShell
                        title={`Discussione ${discussion.customerCode}${discussion.customerLabel ? ` - ${discussion.customerLabel}` : ""}`}
                        animateVariant="visible"
                        contentState="front"
                        onClose={canClose ? handleClose : undefined}
                        className="min-w-0 overflow-hidden"
                        headerActions={
                            <SectionActionButton onClick={handleClose} disabled={!canClose}>
                                <span>Torna al pannello</span>
                            </SectionActionButton>
                        }
                        bodyScrollable={false}
                        bodyClassName="min-w-0 overflow-hidden px-4 py-4"
                    >
                        <div className={` h-full min-h-0 min-w-0 overflow-hidden grid ${!expand ? " gap-2 lg:grid-cols-[240px_minmax(0,1fr)]" : ""}`}>
                            {!expand && (
                                <aside className="min-w-0 space-y-3 overflow-x-hidden rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 p-4 dark:border-neutral-700 dark:from-neutral-900 dark:to-neutral-800">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                            Cliente
                                        </p>
                                        <p className="text-sm font-semibold break-all text-neutral-900 dark:text-neutral-100">
                                            {discussion.customerCode}
                                            {discussion.customerLabel ? ` - ${discussion.customerLabel}` : ""}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${isAdministrativeTypeCode(discussion.noteTypeCode)
                                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                                                : "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
                                                }`}
                                        >
                                            {noteTypeDisplay}
                                        </span>
                                        <span className="rounded-full bg-neutral-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                                            {discussion.history.length} messaggi
                                        </span>
                                    </div>

                                    <div className="rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                                        <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                                            Nota originale
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap break-all">
                                            {discussion.noteText || "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                                        <p>
                                            <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                                                Autore:
                                            </span>{" "}
                                            {discussion.ownerLabel || "-"}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <FDButton
                                            size="small"
                                            variant="outline"
                                            radius="md"
                                            color="neutral"
                                            fullWidth
                                            loading={discussionLoading}
                                            disabled={discussionLoading}
                                            onClick={handleRefreshDiscussion}
                                            rightIcon={MdRefresh({})}
                                        >
                                            Aggiorna
                                        </FDButton>

                                        {canDeleteNoteRow(discussion.sourceRow) && (
                                            <FDButton
                                                variant="outline"
                                                color="error"
                                                size="small"
                                                radius="md"
                                                fullWidth
                                                rightIcon={MdDelete({})}
                                                onClick={() => onOpenDeleteNoteDialog(discussion.sourceRow)}
                                            >
                                                Elimina
                                            </FDButton>
                                        )}
                                    </div>
                                </aside>

                            )}

                            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                                <div className="flex min-w-0 items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
                                    <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                        {IoChatbubbleEllipsesOutline({})}
                                        <span className="min-w-0 truncate">Timeline aggiornamenti</span>
                                        {/* {isAdministrativeTypeCode(discussion.noteTypeCode) && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                                                {IoShieldCheckmarkOutline({})}
                                                AMMINISTRATIVA
                                            </span>
                                        )} */}
                                    </div>
                                    <FDButton
                                        className="shrink-0"
                                        size="small"
                                        variant="outline"
                                        color="neutral"
                                        radius="md"
                                        onClick={expand ? () => setExpand(false) : () => setExpand(true)}
                                        rightIcon={expand ? TbLayoutSidebarLeftExpandFilled({}) : TbLayoutSidebarRightExpandFilled({})}
                                    >
                                        {expand ? "Riduci" : "Espandi"}
                                    </FDButton>
                                </div>

                                <div className="min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto bg-gradient-to-b from-neutral-50 via-white to-sky-50/30 p-4 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
                                    <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm border border-neutral-200 bg-white p-3 text-sm text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                            Nota originale
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap break-all">
                                            {discussion.noteText || "-"}
                                        </p>
                                    </div>

                                    {discussion.history.map((entry, index) => {
                                        /** Allineamento messaggio a destra se entry dell'utente corrente. */
                                        const isMine = isEntryOwnedByRequester(entry, requesterIdentityKeys);
                                        const entryUserLabel = extractHistoryEntryUserLabel(entry, "");
                                        const displayUserLabel =
                                            entryUserLabel || (isMine ? requesterLabel : "-");
                                        const canDelete = canDeleteHistoryEntry(entry);
                                        const isDeletingEntry =
                                            deletingChangeLoading &&
                                            deletingChange?.noteId === discussion.noteId &&
                                            deletingChange?.historyIndex === index;

                                        return (
                                            <div
                                                key={`${discussion.noteId}-${index}-${extractHistoryEntryUserId(entry)}`}
                                                className={`flex min-w-0 ${isMine ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`min-w-0 max-w-[85%] rounded-2xl p-3 shadow-sm ${isMine
                                                        ? "rounded-tr-sm border border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-700/50 dark:bg-sky-950/30 dark:text-sky-100"
                                                        : "rounded-tl-sm border border-neutral-200 bg-white text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                                                        }`}
                                                >
                                                    <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-[11px]">
                                                        <span className="min-w-0 truncate font-semibold">
                                                            {displayUserLabel}
                                                        </span>
                                                        <span className="opacity-80">
                                                            {extractHistoryEntryDate(entry)}
                                                        </span>
                                                    </div>
                                                    <p className="whitespace-pre-wrap break-all text-sm">
                                                        {extractHistoryEntryNoteText(entry)}
                                                    </p>
                                                    {canDelete && (
                                                        <div className="mt-2 flex justify-end">
                                                            <FDIconButton
                                                                icon={MdDelete({})}
                                                                variant="danger"
                                                                size="small"
                                                                onClick={() =>
                                                                    onOpenDeleteChangeDialog(entry, index)
                                                                }
                                                                loading={isDeletingEntry}
                                                                disabled={deletingChangeLoading}
                                                                ariaLabel="Elimina aggiornamento"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {!discussion.history.length && !discussionLoading && (
                                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                            Nessun aggiornamento disponibile. Aggiungi la prima risposta.
                                        </p>
                                    )}

                                    {discussionLoading && (
                                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                            Caricamento discussione...
                                        </p>
                                    )}
                                </div>

                                <div className="border-t border-neutral-200 p-3 dark:border-neutral-700">
                                    {canEditDiscussion ? (
                                        <div className="space-y-2">
                                            <FDTextArea
                                                value={discussionText}
                                                onChange={(event) =>
                                                    onDiscussionTextChange(event.target.value)
                                                }
                                                placeholder="Scrivi un aggiornamento alla nota..."
                                                rows={3}
                                                autoResize={false}
                                                fullWidth
                                                size="sm"
                                                radius="md"
                                                className="break-all overflow-x-hidden"
                                                wrap="soft"
                                                disabled={savingDiscussion || discussionLoading}
                                            />
                                            <div className="flex justify-end">
                                                <FDButton
                                                    variant="solid"
                                                    color="primary"
                                                    icon={IoAddOutline({})}
                                                    loading={savingDiscussion}
                                                    onClick={onAddDiscussionChange}
                                                    disabled={!normalizeText(discussionText)}
                                                >
                                                    Aggiungi Aggiornamento
                                                </FDButton>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                            Questa nota è amministrativa: puoi visualizzare la discussione ma non aggiornarla.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </SidePanelShell>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CustomerNotesDiscussionDialog;
