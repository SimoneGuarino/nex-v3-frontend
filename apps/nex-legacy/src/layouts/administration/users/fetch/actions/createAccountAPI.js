import { FetchData } from '../../../../../examples/Fetch/fetchCredentials';

export function CreateAccountAPI(newUserData, setCAStatus, setSuccess, abortController, openErrorSB, userContext, setLoadingBtnStatus) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_AUTH + '77ao5hyFgAikQYV0/gJMLax', 'POST', {
        tk: userContext.token,
        nm: newUserData.Nome,
        lnm: newUserData.Cognome,
        usr: newUserData.Email.toLowerCase(),
        psw: newUserData.Password,
    }, abortController).then(_ => {
        setCAStatus(false);
        setSuccess(true);
        setLoadingBtnStatus(false);
    }).catch(error => {
        console.error(error);
        setLoadingBtnStatus(false);
        openErrorSB('error', 'Sembra che ci siano problemi nel contattare il server.. Riprova tra qualche minuto.');
    });
}