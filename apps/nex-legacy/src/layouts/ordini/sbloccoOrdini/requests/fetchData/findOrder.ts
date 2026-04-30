import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';
import { UserState } from 'types/UserContext';


interface FindOrderAPIProps {
    userContext: UserState,
    abortController: any;
    nord: string;
    only_tb_dt?: null | boolean;

    setGeneralData: (prev: any) => void;
    setErr: (prev: boolean) => void;
    setOnLoad: (prev: boolean) => void;
    setTableData: (prev: any) => void;
    handleComplete?: (data: { singleData: any }) => void;
};

export function FindOrderAPI({ userContext, abortController, setGeneralData, setTableData,
    setErr, setOnLoad, nord, only_tb_dt, handleComplete }: FindOrderAPIProps): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_ORDER}fb/extbdg/gt-dt`, 'POST', {
        tk: userContext.token,
        nord: nord,
        only_tb_dt: only_tb_dt,
    }, abortController).then(async (res: any) => {
        if (res) {
            setGeneralData(res);
            setTableData(res.dati);
            setOnLoad(false);
            handleComplete && handleComplete({ singleData: res });
        };
    }).catch((error: any) => {
        if (error.name !== "AbortError") {
            setOnLoad(false);
            console.error(error.name, error);
            let error_ = "Sembra che ci sia stato un problema nel trovare l'ordine, perfavore contatta l'assistenza";
            if (error && error?.message) { error_ = error.message; };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
};

interface ExitinigOrderAPIProps {
    userContext: UserState,
    abortController: any;
    nord: string;

    setErr: (prev: boolean) => void;
    setFBAlreadyInRequest: (prev: any) => void;
};

export function ExitinigOrderAPI({ userContext, abortController, setFBAlreadyInRequest,
    setErr, nord }: ExitinigOrderAPIProps): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_ORDER}fb/extbdg/ex-rq`, 'POST', {
        tk: userContext.token,
        fbc: nord,
    }, abortController).then(async (res: any) => {
        if (res) {
            setFBAlreadyInRequest(res.exists);
        };
    }).catch((error: any) => {
        if (error.name !== "AbortError") {
            setErr(true);
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema nel controllare l'ordine, perfavore contatta l'assistenza"
            if (error && error?.msg) { error_ = error.msg; };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        }
    });
};