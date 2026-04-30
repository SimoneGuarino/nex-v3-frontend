import { ReactNode } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { styled } from "@mui/material/styles";
import Loader from "../../../../Loader";

export type ExportConfrontatoreRootProps = {
    children: ReactNode;
    open: boolean;
    onClose?: () => void;
    ownerState: {
        open: boolean;
        darkMode: boolean;
        loading?: boolean;
    };
};

const StyledDialog = styled(Dialog)<{ ownerState: ExportConfrontatoreRootProps["ownerState"] }>(
    ({ theme, ownerState }) => {
        const { darkMode } = ownerState || {};
        const bg = darkMode ? "#1c1c1c" : "#fff";

        return {
            "& .MuiPaper-root": {
                borderRadius: theme.spacing(2),
                padding: theme.spacing(2),
                backgroundColor: bg,
                boxShadow: theme.shadows[10],

                // ❌ niente misure fisse che rompono su mobile:
                // minWidth: 500,
                // minHeight: 360,

                // ✅ sizing responsive:
                width: "min(92vw, 560px)",  // non sfora su mobile
                maxWidth: "100vw",
                maxHeight: "90dvh",         // resta dentro l’altezza visibile
                display: "flex",
                flexDirection: "column",
                margin: theme.spacing(1.5), // respiro dai bordi su mobile
            },

            // titolo sticky così resta visibile durante lo scroll
            "& .MuiDialogTitle-root": {
                position: "sticky",
                top: 0,
                zIndex: 1,
                backgroundColor: bg,
                paddingBottom: theme.spacing(1),
            },

            // contenuto scrollabile, padding conservato
            "& .MuiDialogContent-root": {
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(2),
                overflowY: "auto",
                paddingTop: theme.spacing(2),
                paddingBottom: theme.spacing(2),
                flex: "1 1 auto",
            },
        };
    }
);

export default function ExportConfrontatoreRoot({
    children,
    open,
    onClose,
    ownerState,
}: ExportConfrontatoreRootProps) {
    const { loading } = ownerState || {};

    return (
        <StyledDialog
            PaperProps={{ 'data-tour': 'comp-export2' }}
            open={open}
            onClose={onClose}
            ownerState={ownerState}
            className="z-index-50 text-center"
            disableScrollLock
        >
            <DialogTitle>Esporta confrontatore</DialogTitle>

            {/* se vuoi ripristinare il loading “bloccante”, togli i commenti qui sotto
            {loading ? (
              <DialogContent className="flex flex-col justify-evenly items-center h-full w-full">
                <div>
                  <h2>Preparando il file richiesto</h2>
                  <h2>L'operazione potrebbe richiedere qualche istante</h2>
                </div>
                <div className="flex justify-center items-center h-full w-full">
                  <Loader />
                </div>
              </DialogContent>
            ) : ( */}
                <DialogContent className="flex flex-col justify-between h-full">
                    {children}
                </DialogContent>
        </StyledDialog>
    );
}
