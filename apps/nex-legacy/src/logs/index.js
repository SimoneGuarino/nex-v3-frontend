//logsEvent è un oggetto che è composto da diversi campi esempio:
/*  event: "Delete",
    route: "/compare",
    clkproduct: {
        CodProdotto: "49kash309",
        NomeProdotto: "Mouse 3kx 300ms Ecc.",
    },
    userAgent: "Mozilla/5.0 (Linux; Android 12; SM-S906N Build/QP1A.190711.020; wv)",
    serverResponse: 200,
    IP_Andress: "117.201.191.215",
*/
export const SendLogs = (token, event, route, CodProduct, NomeProdotto, post_dettails) => {
    if(!token){return false};
    let logsEvent = {};

    switch (event) {
        case "Log-in":
            logsEvent = {
                event: event,
                route: route,
            };
            break;
        case "Log-out":
            logsEvent = {
                event: event,
                route: route,
            };
            break;
        case "Change Password":
            logsEvent = {
                event: event,
                route: route,
            };
            break;
        case "Delete Product":
            logsEvent = {
                event: event,
                route: route,
                clkproduct: {
                    CodProdotto: CodProduct,
                    NomeProdotto: NomeProdotto,
                }
            };
            break;
        case "Enter in Page" :
            logsEvent = {
                event: event,
                route: route,
            };
            break;
        case "Add Note":
        case "Remove Note":
        case "Add Post":
        case "Remove Post":
        case "Add Like":
        case "Remove Like":
        case "Add Comment":
        case "Remove Comment":
            logsEvent = {
                event: event,
                route: route,
                post_dettails : post_dettails,
            };
            break;
        case "Add Products in Pesi&Volumi":
            logsEvent = {
                event: event,
                route: route,
                post_dettails : post_dettails,
            };
            break;
        case "Notification":
            logsEvent = {
                event: event,
                route: route,
                post_dettails : post_dettails,
            };
            break;
        case "Remove Notification":
            logsEvent = {
                event: event,
                route: route,
                post_dettails : post_dettails,
            };
            break;
    };


    fetch(import.meta.env.VITE_API_USERS + "logs", {
        method: "POST",
        body: JSON.stringify({
            tk: token,
            logsEvent: logsEvent,
        }),
        headers: { "Content-Type": "application/json" },
    }).then(async (response) => {
        //controlla lo status della risposta da parte del server
        if (response.ok) {
          return await response.json();
        }
    }).catch(err => console.error(err))
};

export default SendLogs;
