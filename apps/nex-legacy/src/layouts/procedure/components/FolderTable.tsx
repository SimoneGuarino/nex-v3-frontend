import React from "react";
import { clsx } from "clsx";
import { FDButton } from "@nex/fd-ui";
import { IoDocumentOutline } from "react-icons/io5";
import { IoMdDownload } from "react-icons/io";
import {
    BsFiletypeCsv,
    BsFiletypeXlsx,
    BsFiletypeXls,
    BsFiletypePdf,
    BsFiletypeTxt,
    BsFiletypeDocx,
} from "react-icons/bs";
import type { ProcedureCategoryInfo, ProcedureFileInfo } from "../fetchdata/list";
import { downloadProcedureFile } from "../fetchdata/download";
import { useTour } from "tour/TourProvider";

// -------------------------
// ICONS
// -------------------------
const DownloadIcon = IoMdDownload as React.FC<{ size?: number; className?: string }>;
const DocumentIcon = IoDocumentOutline as React.FC<{ size?: number; className?: string }>;
const DocxIcon = BsFiletypeDocx as React.FC<{ size?: number; className?: string }>;
const CsvIcon = BsFiletypeCsv as React.FC<{ size?: number; className?: string }>;
const XlsxIcon = BsFiletypeXlsx as React.FC<{ size?: number; className?: string }>;
const XlsIcon = BsFiletypeXls as React.FC<{ size?: number; className?: string }>;
const PdfIcon = BsFiletypePdf as React.FC<{ size?: number; className?: string }>;
const TxtIcon = BsFiletypeTxt as React.FC<{ size?: number; className?: string }>;

// -------------------------
// FORMATTERS (stabili, no per-row toLocaleString)
// -------------------------
const DTF = new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" });
const NF_MB = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatDate(iso: string | null | undefined): string {
    if (!iso) return "-";
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return "-";
    return DTF.format(t);
}

function formatSizeMB(size: number | null | undefined): string {
    if (typeof size !== "number") return "-";
    return `${NF_MB.format(size)} MB`;
}

function getFileIcon(ext: string | undefined) {
    const e = (ext || "").toLowerCase();
    switch (e) {
        case "csv":
            return CsvIcon;
        case "xlsx":
            return XlsxIcon;
        case "xls":
            return XlsIcon;
        case "pdf":
            return PdfIcon;
        case "txt":
            return TxtIcon;
        case "docx":
            return DocxIcon;
        default:
            return DocumentIcon;
    }
}

// Key robusta (meglio di solo file.nome)
function makeFileKey(file: ProcedureFileInfo): string {
    return `${file.nome}__${file.estensione ?? ""}__${file.ultima_modifica ?? ""}__${file.dimensione ?? ""}`;
}

type FolderTableProps = {
    category: ProcedureCategoryInfo;
    onOpenPreview: (categoria: string, file: ProcedureFileInfo) => void;
};

type FileRowProps = {
    categoria: string;
    file: ProcedureFileInfo;
    downloading: boolean;
    lockInteractions: boolean;
    onOpenPreview: (categoria: string, file: ProcedureFileInfo) => void;
    onDownload: (file: ProcedureFileInfo) => void;
};

const FileRow = React.memo(function FileRow({
    categoria,
    file,
    downloading,
    lockInteractions,
    onOpenPreview,
    onDownload,
}: FileRowProps) {
    const Icon = getFileIcon(file.estensione);

    return (
        <li className="w-full py-2 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:items-center">
                <div className="flex items-center gap-2 min-w-0" data-tour="procedure-nome">
                    <Icon className="text-xl shrink-0 text-neutral-500" />
                    <h3 className="truncate">{file.nome}</h3>
                </div>

                <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-300" data-tour="procedure-data">
                    {formatDate(file.ultima_modifica)}
                </span>

                <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
                    <span className="text-xs text-neutral-600 dark:text-neutral-300">{formatSizeMB(file.dimensione)}</span>

                    <FDButton
                        dataTour="procedure-preview-btn"
                        size="small"
                        radius="md"
                        variant="outline"
                        color="neutral"
                        onClick={() => onOpenPreview(categoria, file)}
                        disabled={lockInteractions}
                    >
                        <DocumentIcon className="mr-1.5" />
                        Visualizza
                    </FDButton>

                    <FDButton
                        size="small"
                        radius="md"
                        variant="outline"
                        color="neutral"
                        onClick={() => onDownload(file)}
                        disabled={downloading || lockInteractions}
                        dataTour="procedure-scarica"
                    >
                        <DownloadIcon className="mr-1.5" />
                        {downloading ? "..." : "Scarica"}
                    </FDButton>
                </div>
            </div>
        </li>
    );
});

