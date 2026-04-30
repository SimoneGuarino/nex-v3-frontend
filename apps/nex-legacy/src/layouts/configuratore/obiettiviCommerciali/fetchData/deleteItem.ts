import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};



interface DeleteRowAPIProps {
    userContext: UserContext;
    abortController: any;
    item: any;
    tp: 0 | 1 | 2;
};
export function DeleteRowAPI({ userContext, abortController, item, tp}: DeleteRowAPIProps): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}agttgt/conf/dl-dt`, 'POST', {
        tk: userContext.token,
        tp: tp,
        dt: item,
    }, abortController).then((_: any) => {
        enqueueSnackbar(_.msg, {
            title: '',
            type: 'success',
        });
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che non è stato possibile cancellare la configurazione, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}