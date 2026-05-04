//src\utils\checkAdminPermissions.ts
interface NumberToEuroProp {
    userRole: string | undefined | null;
    permissions: any;
    panelToCheck: string;
    where?: 0 | 1;
    rolesToCheck?: number[];
}

function CheckRoleAdmin({ role, rolesToCheck }: { role: string; rolesToCheck: any }) {
    const rolesToCheck_ = rolesToCheck;

    const convertRoleNumberToString = JSON.parse((import.meta.env.VITE_ROLES as string));

    for (let i = 0; i < rolesToCheck_.length; i++) {
        const roleFromArr_ = rolesToCheck_[i];
        if (role === (convertRoleNumberToString as any)[roleFromArr_]) {
            return true
        } else { continue };
    }

    return false //Boolean(role === 'Admin' || role === 'Dev');
};

/**
 * Funzione dedicata al controllo del ruolo se attivo sul pannello in fase di controllo, in modo 
 * da consentire (o non) il popup di elementi per dev/admin.
 * @param userRole String | Nome del ruolo attualmente in uso dall'utente.
 * @param permissions Object | Permessi utente ricevuti dal back
 * @param panelToCheck String | Chiave del pannello per cui si sta facendo il controllo 
 * @param where Number | 0 = Focelda ___ 1 = IOT
 * @param rolesToCheck inserisci in un array i numbers role che vuoi che subiscano un controllo se nei permessi o il ruolo utente
 * risulterà essere come i numbers inseriti in questo array la funzione restituirà true.
 * @returns se è un admin o dev il return è true.
 */
export function CheckAdminPermissions({ userRole, permissions, panelToCheck, where = 0, rolesToCheck }: NumberToEuroProp): boolean {
    //prendi in considerazione i ruoli passati in modo da stabilire il Target Ruoli oppure
    //utilizza quelli di default ovvero 0 & 1.
    if(!userRole) return false; // se non c'è un ruolo definito, non mostriamo i contenuti admin

    const rolesToCheck_ = rolesToCheck !== undefined ? rolesToCheck : [0, 1];

    if (Boolean(permissions && panelToCheck && where !== undefined)) {
        const convertWhere = ['Focelda', 'IOT'];
        const panel = permissions[panelToCheck];
        console.log("Checking permissions for panel:", panelToCheck, "where:", convertWhere[where], "with permissions:", panel);
        if (panel) {
            const permissionField = panel[convertWhere[where]];
            if (!permissionField) { console.error('Sembra che il pannello non abbia trovato il permesso correlato.') };
            if (permissionField.status && permissionField.role) {
                for (let i = 0; i < rolesToCheck_.length; i++) {
                    const roleFromArr_ = rolesToCheck_[i];
                    if (permissionField.role === roleFromArr_) {
                        return true
                    } else { continue };
                }
            };
        };
    };

    return CheckRoleAdmin({ role: userRole, rolesToCheck: rolesToCheck_ });
};

export { CheckRoleAdmin };