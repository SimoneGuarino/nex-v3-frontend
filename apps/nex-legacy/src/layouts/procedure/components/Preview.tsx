import React, { useEffect, useRef, useState } from "react";
import FDBox from "components/UI/box/FDBox";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { IoMdDownload } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import type { ProcedureFileInfo } from "../fetchdata/list";
import { fetchPreviewFile } from "../fetchdata/preview";
import { useTour } from "tour/TourProvider";

const DownloadIcon = IoMdDownload as React.FC<{ size?: number; className?: string }>;
const CloseIcon = IoClose as React.FC<{ size?: number; className?: string }>;

// formatter stabili
const DTF = new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" });
const NF_MB = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "-";
  return DTF.format(t);
}
function formatSizeMB(size?: number): string {
  if (typeof size !== "number") return "-";
  return `${NF_MB.format(size)} MB`;
}

const TEXT_EXT = new Set(["txt", "csv", "log", "json"]);
const IMG_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

function isPreviewableExt(ext: string): boolean {
  return ext === "pdf" || TEXT_EXT.has(ext) || IMG_EXT.has(ext);
}

interface PreviewProps {
  open: boolean;
  file: ProcedureFileInfo | null;
  categoria: string;
  onClose: () => void;
  onDownload?: () => void;
  downloading?: boolean;
}

export const Preview: React.FC<PreviewProps> = ({ open, file, categoria, onClose, onDownload, downloading }) => {
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const previewAbortRef = useRef<AbortController | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const { isOpen, index: tourIndex } = useTour();
  const lockInteractions = isOpen && tourIndex === 9;

  useEffect(() => {
    if (!open || !file) return;

    setPreviewError(null);
    setPreviewText(null);
    setPreviewUrl(null);

    const extLc = (file.estensione || "").toLowerCase();
    if (!isPreviewableExt(extLc)) {
      setPreviewLoading(false);
      setPreviewError("Anteprima non disponibile per questo tipo di file.");
      return;
    }

    setPreviewLoading(true);

    const body = { nome: file.nome, categoria, estensione: file.estensione };

    fetchPreviewFile(body, previewAbortRef as any)
      .then(async (res) => {
        if (res.kind !== "blob") throw new Error("Risposta inattesa dal server.");

        if (TEXT_EXT.has(extLc)) {
          const text = await res.blob.text();
          setPreviewText(text);
          return;
        }

        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

        const objectUrl = URL.createObjectURL(res.blob);
        previewUrlRef.current = objectUrl;
        setPreviewUrl(objectUrl);
      })
      .catch((err: any) => {
        if (err?.name === "AbortError") return;
        console.error(err);
        setPreviewError("Anteprima non disponibile.");
      })
      .finally(() => setPreviewLoading(false));

    return () => {
      previewAbortRef.current?.abort();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [open, file?.nome, file?.estensione, categoria]);

  if (!open || !file) return null;

  const extLc = (file.estensione || "").toLowerCase();

  let content: React.ReactNode = null;

  if (previewLoading) {
    content = (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-neutral-300 border-t-neutral-500 animate-spin" />
      </div>
    );
  } else if (previewError) {
    content = (
      <div className="w-full h-full flex items-center justify-center px-4 text-center">
        <div className="space-y-2">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">{previewError}</p>
          <p className="text-xs text-neutral-500">
            Usa il pulsante <b>Scarica</b> per aprire il file localmente.
          </p>
        </div>
      </div>
    );
  } else if (previewText) {
    content = (
      <div className="w-full h-full overflow-auto rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700">
        <pre className="whitespace-pre-wrap text-xs md:text-sm p-4 font-mono text-neutral-800 dark:text-neutral-200">
          {previewText}
        </pre>
      </div>
    );
  } else if (previewUrl) {
    if (extLc === "pdf") {
      content = (
        <iframe
          src={previewUrl}
          title={file.nome}
          className="w-full h-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white"
        />
      );
    } else if (IMG_EXT.has(extLc)) {
      content = (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={previewUrl}
            alt={file.nome}
            className="max-w-full max-h-full rounded-xl border border-neutral-200 dark:border-neutral-700 object-contain"
          />
        </div>
      );
    } else {
      content = (
        <div className="w-full h-full flex items-center justify-center px-4 text-center">
          <div className="space-y-2">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">Anteprima non disponibile.</p>
            <p className="text-xs text-neutral-500">
              Usa <b>Scarica</b> per aprire il file localmente.
            </p>
          </div>
        </div>
      );
    }
  } else {
    content = (
      <div className="w-full h-full flex items-center justify-center px-4 text-center">
        <div className="space-y-2">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">Anteprima non disponibile.</p>
          <p className="text-xs text-neutral-500">
            Usa <b>Scarica</b> per aprire il file localmente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-[95vw] max-w-8xl h-[80vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        <FDBox
          fullWidth
          className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60"
        >
          <div className="flex items-start flex-col gap-1 min-w-0" data-tour="procedure-preview-dettagli">
            <span className="text-xs uppercase tracking-wide text-neutral-500">{categoria}</span>

            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-sm md:text-base truncate">{file.nome}</p>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] text-neutral-500">
              <span>Ultima modifica: {formatDate(file.ultima_modifica)}</span>
              <span>Dimensione: {formatSizeMB(file.dimensione)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lockInteractions && (
              <div
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "auto" }}
                onClickCapture={(e) => e.stopPropagation()}
              />
            )}

            <FDIconButton
              dataTour="procedure-preview-scarica"
              icon={<DownloadIcon />}
              onClick={onDownload}
              disabled={downloading || !onDownload}
            />

            <FDIconButton dataTour="procedure-preview-chiudi" icon={<CloseIcon />} onClick={onClose} variant="danger" />
          </div>
        </FDBox>

        <div className="flex-1 bg-neutral-100 dark:bg-neutral-900/80 p-4 overflow-y-auto" data-tour="procedure-preview-contenuto">
          <div className="w-full h-full rounded-xl bg-white dark:bg-neutral-950 border border-dashed border-neutral-300 dark:border-neutral-700 overflow-hidden">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;