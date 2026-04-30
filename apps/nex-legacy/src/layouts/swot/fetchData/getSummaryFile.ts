import { enqueueSnackbar } from "components/MessageBox";
import { FetchFileExcel } from "examples/Fetch/FetchFileExcel";
import { downloadFile } from "utils/dwdFile";

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export async function DataAPI(
    userContext: UserContext,
    abortController: any,
    utenteId: string,
    format: "xlsx" | "csv"
): Promise<void> {
    if (!userContext?.details) return;

    try {
        const res = await FetchFileExcel(`${import.meta.env.VITE_API_STOCKS}swot/export/${utenteId}`, "POST",{ format }, abortController);
        if (res) {
            const fileName =
                "Report_" +
                utenteId +
                "_" +
                new Date().toLocaleDateString().split("/").join("_") +
                `.${format}`;
            await downloadFile(res, fileName);
        }
    } catch (error: any) {
        if (error.name !== "AbortError") {
            console.error(error);
            let errorMsg =
                "Sembra che al momento non sia possibile contattare il server, riprova più tardi!";
            if (error?.msg || error?.message) {
                errorMsg = error.msg || error.message;
            }
            enqueueSnackbar(errorMsg, {
                title: "Ops.. Errore in risposta dal server",
                type: "error",
            });
        }
        throw error; // Rilancia errore al chiamante
    }
}

