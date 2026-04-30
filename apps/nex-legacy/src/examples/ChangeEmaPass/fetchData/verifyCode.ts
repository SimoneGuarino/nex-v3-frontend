import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface VerifyCodeAPIProps {
    abortController: any;
    mail: string;
    rcode: string;
    handleComplete: () => void;
    ChangeLoadStatus: ({ from, bool }: { from: "sendEmail" | "checkVCode"; bool?: boolean }) => void;
};

export function VerifyCodeAPI({abortController, mail, rcode, handleComplete, ChangeLoadStatus } : VerifyCodeAPIProps): void {
    FetchData(`${import.meta.env.VITE_API_USERS}users/verify-code`, 'POST', {
        mail: mail,
        rcode: rcode
    }, 
    abortController).then(async (_: any) => {
        if(ChangeLoadStatus !== undefined){
            ChangeLoadStatus({ from: 'checkVCode', bool: false });
        };
        handleComplete();
    }).catch((error: any) => {
        console.log(error);
        enqueueSnackbar("Ops sembra che ci sia un problema con il tuo codice, perfavore inserisci un codice valido.", {
            title: 'Ops..',
            type: 'warning',
        });
    });
}