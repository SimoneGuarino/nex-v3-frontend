import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';
import { UserState } from 'types/UserContext';


interface SearchParam {
    stato?: any;
    com?: object;
    dateRange?: {
        da: any;
        a: any;
    } | null;
}
interface ChronoAPIProps {
    userContext: UserState,
    abortController: any;
    searchParam?: SearchParam;
    ofs: any;

    setTableTotalData: (prev: number) => void;
    setTableEuroTotal: (prev: number) => void;
    setErr: (prev: boolean) => void;
    setOnLoad: (prev: boolean) => void;
    setData: (prev: any) => void;
};

export function ChronoAPI({ userContext, abortController, setData,
    setErr, setOnLoad, searchParam, setTableTotalData, setTableEuroTotal, ofs }: ChronoAPIProps): void {
    if (userContext.details === undefined) { return; }

    let filters = { tk: userContext.token, ofs: 0, fsc: true };

    if (searchParam) {
        if (searchParam.stato != null) {
            Object.assign(filters, { stato: searchParam.stato });
        };
        if (searchParam.dateRange) {
            Object.assign(filters, { dateRange: searchParam.dateRange });
        };
    };

    FetchData(`${import.meta.env.VITE_API_ORDER}fb/extbdg/gt-rq`, 'POST', filters, abortController).then(async (res: any) => {
        setData(res.data);
        if (res && res?.total != null) {
            setTableTotalData(res.total);
        };
        if (res && res?.euroTotal !== null) {
            setTableEuroTotal(res.euroTotal);
        };
        ++ofs.current;
        setOnLoad(false);
    }).catch((error: any) => {
        setOnLoad(false);
        setErr(true);
        
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema nel recuperare i dati della cronologia, perfavore contatta l'assistenza"
            if (error && error?.msg) { error_ = error.msg; };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}