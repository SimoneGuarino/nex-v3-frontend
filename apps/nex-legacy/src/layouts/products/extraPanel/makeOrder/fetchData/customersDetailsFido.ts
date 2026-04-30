import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function CustomersFidoDetailsAPI({userContext, abortController, setData, clientSelected, setLoadData, openErrorSB,
    setClientSelected
} : 
{userContext: UserContext, abortController: any; setData: (prev: any) => void, clientSelected: any, 
setLoadData: (prev: boolean) => void; openErrorSB: (icon: string, message: string) => void;
setClientSelected: (prev: any) => void}): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
        bodyToSend.csm = clientSelected.CodiceCliente.Focelda ? clientSelected.CodiceCliente.Focelda :
        clientSelected.CodiceCliente.IOT;
    };

    if(!bodyToSend.csm){ return console.error('sembra che questo cliente non abbia un codice cliente'); }

    FetchData(`${import.meta.env.VITE_API_SEARCH_ENDPOINT}pds/fd_dt`, 'POST', bodyToSend, 
    abortController).then(async (res: any) => {
        if(res && res.Data){
            setData(() => {
                return {
                    stato: res.Data.stato,
                    totale: res.Data.totale,
                    residuo: res.Data.residuo
                };
            });
        };

        setLoadData(false);
    }).catch((error: any) => {
        setLoadData(false);
        setClientSelected(null);
        if(error.name !== "AbortError"){
            openErrorSB('info', 
            'Ops, sembra che ci sia statuo un problema perfavore contatta un tecnico o riprova piu tardi.');
        };
    });
};