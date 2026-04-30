import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function DataAPI({userContext, abortController, setData, filters, setTableLoad, setColumns} : {
userContext: UserContext, abortController: any; setData: (prev: any) => void, 
filters: {cdp: string; cdl: string}, setTableLoad: (prev: boolean) => void; setColumns: (prev: any) => void}): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {
        ...filters
    };
    if(userContext){
        bodyToSend.tk = userContext.token;
    }

    FetchData(`${import.meta.env.VITE_API_SEARCH_ENDPOINT}sales/data`, 'POST', bodyToSend, 
    abortController).then(async (res: any) => {
        if(res){
            let columnsToCheck = [{ key: 'Qta scaglione da 1', exist: false }, { key: 'Qta scaglione a 1', exist: false }];
            //ricerca se almeno 1 dato ha la proprietà in analisi in modo da cambiare stato nell'oggetto di riferimento nel caso in cui è true.
            res.map((data: any) => {
                return columnsToCheck.forEach((item: any , index: number) => data[item.key] != undefined ? columnsToCheck[index].exist = true : false);
            });

            //Applica le modifiche allo stato dele colonne in base a quanto trovato
            columnsToCheck.forEach((item: {key: string; exist: boolean}) => {
                if(item.exist){
                    return setColumns((prev: any) => {
                        const copy = [...prev];
                        copy.splice(6, 0, { key: item.key, label: item.key, sort: true, sortType: "String", type: 'default', width: 150, labelsx: { align: 'center' } })
                        return copy;
                    });
                }else{
                    return setColumns((prev: any) => {
                        const copy = [...prev];
                        const y = copy.findIndex((colum: {key: string}) => colum.key === item.key);
                        if(y !== -1){
                            copy.splice(y, 1);
                        }
                        return copy;
                    });
                };
            });

            console.log(columnsToCheck)
            setData(res);
        };
        setTableLoad(false);
    }).catch((error: any) => {
        console.error(error)
    });
}