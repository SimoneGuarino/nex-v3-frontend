// Scarico PDF senza navigare la pagina: fetch -> blob -> ObjectURL
// Supporta single e batch con concorrenza limitata e progress callback.

import { downloadPdfBatch, downloadPdfSingle, DownloadSingleOpts } from "examples/Fetch/FetchFilePDF";

export type Company = "FOCELDA" | "IOT";
type BuildUrlOpts = { download?: boolean; basePath?: string };

const buildPdfUrl = (fileName: string, company: Company, opts?: BuildUrlOpts) => {
    const params = new URLSearchParams({ company });
    if (opts?.download) params.set("download", "1");
    return `${import.meta.env.VITE_API_PDF_READER}pdf/v2/documents/${encodeURIComponent(fileName)}?${params.toString()}`;
};

export async function downloadPdfSingleAPI(
    fileName: string,
    company: Company,
    opts?: DownloadSingleOpts
) {
    const url = buildPdfUrl(fileName, company, { download: opts?.asAttachment ?? true, basePath: opts?.basePath });
    downloadPdfSingle(url, opts);
};