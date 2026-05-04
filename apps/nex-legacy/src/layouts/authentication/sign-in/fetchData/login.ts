import { FetchData } from 'examples/Fetch';
import { SaveCookie } from 'utils/cookie';
import SendLogs from 'logs/index';
import { DecryptAES } from 'utils/crypt/EncryptAES';
import { RemoveSessions } from 'classes/log-out';
import { enqueueSnackbar } from 'components/MessageBox';



interface SearchItemAPIProps {
    username: string;
    psw: string;
    abortController: any;
    rememberMe: boolean
    setUserContext: (prev: any) => void;
    setIsSubmitting: (prev: boolean) => void;
}


export function Login({ username, psw, abortController, rememberMe, setUserContext, setIsSubmitting }: SearchItemAPIProps): void {
    FetchData(`${import.meta.env.VITE_API_API_ENDPOINT}hNz5S3AxgzodGuzD/hdaa1A`, 'POST', {
        usr: username,
        pdd: psw
    }, abortController).then(async (response) => {
        const aes = response.sct.ae;
        const rsa = response.sct.ra
        const vi = response.sct.ve

        const rsa_ = await DecryptAES(rsa, aes, vi)
        const tk = await DecryptAES(response.sct.tk, aes, vi)
        
        setUserContext((prev: any) => {
            SendLogs(response.token, "Log-in", window.location.href.toString())
            return { ...prev, token: tk };
        });


        //salvataggio dei cookie e delle sessioni.
        if(rememberMe){
            localStorage.setItem("token", tk)
        }else{ 
            sessionStorage.setItem("token", tk) 
        };

        SaveCookie({ name: 'aes', data: aes });
        SaveCookie({ name: 'rsa', data: rsa_ });
        SaveCookie({ name: 'vi', data: vi });

    }).catch((error: any) => {
        console.error(error);
        RemoveSessions();
        setIsSubmitting(false);

        let error_ = "Sembra che ci sia stato un problema generale nel log-in, perfavore contatta un tecnico."
        if(error && (error?.msg || error?.message?.msg)){    error_ = (error.msg || error.message?.msg);     };
        console.log(error_);
        return enqueueSnackbar(error_, {
            title: 'Ops..',
            type: 'error',
        });
    });
}