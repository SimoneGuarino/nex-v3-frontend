// src/layouts/pesiVolumi/fetchData/saveData.ts
import { FetchData } from '../../../examples/Fetch';
import SendLogs from '../../../logs';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};

interface SearchItemAPIProps {
    userContext: UserContext;
    abortController: any;
    tp: number;
    dataToSave?: object;
};

export function SaveDataAPI({
    userContext,
    abortController,
    tp,
    dataToSave
}: SearchItemAPIProps): void {
    // lato BE il token arriva dall'header (gestito da FetchData)
    if (userContext.details === undefined) { return; }

    FetchData(
        `${import.meta.env.VITE_API_LOGISTICS}wgtvlm/ed/prd`,
        'POST',
        {
            tp: tp,
            dataToSave: dataToSave
        },
        abortController
    ).then(() => {
        // Invia il log dell'azione compiuta dall'utente.
        SendLogs(
            userContext.token || "Unknown",
            `${tp == 0 ? 'Add Products in Pesi&Volumi' : 'Delete Products in Pesi&Volumi'}`,
            window.location.href.toString()
        );
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che il sistema abbia riscontrato un problema nel salvataggio dell'elemento, perfavore contatta un tecnico.";
            if (error && (error?.msg || error?.message)) {
                error_ = (error.msg || error.message);
            }
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}
