/**
 * descrizione: Dialog di conferma per eliminazione nota o singolo messaggio storico.
 * compito:     mostrare il riepilogo minimo prima di azioni distruttive.
 */
import React from "react";
import { FDDialog } from "@nex/fd-ui";
import type { DeleteChangeState, DeleteNoteState } from "../../types";
import { truncateText } from "../../utils";

type CustomerNotesDeleteDialogsProps = {
    deletingNote: DeleteNoteState;
    deletingNoteLoading: boolean;
    deletingChange: DeleteChangeState;
    deletingChangeLoading: boolean;
    onCloseDeleteNote: () => void;
    onConfirmDeleteNote: () => void;
    onCloseDeleteChange: () => void;
    onConfirmDeleteChange: () => void;
};

/** Dialog di conferma eliminazione nota e singola modifica. */
export const CustomerNotesDeleteDialogs: React.FC<CustomerNotesDeleteDialogsProps> = ({
    deletingNote,
    deletingNoteLoading,
    deletingChange,
    deletingChangeLoading,
    onCloseDeleteNote,
    onConfirmDeleteNote,
    onCloseDeleteChange,
    onConfirmDeleteChange,
}) => {
    return (
        <>
            <FDDialog
                open={Boolean(deletingNote)}
                onClose={onCloseDeleteNote}
                title="Confermi eliminazione nota?"
                confirmText="Elimina"
                cancelText="Annulla"
                onConfirm={onConfirmDeleteNote}
                loading={deletingNoteLoading}
                color="error"
                /** Durante operazione evita chiusure accidentali del dialog. */
                disableBackdropClose={deletingNoteLoading}
                size="md"
            >
                <div className="space-y-1 overflow-x-hidden">
                    <p>Stai per eliminare definitivamente la nota cliente selezionata.</p>
                    <p className="text-sm">
                        Cliente: <b>{deletingNote?.customerCode || "-"}</b>
                    </p>
                    <p className="text-sm whitespace-pre-wrap break-all">
                        Nota: <b>{truncateText(deletingNote?.noteText || "-", 200)}</b>
                    </p>
                </div>
            </FDDialog>

            <FDDialog
                open={Boolean(deletingChange)}
                onClose={onCloseDeleteChange}
                title="Confermi l'eliminazione dell'aggiornamento?"
                confirmText="Elimina"
                cancelText="Annulla"
                onConfirm={onConfirmDeleteChange}
                loading={deletingChangeLoading}
                color="error"
                /** Durante operazione evita chiusure accidentali del dialog. */
                disableBackdropClose={deletingChangeLoading}
                size="md"
            >
                <div className="space-y-1 overflow-x-hidden">
                    <p>Stai per eliminare un aggiornamento della discussione.</p>
                    <p className="text-sm">
                        Cliente: <b>{deletingChange?.customerCode || "-"}</b>
                    </p>
                    <p className="text-sm">
                        Data aggiornamento: <b>{deletingChange?.modifiedAt || "-"}</b>
                    </p>
                    <p className="text-sm whitespace-pre-wrap break-all">
                        Testo: <b>{truncateText(deletingChange?.noteText || "-", 200)}</b>
                    </p>
                </div>
            </FDDialog>
        </>
    );
};

export default CustomerNotesDeleteDialogs;
