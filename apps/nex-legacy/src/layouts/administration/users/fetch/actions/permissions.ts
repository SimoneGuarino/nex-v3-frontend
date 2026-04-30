import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function SaveRoutePermissionsAPI({userContext, abortController, userTarget, prmw, setSuccess} : 
    {userContext: UserContext, abortController: any; userTarget: string, prmw: any, setSuccess: (prev: boolean) => void}): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
        bodyToSend.usrt = userTarget;
        bodyToSend.prmw = prmw;
    }

    FetchData(`${import.meta.env.VITE_API_ADMIN}requests/users/prmr/4nx0agneqqeep2c98l7t`, 'POST', bodyToSend, 
    abortController).then(async (res: any) => {
        setSuccess(true);
    }).catch((error: any) => {
        console.error(error)
    });
}