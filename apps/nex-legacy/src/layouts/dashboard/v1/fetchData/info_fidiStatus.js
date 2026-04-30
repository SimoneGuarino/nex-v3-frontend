import { FetchData } from '../../../examples/Fetch';

/**
 * Recupera i dati relativi ai fidi dal backend.
 * @param {*} userContext 
 * @param {*} setFidi 
 * @param {*} abortController 
 * @param {*} DeleteFromLoadRef 
 * @returns Promise<void>
 */
export async function InfoFidi(userContext, setFidi, abortController, DeleteFromLoadRef) {
    try {
        if (!userContext.details || (userContext.details.ruolo !== 'Admin' && userContext.details.ruolo !== 'Dev')) {
            return;
        }

        const res = await FetchData(
            import.meta.env.VITE_API_USERS + 'dashboard/read/tra43y5crrey7w2x4ohg',
            'POST',
            { tk: userContext.token },
            abortController
        );

        if (!res || !res.data) {
            throw new Error("Risposta non valida dal server");
        }

        setFidi(res.data);
    } catch (error) {
        console.error("Errore in InfoFidi:", error);
        throw error;
    } finally {
        DeleteFromLoadRef("fidi");
    }
}
