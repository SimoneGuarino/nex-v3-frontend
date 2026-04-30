import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function UserRoutesAPI({userContext, abortController} : 
    {userContext: UserContext, abortController: any; }): void {
    if (userContext.details === undefined) { return; }

    FetchData(`${import.meta.env.VITE_API_USERS}routes`, 'POST', {
        tk: userContext.token
    }, 
    abortController).then(async (res: any) => {
        console.log(res);
    }).catch((error: any) => {
        //openErrorSB('info', 'Sembra che ci sia stato un problema nel retrive dei dati nella tabella, contatta il supporto tecnico');
        console.error(error)
    });
}