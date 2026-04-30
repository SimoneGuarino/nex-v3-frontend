import sanitizeModule from "./sanitize.js";
const Sanitize = new sanitizeModule();

/** SANITIZE CLASS
 * 
 * Use this class to sanitize and validate inputted data
 * 
 * @return {Object} Success: true/false | Message: error message | 
 * Data: empty if failed, validated and sanitized output string if passed
**/

const routesForAll = ['dashboard', 'sign_in', 'profile',
    'community', 'post', 'create_post', '404']
//Ogni Nome deve corrispondere al index inserito sul group della proprietà delle route.
const RouteTitledDividerNames = ['Strumenti', 'Amministra'];

class Permission {

    /** Route || Request Route to show in the SideNavbar
     * 
     * @param role Inputted user role as a string and get back what he should see
     * @param routeList Inputted route list, in output the clean list for the account
     */
    RouteToShow(role, routeList, username, routesAllowedFromDB) {
        let res = { Success: false, Data: {} };

        const roleSNIT = { Data: role };
        //if (!roleSNIT.Success) { throw new Error('Sembra che ci sia un problema, contatta un tecnico') }

        try {
            /**
             * Logica dedicata all'estrazione delle routes dagli elementi nested 
             * in modo tale da generare correttamente le varie routes.
             */


            const route_elaborated = [];
            for (let i = 0; i < routeList.length; i++) {
                const e = routeList[i];
                if (e.type === 'nested') {
                    for (let y = 0; y < e.nested.elements.length; y++) {
                        const x = e.nested.elements[y];
                        route_elaborated.push(x)
                    }
                }
                route_elaborated.push(e)
            }

            if (roleSNIT.Data != undefined && roleSNIT.Data != null) {
                let routeAllowed = [];

                function setResponseData({ admin }) {
                    //_______________________________________________________________________________________
                    /**
                     * Condizione che permette di gestire il periodo di prova per Quotazioni
                     */
                    let extraRoutes = [];
                    if([
                        // Dev
                        "ldilello@focelda.it",
                        "support@focelda.it",
                        "gbrosca@focelda.it",
                        "grizzo@iottecnologie.it",
                        "fdimurro@iottecnologie.it",
                        "sguarino@iottecnologie.it",

                        // Buyers
                        "dpalmese@focelda.it",
                        "apalmese@focelda.it",
                        "rdeteschi@focelda.it",
                        "atombolesi@focelda.it",
                        "ssansone@focelda.it",
                        "vdifrancesco@focelda.it",
                        "rbrancaccio@focelda.it",
                        "mabitante@focelda.it",
                        "borriello@focelda.it",

                        // Commerciale
                        "jbenvegnu@focelda.it",
                        "ramona@focelda.it",
                        "cborghesi@focelda.it",
                        "scovella@focelda.it",
                        "mag@focelda.it",
                        "locasto@focelda.it",
                        "spizzuti@focelda.it",
                        "svegetti@focelda.it",
                    ].includes(username) && ['Buyer', 'Commerciale'].includes(roleSNIT.Data)) {
                        extraRoutes = ['quotazioni', 'commerciale']
                    };
                    //_______________________________________________________________________________________

                    res.Success = true;
                    res.Data = route_elaborated.filter(elm => {
                        const condition = admin ? (elm.type === 'divider_ADM' || elm.type === 'title_ADM' || elm.type === 'divider' || elm.type === 'title')
                            : (elm.type === 'divider' || elm.type === 'title');
                        return [...extraRoutes, ...routeAllowed].includes(elm.key) || condition
                    });
                };

                if (routesAllowedFromDB) {
                    res.Success = true;
                    //Trasforma i permessi in un elenco di chiavi in base al permesso abilitato 
                    //in modo da poterlo utilizzare nelle routesAllowed.
                    const allowedfromDb = [];
                    for (const key in routesAllowedFromDB) {
                        const e = routesAllowedFromDB[key];
                        if (!routesForAll.includes(key)) {
                            if (e.Focelda.status || e.IOT.status) {
                                allowedfromDb.push(key);
                            };
                        }
                    };

                    const routesAllowed__ = [...allowedfromDb, ...routesForAll]; //unisci le route per tutti con quelle che provengono dal DB.
                    const sortedData = route_elaborated.sort((a, b) => {
                        if (a.type === "nested" && b.type !== "nested") {
                            return 1; // a viene dopo b
                        } else if (a.type !== "nested" && b.type === "nested") {
                            return -1; // a viene prima di b
                        } else {
                            return 0; // lascia invariato l'ordine
                        }
                    });
                    const arr__ = [];

                    for (let i = 0; i < sortedData.length; i++) {
                        const e = sortedData[i];

                        if (e.type !== 'nested' || e.type === undefined) {
                            if (!arr__.includes(e.key) && routesAllowed__.includes(e.key)) {
                                arr__.push(e)
                            }
                        } else {
                            const nestedList = e.nested.elements;
                            if (nestedList !== undefined) {
                                if (nestedList.findIndex(x => arr__.findIndex(y => y.key === x.key) !== -1) !== -1) {
                                    arr__.push(e);
                                }
                            }
                        }
                    };

                    res.Data = generateTitledDivider(arr__); //arr__;

                } else {
                    //lista di tutte le sezioni genitore
                    //const allParentSections = route_elaborated.filter(elm => elm.type === 'nested').map(item => item.key);
                    switch (roleSNIT.Data) {
                        case 'Dev':
                            res.Success = true;
                            res.Data = route_elaborated;
                            break;

                        case 'Admin':
                            routeAllowed = ['dashboard', 'comparatore', 'sign_in', 'contribuzione', 'obiettivi_stocks', 'pagamenti',
                                'profile', 'community', 'post', 'create_post', 'sblocco_ordini', 'pesiVolumi',
                                'user_management', 'general_settings', 'fb', 'gestione_fido', 'marketing', 'promozioni',
                                'fb_cnr', 'administration', 'ordini', 'acquisti', 'commerciale', 'logistica', 'tesis', 'ins_of_fb',
                                'fido_cliente', 'documentiPDF', 'contabilita', 'stock_fine_anno', "prodotti", 'consumabili_g&g',
                                'conf_obiettivi_stocks', 'logs_prodotti', 'confg_obiettivi_stocks', 'newsletter',
                                'configuratori', 'fornitori', 'ocf_logs', 'anagraficaClienti', 'drive', "cloud", 'mailUp_logs', 'gruppi_mailUp', 'newsletter', '404',
                                "gestione_resi", 'web', 'correlati_automatici', 'correlati_manuali', 'correlati_regole_salvate', /*"queries_as400"*/,
                                'Gestionesell', 'swot', 'correlazione_categorie_distributori', 'file_sellout', "sellout", 'resi', 'movimenti',
                                /*"fatturati", 'clienti', "listini_promo", "procedure", 'lsd', */ "quotazioni", "dettagli_quotazione"];
                            setResponseData({ admin: true });
                            break;

                        case 'Buyer':
                            routeAllowed = ['dashboard', 'comparatore', 'sign_in', 'acquisti', 'drive', "cloud",
                                'profile', 'community', 'post', 'ins_of_fb', 'tesis', 'documentiPDF',
                                'create_post', 'configuratori', 'consumabili_g&g', '404', 'acquisti',
                                'web', 'correlati_manuali', 'correlati_regole_salvate', /*"queries_as400", 'lsd',
                                'file_sellout', "sellout", "procedure", "quotazioni", "commerciale", */  "dettagli_quotazione"];

                            setResponseData({ admin: false });
                            break;

                        case 'Commerciale':
                            routeAllowed = ['dashboard', 'sign_in', 'profile', 'commerciale', 'ins_of_fb',
                                'community', 'post', 'create_post', 'pagamenti', 'sblocco_ordini', 'tesis',
                                'contabilita', 'pagamenti', 'fido_cliente', 'drive', "cloud",
                                'fb', 'fb_cnr', 'ordini', 'configuratori', 'documentiPDF', 'consumabili_g&g', '404',
                                'file_sellout', "sellout",
                                /*"web","queries_as400", "procedure", 'lsd', "fatturati", 'clienti', "listini_promo", "quotazioni",*/ "dettagli_quotazione"];


                            setResponseData({ admin: false });
                            break;

                        case 'Amministrativo':
                            routeAllowed = ['dashboard', 'sign_in', 'profile', 'sblocco_ordini', 'gestione_fido', 'commerciale',
                                'community', 'post', 'create_post', 'documentiPDF', 'contabilita', 'drive', 'pagamenti', '404',
                                /*"web","queries_as400"*/, "file_sellout", "sellout", /*"procedure", 'lsd', "fatturati"*/];

                            setResponseData({ admin: false });
                            break;

                        case 'Tester':
                            routeAllowed = ['dashboard', 'sign_in', 'profile',
                                'community', 'post', 'create_post', 'configuratori', 'drive', 'consumabili_g&g', '404',  /*"procedure", 'lsd', "web","queries_as400"*/,
                                'file_sellout', "sellout"];

                            setResponseData({ admin: false });
                            break;

                        case 'Logistica':
                            routeAllowed = ['dashboard', 'sign_in', 'profile', 'logistica', 'pesiVolumi',
                                'community', 'post', 'create_post', 'documentiPDF', '404', 'drive',  /*"web","queries_as400", "procedure", 'lsd',*/, 'file_sellout', "sellout"];

                            setResponseData({ admin: false });
                            break;

                        case 'Marketing':
                            routeAllowed = ['dashboard', 'sign_in', 'profile', 'marketing', 'newsletters', 'anagraficaClienti', 'mailUp_logs',
                                'gruppi_mailUp', 'drive', "cloud", '404', "web", /*"queries_as400",*/ 'correlati_automatici', 'correlati_manuali',
                                'correlati_regole_salvate', 'file_sellout', "sellout", /*'lsd', "procedure",*/];

                            setResponseData({ admin: false });
                            break;

                        case 'Resi':
                            routeAllowed = ['dashboard', 'sign_in', 'profile', 'newsletters', '404', 'drive', 'tesis', 'gestione_resi', 'ins_of_fb', 'file_sellout', "sellout",
                                /* "procedure", "lsd"*/, "resi", "movimenti"];

                            setResponseData({ admin: false });
                            break;

                        default: throw new Error("Accesso non consentito agli utenti non autorizzati, contattare un tecnico.");
                    }

                    res.Data = generateTitledDivider(res.Data); //arr__;
                };
            };

            return res;
        } catch (e) {
            res.Success = false;
            res.Message = "Accesso non consentito agli utenti non autorizzati, contattare un tecnico.";
        };
    };