export const FolderTable = React.memo(function FolderTable({ category, onOpenPreview }: FolderTableProps) {
    const downloadAbortRef = React.useRef<AbortController | null>(null);

    // downloading per-categoria (non invalida l’intera pagina)
    const [downloading, setDownloading] = React.useState(false);
    const [err, setErr] = React.useState(false);

    // Opzionale: accordion per scalare meglio se categorie/file diventano tanti
    const [expanded, setExpanded] = React.useState(true);

    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && tourIndex === 5;

    const ChangeLoadStatus = React.useCallback(({ bool }: { from: string; bool: boolean }) => {
        setDownloading(bool);
    }, []);

    const handleDownload = React.useCallback(
        (file: ProcedureFileInfo) => {
            downloadProcedureFile({
                body: {
                    nome: file.nome,
                    categoria: category.categoria,
                    estensione: file.estensione,
                },
                abortRef: downloadAbortRef,
                ChangeLoadStatus,
                setErr,
            }).catch(() => { });
        },
        [category.categoria, ChangeLoadStatus]
    );

    const handleToggleExpanded = React.useCallback(() => {
        setExpanded((v) => !v);
    }, []);

    return (
        <section
            className={clsx(
                "relative h-full rounded-2xl p-5 sm:p-6",
                "bg-gradient-to-br from-white/90 to-white/60 dark:from-neutral-900/80 dark:to-neutral-900/60",
                "backdrop-blur supports-[backdrop-filter]:backdrop-blur border border-black/5 dark:border-white/10",
                "shadow-sm",
                "w-full flex flex-col gap-2"
            )}

        >
            <div className="w-full rounded-md p-3 mb-2 bg-neutral-200/50 dark:bg-neutral-800/50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            className="text-left min-w-0"
                            onClick={handleToggleExpanded}
                            aria-expanded={expanded}
                        >
                            <h2 className="text-sm capitalize truncate" data-tour="procedure-categoria">
                                {category.categoria}
                            </h2>
                        </button>

                        <span className="text-xs text-neutral-600 dark:text-neutral-300">
                            Ultima modifica: <span className="font-medium">{formatDate(category.ultima_modifica)}</span>
                        </span>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3">
                        <p className="text-sm" data-tour="procedure-files">
                            {category.numero_files} file • {formatSizeMB(category.dimensione)}
                        </p>

                        <button
                            type="button"
                            onClick={handleToggleExpanded}
                            className="text-xs px-2 py-1 rounded-md border border-black/10 dark:border-white/10"
                        >
                            {expanded ? "Nascondi" : "Mostra"}
                        </button>
                    </div>
                </div>
            </div>

            {expanded && (
                <ul
                    className="divide-solid divide-neutral-200 dark:divide-neutral-800 divide-y px-2"
                    // aiuta la scalabilità (browser moderni): evita lavoro di layout/render per sezioni off-screen
                    style={{ contentVisibility: "auto", containIntrinsicSize: "600px" } as any}
                >
                    {category.files.map((file) => (
                        <FileRow
                            key={makeFileKey(file)}
                            categoria={category.categoria}
                            file={file}
                            downloading={downloading}
                            lockInteractions={lockInteractions}
                            onOpenPreview={onOpenPreview}
                            onDownload={handleDownload}
                        />
                    ))}
                </ul>
            )}

            {/* Lock overlay UNA VOLTA SOLA (non per riga) */}
            {lockInteractions && (
                <div
                    aria-hidden="true"
                    className="absolute inset-0 z-10"
                    style={{ pointerEvents: "auto" }}
                    onClickCapture={(e) => e.stopPropagation()}
                />
            )}

            {/* opzionale: se vuoi surfacing error locale */}
            {err && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                    Errore durante il download. Riprova o contatta un tecnico.
                </div>
            )}
        </section>
    );
});

export default FolderTable;