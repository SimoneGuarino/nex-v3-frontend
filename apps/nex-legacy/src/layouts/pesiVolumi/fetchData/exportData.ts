// src/layouts/pesiVolumi/fetchData/exportData.ts
import { enqueueSnackbar } from 'components/MessageBox';
import { FetchFileData, AbortRef } from '../../../examples/Fetch/FetchFileDataV2';

interface ExportCSVProps {
    abortRef: AbortRef;
}

/**
 * Scarica il CSV completo pesi/volumi da backend.
 *
 * Endpoint:
 *   GET ${import.meta.env.VITE_API_LOGISTICS}wgtvlm/export
 * che deve puntare alla rotta exportProducts.ts
 * (l'Authorization viene gestita da FetchFileData via getAuthToken -> header Bearer)
 */
export async function ExportWeightsVolumesCSV({ abortRef }: ExportCSVProps): Promise<void> {
    try {
        const result = await FetchFileData(
            `${import.meta.env.VITE_API_LOGISTICS}wgtvlm/export`,
            {
                method: 'GET',
                responseType: 'blob',
                abortRef,
            }
        );

        // Ci aspettiamo un file (blob). Se arriva JSON, gestiamo come errore.
        if (result.kind === 'blob') {
            const blob = result.blob;

            const defaultName = `weights-volumes-${new Date()
                .toISOString()
                .slice(0, 19)
                .replace(/[:T]/g, '_')}.csv`;

            const filename = result.filename || defaultName;

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            enqueueSnackbar('File esportato correttamente.', {
                title: 'Esportazione completata',
                type: 'success',
            });
        } else {
            // kind === "json": qualcosa non torna, probabilmente un errore lato server
            const json: any = result.json;
            const msg =
                (json && (json.msg || json.message)) ||
                'La risposta del server non è un file CSV come previsto.';

            enqueueSnackbar(msg, {
                title: 'Errore durante l’esportazione',
                type: 'error',
            });
        }
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            // richiesta annullata volontariamente, non mostriamo errori
            return;
        }

        console.error(error);
        const msg =
            (error && (error.msg || error.message)) ||
            'Si è verificato un problema durante l’esportazione del file, perfavore contatta un tecnico.';

        enqueueSnackbar(msg, {
            title: 'Ops..',
            type: 'error',
        });
    }
}
