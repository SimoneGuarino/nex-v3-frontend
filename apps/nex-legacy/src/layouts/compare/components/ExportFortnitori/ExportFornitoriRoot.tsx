import { ReactNode } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { styled } from "@mui/material/styles";
import Loader from "../../../../Loader";

export type ExportRootProps = {
    children: ReactNode;
    open: boolean;
    onClose?: () => void;
    ownerState: {
        open: boolean;
        darkMode: boolean;
        loading?: boolean;
    };
};

const StyledDialog = styled(Dialog)<{ ownerState: ExportRootProps["ownerState"] }>(
    ({ theme, ownerState }) => {
        const { darkMode } = ownerState || {};
        const bg = darkMode ? "#1c1c1c" : "#fff";

        return {
            // paper (il contenitore del dialog)
            "& .MuiPaper-root": {
                borderRadius: theme.spacing(2),
                padding: theme.spacing(2),
                backgroundColor: bg,
                boxShadow: theme.shadows[10],

                // ❌ via minWidth fissa che rompe su mobile
                // minWidth: 500,
                // minHeight: 300,

                // ✅ sizing responsive
                width: "min(92vw, 560px)",         // non supera lo schermo su mobile
                maxWidth: "100vw",
                maxHeight: "90dvh",                 // non supera l’altezza visibile
                display: "flex",
                flexDirection: "column",
                margin: theme.spacing(1.5),         // respiro dai bordi su mobile
            },

            // titolo: sticky per restare visibile durante scroll del contenuto
            "& .MuiDialogTitle-root": {
                position: "sticky",
                top: 0,
                zIndex: 1,
                backgroundColor: bg,
                paddingBottom: theme.spacing(1),
            },

            // contenuto: scrollabile, con padding interno invariato
            "& .MuiDialogContent-root": {
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(2),
                overflowY: "auto",
                paddingTop: theme.spacing(2),
                paddingBottom: theme.spacing(2),
                // assicura che il contenuto prenda lo spazio disponibile
                flex: "1 1 auto",
            },
        };
    }
);

export default function ExportRoot({ children, open, onClose, ownerState }: ExportRootProps) {
    const { loading } = ownerState || {};

    return (
        <StyledDialog
            open={open}
            onClose={onClose}
            PaperProps={{ 'data-tour': 'comp-export' }}
            ownerState={ownerState}
            className="z-index-10000 text-center"
        >
            <DialogTitle>Scarica il listino di un fornitore</DialogTitle>

            {loading ? (
                <DialogContent className="flex flex-col justify-evenly items-center h-full w-full">
                    <div>
                        <h2>Convertendo il listino nel formato richiesto</h2>
                        <h2>L'operazione potrebbe richiedere fino a 2 minuti</h2>
                    </div>
                    <div className="flex justify-center items-center h-full w-full">
                        <Loader />
                    </div>
                </DialogContent>
            ) : (
                <DialogContent className="flex flex-col justify-between">
                    {children}
                </DialogContent>
            )}
        </StyledDialog>
    );
}
