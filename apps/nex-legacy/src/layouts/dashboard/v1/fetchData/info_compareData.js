import { FetchData } from '../../../examples/Fetch';
import SanitizeModule from '../../../classes/sanitize';
const Sanitize = new SanitizeModule();

export async function InfoCompareData(userContext, setUserContext, setNumToElaborateProducts, abortController, DeleteFromLoadRef) {
    if(!userContext.token || userContext.details === undefined){return;}
    const role = userContext.details.ruolo

    //sanifica l'username 
    const username = Sanitize.email(userContext.details.username)
    if (!username.Success) { throw new Error(username.Message) }

    await FetchData(import.meta.env.VITE_API_USERS + 'dashboard/read/JHbokWNPjS2Sr56fJDaI?skip=0&disp=1&dfval=-0.1&dfcat=0', 'POST', {
        userRole: role,
        username: username.Data,
        tk: userContext.token,
    }, abortController).then(res => {
        setNumToElaborateProducts(() => {
            return {
                highter: res.focPriceHighter,
                lower: res.focPriceLower,
                exclution: res.focTotalExclutions,
                totale: res.focTotalProducts
            }
        });
        DeleteFromLoadRef("compare");
    }).catch(error => {
        console.error(error);
        DeleteFromLoadRef("compare");
    });
}