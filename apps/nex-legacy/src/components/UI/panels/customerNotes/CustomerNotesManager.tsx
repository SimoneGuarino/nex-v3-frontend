// src/components/UI/panels/customerNotes/CustomerNotesManager.tsx
/**
 * descrizione: Componente orchestratore del modulo note cliente.
 * compito:     collega hook di dominio, componenti visuali e dialog di azione.
 */
import React from "react";
import CustomerNotesHeader from "./components/CustomerNotesHeader";
import CustomerNotesGroups from "./components/CustomerNotesGroups";
import CustomerNotesCreateDialog from "./components/dialogs/CustomerNotesCreateDialog";
import CustomerNotesDiscussionDialog from "./components/dialogs/CustomerNotesDiscussionDialog";
import CustomerNotesDeleteDialogs from "./components/dialogs/CustomerNotesDeleteDialogs";
import useCustomerNotesManager from "./hooks/useCustomerNotesManager";
import type { ChangeLoadStatusFn, CustomerNotesManagerProps } from "./types";
import { asDigitString, extractCustomerLabel } from "./utils";

/** Fallback no-op quando il parent non passa un handler di loading condiviso. */
const NOOP_CHANGE_LOAD_STATUS: ChangeLoadStatusFn = () => { };
/** Helper locale className composer. */
const cn = (...values: Array<string | false | null | undefined>) =>
    values.filter(Boolean).join(" ");

/**
 * Hub unico per note cliente: ricerca, creazione, discussione e cancellazioni.
 */
