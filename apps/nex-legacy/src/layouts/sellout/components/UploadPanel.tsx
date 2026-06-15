//src\layouts\sellout\components\uploadPanel.tsx

import React, { Dispatch, SetStateAction } from "react"; import { FDBox } from "@nex/fd-ui";
import FDButton from "components/UI/buttons/FDButton";
import { AttachmentsForm } from "components/Upload";
import { type SelloutFile } from "layouts/sellout/fetchdata/list";

/** basename semplice cross-platform */
function basename(p?: string | null): string {
    if (!p) return "";
    const parts = String(p).split(/[\\/]+/);
    return parts[parts.length - 1] || "";
}

export type UploadPanelProps = {
    open: boolean;
    row: SelloutFile | null;
    uploading: boolean;
    selectedFile: File[];
    setSelectedFile: Dispatch<SetStateAction<File[]>>;
    onClose: () => void;
    onSubmit: () => void;
};

const UploadPanel: React.FC<UploadPanelProps> = ({
    open,
    row,
    uploading,
    selectedFile,
    setSelectedFile,
    onClose,
    onSubmit,
}) => {
    if (!open || !row) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
            onClick={() => {
                if (!uploading) onClose();
            }}
        >
            <div className="w-[min(640px,95vw)]" onClick={(e) => e.stopPropagation()}>
                <FDBox radius="2xl" pad="md" className="bg-white dark:bg-neutral-900">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">Upload CSV alternativo</h3>
                        <span className="text-sm opacity-70">
                            {row.filename} — stato: <b>{row.stato}</b>
                        </span>
                    </div>

                    <div className="mb-3 text-sm opacity-80">
                        Carica un solo file <b>.csv</b> con lo stesso nome di{" "}
                        <code>{basename((row as any).filename)}</code>
                    </div>

                    <AttachmentsForm
                        selectedFile={selectedFile}
                        setSelectedFile={setSelectedFile}
                        extensions={["csv"]}
                        maxFileSize={25}
                        showPdfSelected
                        loading={uploading}
                        buttonType="button"
                    />

                    <div className="mt-4 flex justify-end gap-2">
                        <FDButton
                            variant="outline"
                            color="neutral"
                            onClick={() => {
                                if (!uploading) onClose();
                            }}
                            disabled={uploading}
                        >
                            Annulla
                        </FDButton>
                        <FDButton
                            variant="outline"
                            color="success"
                            onClick={onSubmit}
                            disabled={uploading}
                        >
                            {uploading ? "Caricamento..." : "Carica CSV"}
                        </FDButton>
                    </div>
                </FDBox>
            </div>
        </div>
    );
};

export default UploadPanel;
