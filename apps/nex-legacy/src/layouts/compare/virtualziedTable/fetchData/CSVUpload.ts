// src/layouts/compare/virtualziedTable/fetchData/CSVUpload.ts
import { RetriveSupplierFromCookies } from "utils/retriveSupplierFromCookies";
import { FetchFileData } from "examples/Fetch/FetchFileDataV2";
import { enqueueSnackbar } from "components/MessageBox";
import type { Dispatch, SetStateAction, MutableRefObject } from "react";

type UserContextLike = {
    token?: string;
    details?: { username?: string } | null | undefined;
} | null;

type SupplierFilter = { Name: string };

type UploadResponseJson = { csv?: string }; // se il server legacy tornasse ancora JSON

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export async function CSVUploadRequest(
    userContext: UserContextLike,
    // 👇 deve essere una ref, come richiesto da FetchFileData
    abortController: MutableRefObject<AbortController | null>,
    formData: FormData,
    setProgressUpload: Dispatch<SetStateAction<number>>
): Promise<void> {
    if (userContext?.details === undefined) return;

    const __dist: SupplierFilter[] = RetriveSupplierFromCookies("stored_settings");
    if (__dist && __dist.length > 0) {
        formData.append("__dist", JSON.stringify(__dist));
    }

    const handleDownloadCsv = async (path: string, fileName: string) => {
        const pathClean = path.startsWith("/") ? path.slice(1) : path;
        const fileUrl = `${import.meta.env.VITE_API_SEARCH_ENDPOINT}${pathClean}`;

        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();

            const csvFileUrl = URL.createObjectURL(blob);
            setProgressUpload(100);

            const downloadLink = document.createElement("a");
            downloadLink.href = csvFileUrl;
            downloadLink.setAttribute("download", fileName);
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            setTimeout(() => setProgressUpload(0), 1500);
        } catch (error) {
            console.error("Errore durante il download del file:", error);
        }
    };

    try {
        setProgressUpload(30);
        const endpointUrl = `${import.meta.env.VITE_API_SEARCH_ENDPOINT}upload/csv`;

        const result = await FetchFileData<UploadResponseJson>(endpointUrl, {
            method: "POST",
            body: formData,
            responseType: "auto", // prova blob, altrimenti json
            // credentials: "include", // se usi sessioni/cookie cross-site
        });
        if(result) setProgressUpload(100);

        // CSV diretto
        if (result.kind === "blob") {
            const fileFromForm = formData.get("csvFile") as File | null;
            const suggested =
                result.filename ||
                (fileFromForm ? fileFromForm.name.replace(/\.csv$/i, "") : "export") + "_elaborato.csv";
            triggerDownload(result.blob, suggested);
            setProgressUpload(0);
            enqueueSnackbar("CSV elaborato scaricato", { title: "OK", type: "success" });
            return;
        }

        // JSON (compat)
        if (result.kind === "json" && result.json?.csv) {
            const fileName = result.json.csv.split("/").pop() || "export.csv";
            await handleDownloadCsv(result.json.csv, fileName);
            setProgressUpload(0);
            enqueueSnackbar("CSV elaborato scaricato", { title: "OK", type: "success" });
            return;
        }

        // Altrimenti errore
        throw new Error("Risposta inattesa (né CSV né JSON { csv }).");
    } catch (error) {
        console.error(error);
        setProgressUpload(0);
        if (error instanceof Error) {
            enqueueSnackbar(error.message, { title: "Errore", type: "error" });
        } else {
            enqueueSnackbar("C'è stato un errore sconosciuto durante la fase di upload del file CSV, contatta il supporto.", 
                { title: "Errore", type: "error" });
        }
    }
}
