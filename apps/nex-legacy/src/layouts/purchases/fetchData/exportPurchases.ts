import type { MutableRefObject } from "react";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchFileData } from "examples/Fetch/FetchFileDataV2";
import type { PurchasesQuery } from "../types";
import {
    buildPurchasesQueryPayload,
    getPurchasesApiBase,
    PURCHASES_ENDPOINTS,
} from "./apiBase";

/**
 * Costruisce il payload dell'export.
 * Deve restare coerente con la stessa logica filtri/sort usata in tabella.
 */
function buildExportPayload(query: PurchasesQuery): Record<string, unknown> {
    return buildPurchasesQueryPayload({
        query,
        includeSort: true,
    });
}

/**
 * Richiede al backend la generazione del CSV acquisti e ne forza il download nel browser.
 */
export function exportPurchases(args: {
    abortController: MutableRefObject<AbortController | null>;
    query: PurchasesQuery;
    setLoading: (value: boolean) => void;
}): Promise<boolean> {
    const { abortController, query, setLoading } = args;

    setLoading(true);

    return FetchFileData(`${getPurchasesApiBase()}${PURCHASES_ENDPOINTS.export}`, {
        method: "POST",
        body: JSON.stringify(buildExportPayload(query)),
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
                link.download = res.filename || "dati_acquistato_clienti.csv";
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(blobUrl);
                return true;
            }

            enqueueSnackbar((res as any)?.json?.msg || "Non e stato possibile generare il file di export.", {
                title: "Ops..",
                type: "error",
            });
            return false;
        })
        .catch((error: any) => {
            if (error?.name !== "AbortError") {
                enqueueSnackbar(error?.msg || error?.message || "Errore durante l'export dei dati acquistato clienti.", {
                    title: "Ops..",
                    type: "error",
                });
            }
            throw error;
        })
        .finally(() => {
            setLoading(false);
        });
}
