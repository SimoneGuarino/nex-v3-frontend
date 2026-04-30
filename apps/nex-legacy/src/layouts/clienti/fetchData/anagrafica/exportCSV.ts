//src\layouts\clienti\fetchData\anagrafica\exportCSV.ts

import { isKeyInObject } from "vdck";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchFileData } from "examples/Fetch/FetchFileDataV2";
import { ChangeLoadStatusArgs } from "layouts/clienti/types/load";

export function exportAnagraficaCSV({
    userContext,
    abortController,
    body,
    ChangeLoadStatus,
    setErr,
}: {
    userContext: { [key: string]: any };
    abortController: any; // AbortRef di FetchFileDataV2 (ref o istanza)
    body: { [key: string]: any };
    ChangeLoadStatus: ({ from, bool }: ChangeLoadStatusArgs) => void;
    setErr: (prev: boolean) => void;
}): Promise<any> {
    // ✅ gate autenticazione, come in getData
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return Promise.resolve(false);
    }

    const url = `${import.meta.env.VITE_API_CUSTOMERSFIDO}customers/anagrafica/export`;
    const payload = { ...body };

    return FetchFileData(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
            "Content-Type": "application/json",
        },
        abortRef: abortController,
        responseType: "blob", // ci aspettiamo un CSV
    })
        .then((res) => {
            ChangeLoadStatus({ from: "export_data", bool: false });

            if (res.kind === "blob") {
                const blobUrl = URL.createObjectURL(res.blob);
                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = res.filename || "anagrafica_clienti.csv";
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(blobUrl);
                return true;
            }

            // fallback: il BE ha restituito JSON (es. messaggio di errore)
            const message =
                (res as any)?.json?.msg ||
                "Non è stato possibile generare il file di export.";
            enqueueSnackbar(message, { title: "Ops..", type: "error" });
            setErr(true);
            return false;
        })
        .catch((error: any) => {
            // gestisci solo errori reali, non gli abort
            if (error?.name !== "AbortError") {
                ChangeLoadStatus({ from: "export_data", bool: false });
                console.error(error);
                let error_ =
                    "Sembra che ci sia stato un problema durante l'esportazione dei dati, perfavore contatta un tecnico.";
                if (error && (error?.msg || error?.message)) {
                    error_ = error.msg || error.message;
                }
                enqueueSnackbar(error_, { title: "Ops..", type: "error" });
                setErr(true);
            }
            throw error;
        });
}