    /** Route || Req. change of the url 
    * 
    * @param role Inputted user role as a string and get back what he should see
    * @param direction Inputted the direction of the click
    */
    goTo(role, direction) {
        let res = { Success: false, Message: "", Data: {} };

        const roleSNIT = Sanitize.string(role);
        if (!roleSNIT.Success) { throw new Error('Sembra che ci sia un problema, contatta un tecnico') }

        try {
            if (roleSNIT.Data != undefined && roleSNIT.Data != null) {

            }
            return res;
        } catch (e) {
            res.Success = false;
            res.Message = "Accesso non consentito agli utenti non autorizzati, contattare un tecnico.";
        }
    }

    getRoute(routeList) {
        let res = { Success: false, Data: {} };
        const route_elaborated = [];
        for (let i = 0; i < routeList.length; i++) {
            const e = routeList[i];
            if (e.type === 'nested') {
                for (let y = 0; y < e.nested.elements.length; y++) {
                    const x = e.nested.elements[y];
                    const findIfAlreadyIn = route_elaborated.findIndex(elm => elm.key === x.key);
                    if (findIfAlreadyIn === -1) {
                        route_elaborated.push(x);
                    }
                }
            }

            const findIfAlreadyIn = route_elaborated.findIndex(elm => elm.key === e.key);
            if (findIfAlreadyIn === -1 && !e.ref_type && e.type !== 'nested') {
                route_elaborated.push(e);
            }
        }

        res.Success = true;
        res.Data = route_elaborated;

        return res;
    }
}

