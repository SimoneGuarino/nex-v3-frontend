import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};



interface InsertConfigAPIProps {
    userContext: UserContext;
    abortController: any;
    sendObj: {[key: string | number]: string }
    SuccessInsert: () => void;
};
export function InsertConfigAPI({ userContext, abortController, sendObj, SuccessInsert}: InsertConfigAPIProps): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}/agttgt/conf/ins`, 'POST', {
        tk: userContext.token,
        dt: sendObj,
    }, abortController).then((_: any) => {
        enqueueSnackbar(_.msg, {
            title: '',
            type: 'success',
        });
        SuccessInsert();
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che non è stato possibile inserire la configurazione, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}