import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';
import SendLogs from 'logs/index';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}


interface DataAPIProps {
    userContext: UserContext;
    abortController: any;
    pswd: string;
    rcode: string;
    mail?: string;
    handleComplete: () => void;
    ChangeLoadStatus: ({ from, bool }: { from: "changePassword"; bool?: boolean }) => void;
}


export function ResetPasswordAPI({ userContext, abortController, pswd, rcode, mail, handleComplete, ChangeLoadStatus }: DataAPIProps): void {
    if ((userContext && userContext?.details === undefined) && (!mail || mail == undefined || mail == "")) { return; }

    let objToSend = {
        mail: mail ? mail : userContext?.details?.username,
        pswd: pswd,
        rcode: rcode
    };

    if(userContext && userContext.token !== undefined){
        Object.assign(objToSend, { tk: userContext.token })
    };

    FetchData(`${import.meta.env.VITE_API_USERS}users/change-password`, 'POST', objToSend, abortController).then((res: any) => {
        ChangeLoadStatus({ from: 'changePassword', bool: false });
        handleComplete();
    }).catch((error: any) => {
        enqueueSnackbar("Sembra che per il momento sia impossibile inviare l'email di reset password, perfavore contatta un tecnico, o riprova piu tardi.", {
            title: 'Ops..',
            type: 'error',
        });
        console.error(error)
    });
}