//funzione dedicata alla generazione dei divisori con titolo per la SideNavBar
function generateTitledDivider(routeList) {
    const routes__ = [...routeList];
    const numberOfGroups = new Set(routeList.filter(item => item.group !== undefined).map(item => item.group));

    const lastElementsOfAnyGroups = [];
    for (const value of numberOfGroups) {
        const filter = routeList.filter(item => item.group === value);
        lastElementsOfAnyGroups.push(filter[0]); //prendi il 1° elemento per ogni gruppo
    }

    for (let i = 0; i < lastElementsOfAnyGroups.length; i++) {
        const e = lastElementsOfAnyGroups[i];
        const findRouteIndex = routes__.findIndex(x => x.key === e.key); //trova la posizione nel array principale in modo da inserire le route
        const titledDivider = [
            {
                ref_type: 'title',
                type: "title_" + i,
                title: RouteTitledDividerNames[i],
                key: "title" + i,
            },
        ];

        if (i != 0) {
            //se è il primo elemento, inserisci il divider e il titolo all'inizio dell'array
            titledDivider.unshift({
                ref_type: 'divider',
                type: "divider_" + i,
                key: "divider" + i,
            });
        };

        routes__.splice(findRouteIndex, 0, ...titledDivider);
    };

    return routes__;
};


export default Permission;