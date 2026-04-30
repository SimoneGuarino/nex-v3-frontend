import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: { username: string;};
    token: string;
}
interface distSelectedProps {
    name: string;
    idIndexOfValue?: number;
    toIncrese?: number;
    toDecrease?: number;
}
interface dataToInsertProps {
    brandSelected: { Marca: string, PrefissiFornitore: Array<object> } | null;
    categorySelected: any;
    subcategorySelected: any;
    distSelected: Array<distSelectedProps>;
    [key: string]: any;
}

export function SaveConditionAPI({userContext, abortController, dataToInsert, tp} : 
    {userContext: UserContext, abortController: any, dataToInsert: dataToInsertProps; tp?: number}): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}suppliers/cr/scn`, 'POST', {
        tk: userContext.token,
        dt: dataToInsert,
        tp: tp
    }, abortController).then(async (res: any) => {
    }).catch((error: any) => {
        //openErrorSB('info', 'Sembra che ci sia stato un problema nel salvataggio della nuova configurazione, contatta il supporto tecnico');
        console.error(error)
    });
}