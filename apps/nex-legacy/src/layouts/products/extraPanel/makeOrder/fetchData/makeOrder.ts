import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function MakeOrderAPI({userContext, abortController, objectToSend, openErrorSB, 
    SuccessOperation} : 
{userContext: UserContext, abortController: any, objectToSend: Object, 
openErrorSB: (icon: string, message: string) => void; SuccessOperation: () => void;}): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.username = userContext.details.username;
        bodyToSend.tk = userContext.token;
        bodyToSend.ots = objectToSend;
    }

    FetchData(`${import.meta.env.VITE_API_PRODUCTS}pds/crt_ord`, 'POST', bodyToSend, 
    abortController).then(async _ => {
        SuccessOperation();
    }).catch((error: any) => {
        openErrorSB('info', "Sembra che ci sia stato un problema, nell'invio carrello, perfavore riprova tra un istante o contatta un tecnico. ");
        console.error(error)
    });
}