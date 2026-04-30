import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function PaymentsMethodAPI({userContext, abortController, setData} : 
    {userContext: UserContext, abortController: any; setData: (prev: any) => void}): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
    }

    FetchData(`${import.meta.env.VITE_API_CUSTOMERSFIDO}gt-pymt`, 'POST', bodyToSend, 
    abortController).then(async (res: any) => {
        setData(res.pym)
    }).catch((error: any) => {
        console.error(error)
    });
}