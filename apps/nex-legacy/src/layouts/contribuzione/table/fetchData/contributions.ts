import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

interface ContributionProps {
    userContext: UserContext,
    abortController: any;
    contributionsPersonalList: any;
    setContributionsList_Base: (prev: any) => void;
}

export function ContributionAPI({ userContext, abortController, contributionsPersonalList,
    setContributionsList_Base }: ContributionProps): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if (userContext) {
        bodyToSend.tk = userContext.token;
    }

    FetchData(`${import.meta.env.VITE_API_PRODUCTS}contribution/gt-ctb`, 'POST', bodyToSend,
        abortController).then(async (res: any) => {
            contributionsPersonalList.current = res;
            setContributionsList_Base(res);
        }).catch((error: any) => {
            if (error.name !== 'AbortError') {
                console.error(error)
                enqueueSnackbar('Sembra che ci sia stato un problema nel retrive dei dati contribuzione, contatta il supporto tecnico', {
                    title: 'Ops.. Errore in risposta dal server',
                    type: 'error',
                });
            };
        });
}