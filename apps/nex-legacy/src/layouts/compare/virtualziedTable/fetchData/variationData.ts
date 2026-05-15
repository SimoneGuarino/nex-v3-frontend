import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';
import { UserContextTypes } from 'types/user';


interface DataAPIProps {
    userContext: UserContextTypes;
    abortController: any;
    _distributor: string;
    id_prodotto: string;
    setData: (prev: any) => void;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
}


export async function VariationDataAPI({ userContext, abortController, _distributor, id_prodotto, setData, ChangeLoadStatus }: DataAPIProps) {
    if (userContext.details === undefined) { return; }

    if (!userContext.token) {
        console.error("User token is missing");
        return enqueueSnackbar("Sembra che tu non sia loggato, per favore effettua il login.", {
            title: 'Ops..',
            type: 'error',
        });
    };

    return await FetchData(`${import.meta.env.VITE_API_PRODUCTS}variation/history?dist=${_distributor}&idp=${id_prodotto}`, 'GET', null, abortController).then((res: any) => {
        if (res && Array.isArray(res) && res.length > 0) {
            setData(res);
        };
        return ChangeLoadStatus({ from: 'variance', bool: false });
    }).catch((errorState: any) => {
        ChangeLoadStatus({ from: 'variance', bool: false });
        if (errorState.name !== 'AbortError') {
            let error_ = "";
            const error: string | { [key: string]: string } | undefined = errorState?.message;
            console.error(errorState);
            if (error) {
                if (typeof error === 'string') {
                    error_ = (error as any).message;
                } else if (error !== undefined && error?.msg) {
                    error_ = error.msg;
                };
            };

            if (!error_ || error_.trim() == "") {
                error_ = "Sembra che ci sia stato un problema nel retrive dei dati nella tabella, per favore contatta un tecnico."
            };

            if (errorState.status !== 404) {
                return enqueueSnackbar(error_, {
                    title: 'Ops..',
                    type: 'error',
                });
            } else {
                setData([]);
            }
        };
    });
};