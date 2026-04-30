import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};


/**
 * LoadMessagesAPI
 * - oldmsg (oldestMessageDateByIdBlock): carica messaggi PIÙ VECCHI (date < oldmsg)
 * - newmsg (newestMessageDateByIdBlock): carica messaggi PIÙ NUOVI (date > newmsg)
 *
 * Nota: oldmsg e newmsg NON vanno inviati insieme nella stessa request.
 */
export async function LoadMessagesAPI({ userContext, abortController, idb, oldestMessageDateByIdBlock, newestMessageDateByIdBlock, }:
    { userContext: UserContext; abortController: any; idb: string; oldestMessageDateByIdBlock: Date | null; newestMessageDateByIdBlock?: Date | null; }): Promise<any> {
    //if (userContext.details === undefined) { return; }
    return new Promise((resolve, reject) => {
        // payload base
        const payload: any = {
            tk: userContext.token,
            idb: idb,
        };
        /**
         * NON mandare oldmsg/newmsg se sono null,
         * altrimenti lato backend new Date(null) o valori strani possono sballare la logica.
         */
        if (newestMessageDateByIdBlock != null) {
            payload.newmsg = newestMessageDateByIdBlock;
        } else if (oldestMessageDateByIdBlock != null) {
            payload.oldmsg = oldestMessageDateByIdBlock;
        }

        FetchData(`${import.meta.env.VITE_API_CHAT}chats/h4jwekagk3z52j9c2siy`, 'POST', payload, abortController)
            .then((res: any) => {
                resolve(res)
            }).catch((error: any) => {
                console.error(error)
                reject([]);
            });
    });
}