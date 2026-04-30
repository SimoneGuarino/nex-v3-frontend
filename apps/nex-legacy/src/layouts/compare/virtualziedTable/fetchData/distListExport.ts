import { enqueueSnackbar } from 'components/MessageBox';

interface DownloadAPIProps {
    nome: string;
    formato: 'csv' | 'xlsx';
    userContext: { token: string };
}

/**
 * Esegue una richiesta GET per scaricare il listino fornitore.
 * @param nome Nome del distributore
 * @param formato Estensione richiesta: 'csv' o 'xlsx'
 * @param userContext Contesto utente contenente il token
 */
export async function DownloadDistFileAPI({ nome, formato, userContext }: DownloadAPIProps): Promise<void> {
    if (!userContext?.token) {
        enqueueSnackbar("Sembra che tu non sia loggato. Perfavore effettua il login.", {
            title: 'Ops...',
            type: 'error',
        });
        return;
    }

    try {
        const url = `${import.meta.env.VITE_API_SEARCH_ENDPOINT}distributors/export/${encodeURIComponent(nome)}/${encodeURIComponent(formato)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${userContext.token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            enqueueSnackbar(error?.msg || "Errore durante il download del listino.", {
                title: 'Errore',
                type: 'error',
            });
            return;
        }

        const blob = await response.blob();
        const contentDisposition = response.headers.get("Content-Disposition");
        const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
        const fileName = fileNameMatch?.[1] || `listino_${nome}.${formato}`;

        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);

    } catch (err: any) {
        console.error("Errore imprevisto durante il download:", err);
        enqueueSnackbar("Errore imprevisto durante il download. Contatta un tecnico.", {
            title: 'Errore',
            type: 'error',
        });
    }
}
