import { FDDialog } from "@nex/fd-ui";

export default function DeletePromptDialog({
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
            size="lg"
            open={open}
            onClose={onClose}
            title="Confermi eliminazione?"
            confirmText="Elimina"
            onConfirm={onConfirm}
            loading={loading}
            color="error"
        >
            <p className="mt-2">Vuoi eliminare definitivamente il prompt <b>{title ?? "(senza titolo)"}</b>?</p>
        </FDDialog>
    );
};