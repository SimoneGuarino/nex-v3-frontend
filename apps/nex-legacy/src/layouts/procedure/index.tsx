import React from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import FolderTable from "./components/FolderTable";
import Preview from "./components/Preview";
import { useUserContext } from "context/UserContext";
import { getProceduresList, type ProcedureCategoryInfo, type ProcedureFileInfo } from "./fetchdata/list";
import { downloadProcedureFile } from "./fetchdata/download";
import { GeneralError } from "components/NoData/generalError";
import NoData from "../../assets/images/noData/no-data-illustration_2150696443.webp";
// tour
import { useSectionTour } from "tour/useSectionTour";
import { Role } from "tour/types";

type PreviewState = {
    open: boolean;
    categoria: string;
    file: ProcedureFileInfo | null;
};

const INITIAL_PREVIEW: PreviewState = { open: false, categoria: "", file: null };

export function Procedure() {
    const [userContext] = useUserContext() as any;

    const abortController = React.useRef<AbortController | null>(null);
    const downloadAbortRef = React.useRef<AbortController | null>(null);

    const [data, setData] = React.useState<ProcedureCategoryInfo[]>([]);
    const dataRef = React.useRef<ProcedureCategoryInfo[]>([]);
    const [err, setErr] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [downloadingPreview, setDownloadingPreview] = React.useState(false);

    // Preview singleton (1 sola modale in tutta la pagina)
    const [preview, setPreview] = React.useState<PreviewState>(INITIAL_PREVIEW);

    const ChangeLoadStatus = React.useCallback(({ bool }: { from: string; bool: boolean }) => {
        setLoading(bool);
    }, []);

    const ChangePreviewDownloadStatus = React.useCallback(({ bool }: { from: string; bool: boolean }) => {
        setDownloadingPreview(bool);
    }, []);

    React.useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // Tour: preserviamo la logica esistente
    useSectionTour({
        id: "nex_v2_procedure",
        version: "2.0.0",
        user: {
            id: userContext?.details?._id ?? "",
            role: (userContext?.details?.ruolo as Role) ?? "Tester",
        },
        keys: "procedure",
        actions: {
            6: () => setPreview(INITIAL_PREVIEW),
            10: () => {
                const firstCategory = dataRef.current?.[0];
                const firstFile = firstCategory?.files?.[0] ?? null;

                if (firstCategory?.categoria && firstFile) {
                    setPreview({ open: true, categoria: firstCategory.categoria, file: firstFile });
                }
            },
            11: () => setPreview(INITIAL_PREVIEW),
        },
    });

    React.useEffect(() => {
        if (!userContext) return;

        getProceduresList({
            userContext: userContext as any,
            abortController,
            setData,
            setErr,
            ChangeLoadStatus,
        }).catch(() => { });

        return () => {
            abortController.current?.abort();
        };
    }, [userContext, ChangeLoadStatus]);

    const handleOpenPreview = React.useCallback((categoria: string, file: ProcedureFileInfo) => {
        setPreview({ open: true, categoria, file });
    }, []);

    const handleClosePreview = React.useCallback(() => {
        setPreview(INITIAL_PREVIEW);
    }, []);

    const handleDownloadPreview = React.useCallback(() => {
        if (!preview.file) return;

        downloadProcedureFile({
            body: {
                nome: preview.file.nome,
                categoria: preview.categoria,
                estensione: preview.file.estensione,
            },
            abortRef: downloadAbortRef,
            ChangeLoadStatus: ChangePreviewDownloadStatus,
            setErr: () => { },
        }).catch(() => { });
    }, [preview.file, preview.categoria, ChangePreviewDownloadStatus]);

    // Nota: il download resta gestito dentro FolderTable (local state),
    // così un download non invalida tutta la pagina.
    return (
        <DashboardLayout>
            <div className="w-full flex flex-col gap-2">
                {loading && (
                    <div className="h-[90vh] flex flex-col w-full gap-2">
                        <div className="h-1/3 w-full bg-gray-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
                        <div className="h-1/3 w-full bg-gray-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
                        <div className="h-1/3 w-full bg-gray-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
                    </div>
                )}

                {!loading && err && <GeneralError img={NoData} />}

                {!loading && !err && data.length === 0 && <GeneralError img={NoData} />}

                {!loading &&
                    !err &&
                    data.map((category) => (
                        <FolderTable
                            key={category.categoria}
                            category={category}
                            onOpenPreview={handleOpenPreview}
                        />
                    ))}
            </div>

            {/* Preview singleton (CRITICO per performance) */}
            <Preview
                open={preview.open}
                file={preview.file}
                categoria={preview.categoria}
                onClose={handleClosePreview}
                onDownload={handleDownloadPreview}
                downloading={downloadingPreview}
            />
        </DashboardLayout>
    );
}

export default Procedure;
