/**
 * Export CSV server-side della lista Preventivi.
 *
 * La tabella Preventivi usa paginazione server-side, quindi il FE non può
 * costruire un export corretto partendo dai soli record presenti in memoria.
 * Questa funzione delega al backend la generazione del file completo filtrato.
 */
import type { MutableRefObject } from "react";
import { isKeyInObject } from "vdck";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchFileData } from "examples/Fetch/FetchFileDataV2";
import { getPreventiviApiBase } from "./apiBase";

type ExportQuotesCsvArgs = {
    userContext: { [key: string]: any };
    abortController: MutableRefObject<AbortController | null>;
    body: {
        env?: string;
        agentCodes?: string[];
        customerCode?: string;
        year?: string;
        warehouse?: string;
        quoteNumber?: string;
        q?: string;
        sort?: string;
    };
    setLoading: (value: boolean) => void;
};


export function exportQuotesCsv({
    userContext,
    abortController,
    body,
    setLoading,
}: ExportQuotesCsvArgs): Promise<boolean> {
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return Promise.resolve(false);
    }

    const url = `${getPreventiviApiBase()}customers/quotes/export`;
    setLoading(true);

    return FetchFileData(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
        abortRef: abortController,
        responseType: "blob",
    })
        .then((res) => {
            if (res.kind === "blob") {
                const blobUrl = URL.createObjectURL(res.blob);
                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = res.filename || "preventivi.csv";
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(blobUrl);
                return true;
            }

            const message =
                (res as any)?.json?.msg ||
                "Non e' stato possibile generare il file di export.";
            enqueueSnackbar(message, { title: "Ops..", type: "error" });
            return false;
        })
        .catch((error: any) => {
            if (error?.name !== "AbortError") {
                let message =
                    "Sembra che ci sia stato un problema durante l'esportazione dei dati, perfavore contatta un tecnico.";
                if (error && (error?.msg || error?.message)) {
                    message = error.msg || error.message;
                }
                enqueueSnackbar(message, { title: "Ops..", type: "error" });
            }
            throw error;
        })
        .finally(() => {
            setLoading(false);
        });
}
