import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';
import { UserState } from 'types/UserContext';


interface FindOrderAPIProps {
    userContext: UserState,
    abortController: any;
    csc: string;

    setGeneralDataOrders: (prev: any) => void;
    setOnLoad: (prev: boolean) => void;
    onFbSearchErrorDuringTour?: () => void;
    handleComplete?: (data: { groupData: any }) => void;
};

export function CustomersOrdersAPI({ userContext, abortController, csc, setGeneralDataOrders,
    setOnLoad, onFbSearchErrorDuringTour, handleComplete }: FindOrderAPIProps): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_ORDER}fb/extbdg/gt-cm-dt`, 'POST', {
        tk: userContext.token,
        csc: csc,
    }, abortController).then(async (res: any) => {
        if (res && res.dati && Array.isArray(res.dati) && res.dati.length > 0) {
            setGeneralDataOrders(res);
            handleComplete && handleComplete({ groupData: res});
        } else {
            onFbSearchErrorDuringTour?.();
            enqueueSnackbar("Al momento questo cliente non sembra avere FB da poter richiedere per lo sblocco, per favore riprova piu tardi", {
                title: 'Fb non presenti',
                type: 'warning',
            });
        };

        return setOnLoad(false);
    }).catch((error: any) => {
        setOnLoad(false);
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema nel trovare l'ordine, perfavore contatta l'assistenza";
            if (error && error?.msg) { error_ = error.msg; };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
};