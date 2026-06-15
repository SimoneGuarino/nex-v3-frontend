// src/layouts/queryAS400/components/delete-query-dialog.tsx
/**
 * descrizione: dialog di conferma eliminazione per una query salvata (wrapper di FDDialog).
 * props:       open, title? (titolo della query), onClose, onConfirm, loading?.
 * dipendenze:  FDDialog.
 */
import { FDDialog } from "@nex/fd-ui";

export default function DeleteQueryDialog({
    open,
    title,
    onClose,
    onConfirm,
    loading,
}: {
    open: boolean;
    title?: string;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
}) {
    return (
        <FDDialog
            open={open}
            onClose={onClose}
            title="Confermi eliminazione?"
            confirmText="Elimina"
            loading={loading}
            onConfirm={onConfirm}
            color="error"
        >
            <p className="mt-2">
                Vuoi eliminare definitivamente la query <b>{title ?? "(senza titolo)"}</b>?
            </p>
        </FDDialog>
    );
}
