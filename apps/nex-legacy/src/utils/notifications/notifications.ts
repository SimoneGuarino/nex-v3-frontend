import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch'; // stessa utility che usi in sendRequest

export type BodyNotificationsProps = {
        user_from: string;
        user_from_details: { nome: string, fullName: string, system: boolean };
        user_target: string[];
        type: "Manutenzione" | "Info" | 'Allert';
        modality: 'Generale' | 'Singola' | 'Ruolo';
        usersTargetStatus: 'Tutti' | 'Online' | 'Offline' | 'Assente';
        desc: string;
        timerMode: boolean;
        timer?: string;
        targetRole?: string;
        usersTargetCodiceBuyer?: string;
};

interface NotificationsProps {
    _id: string;
    userToken: string | undefined;
    statusNotificationSend?: boolean;
    body: BodyNotificationsProps;
};

export async function Notifications({ body, userToken, statusNotificationSend }: NotificationsProps) {
    try {
        // Chiamata API per salvare ed emettere la notifica
        await FetchData(`${import.meta.env.VITE_API_API_USERS}notifications/create`, 'POST', {
            tk: userToken,
            ...body,
        }, { current: null });

        if (statusNotificationSend) {
            enqueueSnackbar("La notifica è stata inviata correttamente!.", {
                title: 'Invio avvenuto con successo',
                type: 'success',
            });
        }
    } catch (err) {
        console.error("Errore durante l'invio notifica:", err);
        enqueueSnackbar("Errore durante l'invio della notifica. Contatta l'assistenza.", {
            title: 'Errore',
            type: 'error',
        });
    };
};