//src\layouts\procedure\fetchdata\download.ts

import { enqueueSnackbar } from "components/MessageBox";
import {
    FetchFileData,
    type AbortRef,
} from "examples/Fetch/FetchFileDataV2";

type DownloadBody = {
    nome: string;
    categoria: string;
    estensione?: string;
};

export function downloadProcedureFile({
    body,
    abortRef,
    ChangeLoadStatus,
    setErr,
}: {
    body: DownloadBody;
    abortRef: AbortRef;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
    setErr: (prev: boolean) => void;
}): Promise<void> {
    const url = `${import.meta.env.VITE_API_PDF_READER}procedure/download`;

    ChangeLoadStatus({ from: "download", bool: true });

    return FetchFileData(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
        abortRef,
        responseType: "blob",
    })
        .then((res) => {
            if (res.kind !== "blob") {
                throw new Error("Risposta inattesa dal server.");
            }

            const filename = res.filename || body.nome || "file";
            const blobUrl = window.URL.createObjectURL(res.blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);

            ChangeLoadStatus({ from: "download", bool: false });
        })
        .catch((error: any) => {
            if (error.name === "AbortError") {
                ChangeLoadStatus({ from: "download", bool: false });
                return;
            }

            console.error(error);
            ChangeLoadStatus({ from: "download", bool: false });
            setErr(true);

            let msg =
                "Sembra che ci sia stato un problema durante il download del file, perfavore contatta un tecnico.";
            if (error && (error.msg || error.message)) {
                msg = error.msg || error.message;
            }

            enqueueSnackbar(msg, { title: "Ops..", type: "error" });
        });
}