export const CustomerNotesManager: React.FC<CustomerNotesManagerProps> = ({
    userContext,
    queryBody,
    changeLoadStatus = NOOP_CHANGE_LOAD_STATUS,
    enabled = true,
    className = "",
    onDiscussionOpenChange,
    onDiscussionCloseRequestChange,
    onCustomerLabelChange,
}) => {
    const manager = useCustomerNotesManager({
        userContext,
        queryBody,
        changeMainLoadStatus: changeLoadStatus,
        enabled,
    });
    const discussionOpen = Boolean(manager.discussion);

    /**
     * Codice cliente "target" se il filtro e monocliente.
     * Se `ccli` e array, non imponiamo un match specifico per il titolo.
     */
    const customerCodeFilter = React.useMemo(() => {
        const rawCustomerCode = queryBody?.ccli;
        if (Array.isArray(rawCustomerCode)) return "";
        return asDigitString(rawCustomerCode) || "";
    }, [queryBody?.ccli]);

    /**
     * Miglior etichetta cliente disponibile da riportare al contenitore esterno.
     * Priorita: cliente filtrato -> prima label non vuota in lista.
     */
    const detectedCustomerLabel = React.useMemo(() => {
        if (!Array.isArray(manager.rows) || manager.rows.length === 0) return "";

        if (customerCodeFilter) {
            const targetRow = manager.rows.find((row) => {
                const rowCustomerCode = asDigitString(
                    row?.CLIENTE || row?.CustomerCode || row?.customerCode
                );
                return rowCustomerCode === customerCodeFilter;
            });

            const targetLabel = targetRow ? extractCustomerLabel(targetRow) : "";
            if (targetLabel) return targetLabel;
        }

        for (const row of manager.rows) {
            const label = extractCustomerLabel(row);
            if (label) return label;
        }

        return "";
    }, [customerCodeFilter, manager.rows]);

    /** Notifica al parent l'apertura/chiusura della discussione secondaria. */
    React.useEffect(() => {
        onDiscussionOpenChange?.(discussionOpen);
    }, [discussionOpen, onDiscussionOpenChange]);

    /** Espone al parent la callback per chiudere programmaticamente la discussione. */
    React.useEffect(() => {
        onDiscussionCloseRequestChange?.(discussionOpen ? manager.closeDiscussion : null);
        return () => onDiscussionCloseRequestChange?.(null);
    }, [discussionOpen, manager.closeDiscussion, onDiscussionCloseRequestChange]);

    /** Sincronizza il titolo cliente nel pannello che ospita il manager. */
    React.useEffect(() => {
        onCustomerLabelChange?.(detectedCustomerLabel);
    }, [detectedCustomerLabel, onCustomerLabelChange]);

    return (
        <div className={cn("relative flex h-full min-h-0 flex-col", className)}>
            <div
                className={cn(
                    "flex h-full min-h-0 flex-col transition-[transform,opacity,filter] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
                    discussionOpen
                        ? "pointer-events-none translate-x-8 scale-[0.985] opacity-70 blur-[1px]"
                        : "pointer-events-auto"
                )}
            >
                <CustomerNotesHeader
                    rowsCount={manager.rows.length}
                    total={manager.pagination?.total || 0}
                    summary={manager.summary}
                    loadingTotal={manager.loadStatus.total ?? false}
                    loadingInitial={manager.loadingInitial}
                    loadingMore={manager.loadingMore}
                    searchText={manager.searchText}
                    sortPreset={manager.sortPreset}
                    scopeFilter={manager.scopeFilter}
                    onSearchTextChange={manager.setSearchText}
                    onSortPresetChange={manager.setSortPreset}
                    onScopeFilterChange={manager.setScopeFilter}
                    onRefresh={manager.fetchFirstPage}
                    onOpenCreateDialog={() => manager.openCreateDialog()}
                />

                <CustomerNotesGroups
                    loadingInitial={manager.loadingInitial}
                    groupedNotes={manager.groupedNotes}
                    rowsCount={manager.rows.length}
                    pagination={manager.pagination}
                    loadingMore={manager.loadingMore}
                    canDeleteNoteRow={manager.canDeleteNoteRow}
                    canEditNote={manager.canEditNote}
                    onOpenCreateDialog={manager.openCreateDialog}
                    onOpenDiscussion={manager.openDiscussion}
                    onOpenDeleteNoteDialog={manager.openDeleteNoteDialog}
                    onFetchMore={manager.fetchMore}
                    customerCode={manager.createCustomerCode}
                />
            </div>

            <CustomerNotesDiscussionDialog
                discussion={manager.discussion}
                discussionLoading={manager.discussionLoading}
                discussionText={manager.discussionText}
                savingDiscussion={manager.savingDiscussion}
                deletingChange={manager.deletingChange}
                deletingChangeLoading={manager.deletingChangeLoading}
                deletingNoteLoading={manager.deletingNoteLoading}
                canEditDiscussion={manager.canEditDiscussion}
                requesterIdentityKeys={manager.requesterIdentityKeys}
                requesterLabel={manager.requesterLabel}
                canDeleteNoteRow={manager.canDeleteNoteRow}
                canDeleteHistoryEntry={manager.canDeleteHistoryEntry}
                onClose={manager.closeDiscussion}
                onDiscussionTextChange={manager.setDiscussionText}
                onRefreshDiscussion={manager.refreshDiscussion}
                onAddDiscussionChange={manager.handleAddDiscussionChange}
                onOpenDeleteNoteDialog={manager.openDeleteNoteDialog}
                onOpenDeleteChangeDialog={manager.openDeleteChangeDialog}
            />

            <CustomerNotesCreateDialog
                open={manager.createDialogOpen}
                loading={manager.createNoteLoading}
                customerCodeOptions={manager.customerCodeOptions}
                customerCode={manager.createCustomerCode}
                loadingCustomerOptions={manager.createCustomerSearchLoading}
                noteTypeOptions={manager.noteTypeOptions}
                noteType={manager.createNoteType}
                noteText={manager.createNoteText}
                loadingNoteTypes={manager.loadingNoteTypes}
                canManageAdministrativeNotes={manager.canManageAdministrativeNotes}
                onClose={manager.closeCreateDialog}
                onSave={manager.handleCreateNote}
                onCustomerCodeChange={manager.setCreateCustomerCode}
                onCustomerSearchChange={manager.setCreateCustomerSearch}
                onNoteTypeChange={manager.setCreateNoteType}
                onNoteTextChange={manager.setCreateNoteText}
            />

            <CustomerNotesDeleteDialogs
                deletingNote={manager.deletingNote}
                deletingNoteLoading={manager.deletingNoteLoading}
                deletingChange={manager.deletingChange}
                deletingChangeLoading={manager.deletingChangeLoading}
                onCloseDeleteNote={manager.closeDeleteNoteDialog}
                onConfirmDeleteNote={manager.handleDeleteNote}
                onCloseDeleteChange={manager.closeDeleteChangeDialog}
                onConfirmDeleteChange={manager.handleDeleteChange}
            />
        </div>
    );
};

export default CustomerNotesManager;
