import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';
import { UserState } from 'types/UserContext';


interface SearchParam {
    stato: any;
    com: string | null;
    amm: string | null;
    cli: string | number | null;
    dateRange: {
        da: any;
        a: any;
    } | null;
};
interface FindOrderAPIProps {
    userContext: UserState,
    abortController: any;
    searchParam?: SearchParam;
    ofs: any;

    setErr: (prev: boolean) => void;
    setOnLoad: (prev: boolean) => void;
    setTableData: (prev: any) => void;
    setTableTotalData: (prev: number) => void;
    setTableEuroTotal: (prev: number) => void;
};

export function TableDataAPI({ userContext, abortController, setTableData,
    setErr, setOnLoad, setTableTotalData, setTableEuroTotal, searchParam, ofs }: FindOrderAPIProps): void {
    if (userContext.details === undefined) { return; }

    let filters = { ofs: 0, tk: userContext.token, stato: 0, fsc: true };

    if (searchParam) {
        if (searchParam.stato != null) {
            Object.assign(filters, { stato: searchParam.stato });
        };
        if (searchParam.amm) {
            Object.assign(filters, { amm: searchParam.amm });
        };
        if (searchParam.com) {
            Object.assign(filters, { com: searchParam.com });
        };
        if (searchParam.cli) {
            Object.assign(filters, { cli: searchParam.cli });
        };
        if (searchParam.dateRange) {
            Object.assign(filters, { dateRange: searchParam.dateRange });
        };
    };

    FetchData(`${import.meta.env.VITE_API_ORDER}fb/extbdg/gt-rq`, 'POST', filters, abortController).then(async (res: any) => {
        setTableData(res.data);
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
            let error_ = "Sembra che ci sia stato un problema nel comunicare con il server, perfavore contatta l'assistenza"
            if (error && error?.msg) { error_ = error.msg; };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}