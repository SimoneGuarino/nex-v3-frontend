import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../examples/Fetch';

interface SafeUserContext {
    token?: string;
    details?: {
        ruolo?: string;
        permissions?: string[];
    };
}

interface FbUserResponse {
    Data: any[];
}

export function FbUserData(userContext: SafeUserContext,
    abortController: AbortController | null,
    setData: React.Dispatch<React.SetStateAction<any[]>>) {

    if (!userContext.token) return;

    // Creo un controller valido
    const controller = abortController ?? new AbortController();


    FetchData(import.meta.env.VITE_API_ORDER + 'orders/fb-pisagn', 'POST', {
        tk: userContext.token,
    }, controller)
        .then((res: FbUserResponse) => {
            setData(() => res.Data)
        })
        .catch((error: any) => {
            if (error.name !== 'AbortError') {
                console.error(error);
                let error_ = "Sembra che ci sia stato un problema nel recuperare dei dati, perfavore contatta l'assistenza"
                if (error && error?.msg) { error_ = error.msg; };
                return enqueueSnackbar(error_, {
                    title: 'Ops..',
                    type: 'error',
                });
            };
        })
}