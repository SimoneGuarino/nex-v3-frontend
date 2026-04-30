import { FetchData } from "examples/Fetch";
import { AbortRef, FetchFileData } from "examples/Fetch/FetchFileData";

export type ImportFromFileSummary = {
    msg: string;
    summary: {
        totalRows: number;
        validRows: number;
        importedCount: number;
        invalidRows: { rowIndex: number; reason: string }[];
        notFound: { rowIndex: number; codice: string }[];
        bulkResult: {
            matched: number;
            modified: number;
            upserted: number;
        };
    };
};

type Params = {
    quotationId: string;
    file: File;
    abortController: AbortRef;
    onComplete: (res: ImportFromFileSummary) => void;
    onError: (msg: string) => void;
};

export async function UploadCartFromFileAPI(params: Params) {
    const { quotationId, file, abortController, onComplete, onError } = params;

    try {
        const formData = new FormData();
        formData.append("file", file);

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/${quotationId}/import/cart`);

        const res = await FetchFileData(
            url.toString(),
            "POST",
            formData,
            abortController
        );

        const data = (await res) as ImportFromFileSummary;
        onComplete(data);
    } catch (err: any) {
        console.error(err);
        onError(err.message || "Errore generico durante l'importazione del file");
    }
}
