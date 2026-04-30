import { FetchData } from '../../../../../examples/Fetch';

export function BanAPI(target_username, userContext, banStatus, setBanStatus, abortController, 
    openErrorSB) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_ADMIN + 'update/i0mfa00xka3s9ve19g75', 'POST', {
        cturm: target_username,
        bnsts: banStatus,
        tk: userContext.token,
    }, abortController).then(_ => {
        setBanStatus(() => { return !banStatus })
        //setSuccess(true);
    }).catch(error => {
        console.error(error)
        openErrorSB('error', 'Sembra che ci siano problemi nel contattare il server.. Riprova tra qualche minuto.');
    });
}