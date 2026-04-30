import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};

export async function SearchUsersAPI({userContext, abortController, sstr, setHintData, setLoadBool} : 
{ userContext: UserContext; abortController: any; sstr: string; setHintData?: (prev: any) => void; setLoadBool?: (prev: boolean) => void;}): Promise<any> {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
        bodyToSend.sstr = sstr;
    }

    return await FetchData(`${import.meta.env.VITE_API_CHAT}chats/tj8c7iywkj09pn4jf4cx`, 'POST', bodyToSend, 
    abortController).then((res: any) => {
        if (setHintData) setHintData(res);
        if (setLoadBool) setLoadBool(false);
        return res;
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            if (setLoadBool) setLoadBool(false);
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema nel retrive dei dati nella tabella, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}