import { FetchData } from '../../../../../../examples/Fetch';

export function ChangeRoleAPI(target_username, userContext, selectedRole, abortController, 
    setData, setChangeRoleMenu, setSuccess, openErrorSB) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_ADMIN + 'update/2cyr6hh2eo9wcpexkzt3', 'POST', {
        cturm: target_username,
        ctrl: selectedRole,
        tk: userContext.token,
    }, abortController).then(_ => {
        setChangeRoleMenu(false);
        //change the value inside the data array where target_username = username
        setData(prev => {
            const copy = [...prev];
            const indexUser = copy.findIndex(e => e.username === target_username);
            copy[indexUser].role = [selectedRole];
            console.log(copy)
            return copy
        });
        setSuccess(true);
    }).catch(error => {
        console.error(error)
        openErrorSB('error', 'Sembra che ci siano problemi nel contattare il server.. Riprova tra qualche minuto.');
    });
}