
// routes
import routes from '../routes';
import PermissionMoudle from '../classes/permission';
const Permission = new PermissionMoudle();

interface NumberToEuroProp {
    userContext: any
    panelToCheck: string;
}
/**
 * Funzione dedicata al controllo del ruolo se attivo sul pannello in fase di controllo, in modo 
 * da consentire o meno il popup di elementi per dev/admin.
 * @param permissions Object | Permessi utente ricevuti dal back
 * @param panelToCheck String | Chiave del pannello per cui si sta facendo il controllo 
 * @param rolesToCheck inserisci in un array i numbers role che vuoi che subiscano un controllo se nei permessi o il ruolo utente
 * risulterà essere come i numbers inseriti in questo array la funzione restituirà true.
 * @returns se è un admin o dev il return è true.
 */
export function CheckAllowedRoutes({ userContext, panelToCheck }: NumberToEuroProp): boolean {
    //prendi in considerazione i ruoli passati in modo da stabilire il Target Ruoli oppure
    //utilizza quelli di default ovvero 0 & 1.
    const routesToCheck = (Permission as any).RouteToShow(userContext.details.ruolo, routes,
        userContext.details.username, userContext.details.permissions).Data.filter((e: any) => !e.ref_type);
    //se almeno uno dei due è abilitato allora return true se no fai return false.
    for (let i = 0; i < panelToCheck.length; i++) {
        const panel = panelToCheck[i];
        const findIndex = routesToCheck.findIndex( (x : any) => x.key == panel );
        if(findIndex !== -1){
            return true;
        }else{ continue };
    }
    return false;
};