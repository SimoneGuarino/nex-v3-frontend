import {
    FetchFileData,
    type AbortRef,
    type FetchFileResult,
    type JSONValue,
} from "examples/Fetch/FetchFileDataV2";

export type PreviewBody = {
    nome: string;
    categoria: string;
    estensione?: string;
};

export function fetchPreviewFile(
    body: PreviewBody,
    abortRef?: AbortRef
): Promise<FetchFileResult<JSONValue>> {
    const url = `${import.meta.env.VITE_API_PDF_READER}procedure/download`;

    return FetchFileData(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
        abortRef,
        responseType: "blob",
    });
}
