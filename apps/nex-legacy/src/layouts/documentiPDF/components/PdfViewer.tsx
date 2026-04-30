// modules/documents/components/PdfViewer.tsx
// Native PDF viewer (iframe) version.
// Requirements: open + scroll, zoom base, print/download standard, no custom pagination/prefetch/thumbnails.
//
// Notes:
// - The browser's built-in PDF viewer provides zoom + print + download controls.
// - For endpoints requiring Bearer token headers, we resolve the source to a blob: URL (see usePdfDocument).

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdClose, MdOpenInNew, MdDownload } from "react-icons/md";
import FDIconButton from "components/UI/buttons/FDIconButton";
import FDBox from "components/UI/box/FDBox";
import type { PdfSource } from "../lib/openPdf";
import { usePdfDocument } from "../hooks/usePdfDocument";

const MdCloseIcon = MdClose as React.FC<{ size?: number; className?: string }>;
const MdOpenInNewIcon = MdOpenInNew as React.FC<{ size?: number; className?: string }>;
const MdDownloadIcon = MdDownload as React.FC<{ size?: number; className?: string }>;

type Props = {
    open: boolean;
    onClose: () => void;
    source: PdfSource;
    title?: string;
    onDownload?: () => void; // Optional: if you already have a backend download flow
};

const Toolbar: React.FC<{
    title?: string;
    viewerSrc: string | null;
    onClose: () => void;
    onDownload?: () => void;
}> = ({ title, viewerSrc, onClose, onDownload }) => {
    return (
        <FDBox
            radius="xl"
            variant="gradient"
            border={true}
            className="flex items-center gap-2 p-2"
        >
            <FDIconButton
                variant="text"
                onClick={onClose}
                icon={<MdCloseIcon size={18} />}
                dataTooltipId="general-documents-tooltip"
                dataTooltipContent="Chiudi"
            />

            {viewerSrc && (
                <>
                    <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                    <FDIconButton
                        variant="text"
                        onClick={() => window.open(viewerSrc, "_blank", "noopener,noreferrer")}
                        icon={<MdOpenInNewIcon size={18} />}
                        dataTooltipId="general-documents-tooltip"
                        dataTooltipContent="Apri in nuova scheda"
                    />

                    {onDownload && (
                        <FDIconButton
                            variant="text"
                            onClick={onDownload}
                            icon={<MdDownloadIcon size={18} />}
                            dataTooltipId="general-documents-tooltip"
                            dataTooltipContent="Scarica"
                        />
                    )}
                </>
            )}

            {title && (
                <>
                    <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
                    <span 
                        data-tooltip-id="general-documents-tooltip"
                        data-tooltip-content={title}
                        className="text-xs opacity-80 max-w-[340px] truncate">{title}</span>
                </>
            )}
        </FDBox>
    );
};

export const PdfViewer: React.FC<Props> = ({ open, onClose, source, title, onDownload }) => {
    const { viewerSrc, loading, error, cleanup } = usePdfDocument(open ? source : null);

    // Cleanup object URLs when modal closes
    React.useEffect(() => {
        if (!open) cleanup();
    }, [open, cleanup]);

    // ESC to close (consistent UX)
    React.useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (!open) return;
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[10] bg-black/60 backdrop-blur-sm w-full h-full p-4 flex flex-col gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <Toolbar title={title} viewerSrc={viewerSrc} onClose={onClose} onDownload={onDownload} />

                    {/* States */}
                    {loading && (
                        <div className="text-center mt-20 opacity-70 text-white/80">Caricamento PDF…</div>
                    )}
                    {error && <div className="text-center mt-20 text-red-300">{error}</div>}

                    {!loading && !error && viewerSrc && (
                        <div className="w-full h-full rounded-lg overflow-hidden bg-white">
                            {/* No sandbox: sandbox often breaks native PDF viewers */}
                            <iframe
                                title={title ?? "PDF"}
                                src={viewerSrc}
                                className="w-full h-full border-0"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    )}

                </motion.div>
            )}
        </AnimatePresence>
    );
};
