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
    mail?: string;
    abortController: any;
    NextStep: () => void;
    ChangeLoadStatus: ({ from, bool }: { from: "sendEmail" | "checkVCode"; bool?: boolean }) => void
    setTimeReSendMail: (prev: Date) => void;
}


export function SendEmailAPI({ userContext, mail, abortController, NextStep, ChangeLoadStatus, setTimeReSendMail}: DataAPIProps): void {
    if ((userContext && userContext?.details === undefined) && (!mail || mail == undefined || mail == "")) { return; }

    let objToSend = {mail: mail ? mail : userContext?.details?.username};
    if(userContext && userContext.token !== undefined){
        Object.assign(objToSend, { tk: userContext.token })
    }

    FetchData(`${import.meta.env.VITE_API_USERS}users/request-password-change`, 'POST', objToSend, abortController).then((res: any) => {
        NextStep();
        if (userContext) {
            SendLogs(userContext.token, "Change Password", window.location.href.toString());
        };
        ChangeLoadStatus({ from: 'sendEmail', bool: false });
    }).catch((error: any) => {
        console.log(error);
        enqueueSnackbar(error.message.msg, {
            title: 'Ops..',
            type: 'error',
        });
        if(error.message && error.message?.scadenza !== undefined){
            setTimeReSendMail(error.message?.scadenza);
        }
        ChangeLoadStatus({ from: 'sendEmail', bool: false });
    });
}