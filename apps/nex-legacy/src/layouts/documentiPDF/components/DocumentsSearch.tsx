import React from "react";
import { DocumentItemMapped } from "../types";
import FDSearchPanel, { SearchItem, FilterChip } from "components/UI/search/FDSearchPanel";
import { MdFilePresent, MdDownload, MdShare, MdStarBorder, MdLink, MdOutlineEmail } from "react-icons/md";
import { LuView } from "react-icons/lu";

const MdFilePresentIcon = MdFilePresent as React.FC<{ size?: number, className?: string }>;
const MdDownloadIcon = MdDownload as React.FC<{ size?: number, className?: string }>;
const MdShareIcon = MdShare as React.FC<{ size?: number, className?: string }>;
const MdStarBorderIcon = MdStarBorder as React.FC<{ size?: number, className?: string }>;
const MdViewWeekIcon = LuView as React.FC<{ size?: number; className?: string }>;
const MdLinkIcon = MdLink as React.FC<{ size?: number; className?: string }>;
const MdEmailIcon = MdOutlineEmail as React.FC<{ size?: number; className?: string }>;

export default function DocumentsSearch({
    open,
    onClose,
    query,
    onQueryChange,
    results,
    onPick,
    loading,
    chips,
    downloadFiles,
    openPdfFor,
    setShareOpen,
    setShareEmailOpen,
    setSingleSelected,
    recent,
    setRecent,
    showCorrelated,
    toggleFavorite,
}: {
    open: boolean;
    onClose: (_e?: any, reason?: any) => void;
    query: string;
    onQueryChange: (q: string) => void;
    results: DocumentItemMapped[];
    onPick: (doc: DocumentItemMapped) => void;
    loading: boolean;
    chips?: FilterChip[];
    downloadFiles: (docs?: Array<string | DocumentItemMapped>) => void;
    openPdfFor: (doc: DocumentItemMapped) => void;
    setShareOpen: (open: boolean) => void;
    setShareEmailOpen: (open: boolean) => void;
    setSingleSelected: (doc: DocumentItemMapped[]) => void;
    recent: string[];
    setRecent: (terms: string[]) => void;
    showCorrelated: (doc?: DocumentItemMapped) => void;
    toggleFavorite: (id: string) => void;
}) {

    const showCorrelatedRef = React.useRef(showCorrelated);
    showCorrelatedRef.current = showCorrelated;

    const onCloseRef = React.useRef(onClose);
    onCloseRef.current = onClose;


    // mapping results → SearchItem
    const items: () => SearchItem<DocumentItemMapped>[] = () => {
        return results
            .map(d => {
                let subtitleParts = [d.company, d.codice_cliente, d.partita_iva, d.codice_fiscale];
                if (d.element_type !== "PERSON") {
                    subtitleParts = [d.type, d.company, new Date(d.date).toLocaleDateString()]
                };

                return {
                    id: d.id,
                    title: d.name,
                    subtitle: subtitleParts.filter(e => e).join(" • "),
                    iconLeft: d.icon ?? <MdFilePresentIcon className="text-blue-500" />,
                    payload: d,
                    actions: d.element_type !== "PERSON" ? [
                        { label: "Download", icon: <MdDownloadIcon />, onAction: (x: DocumentItemMapped) => downloadFiles([x]) },
                        { label: "Visualizza", icon: <MdViewWeekIcon />, onAction: (x: DocumentItemMapped) => openPdfFor(x) },
                        { label: "Condividi", icon: <MdShareIcon />, onAction: (x: DocumentItemMapped) => { setSingleSelected([x]); setShareOpen(true) } },
                        { label: "Condividi via mail", icon: <MdEmailIcon />, onAction: (x: DocumentItemMapped) => { setSingleSelected([x]); setShareEmailOpen(true) } },
                        { label: "Visualizza bolle↔fatture correlate", icon: <MdLinkIcon />, onAction: (x: DocumentItemMapped) => { showCorrelated(x); onClose() } },
                        // Anche nella ricerca mirata usiamo il toggle reale, così lo stato
                        // resta coerente con lista principale e persistenza localStorage.
                        { label: d.favorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti", icon: <MdStarBorderIcon />, onAction: (x: DocumentItemMapped) => toggleFavorite(x.id) },
                    ] : [],
                }
            });
    };

    return (
        <FDSearchPanel
            open={open}
            onClose={onClose}
            query={query}
            onQueryChange={onQueryChange}
            items={items()}
            appliedFilters={chips}
            highlight
            placeholder="Cerca documenti…"
            onSelect={(it: SearchItem<DocumentItemMapped>) => onPick(it.payload!)}
            recentSearch={{ enabled: true, cookieName: "fd_documentiPDF_recent_docs", limit: 10 }}
            id_tooltip="general-documents-tooltip"
            loading={loading}
            customRecent={recent}
            setCustomRecent={setRecent}
            /*renderFilters={
                <div className="flex gap-2 flex-wrap">
                    <select className="px-3 py-2 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800"
                        value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
                        <option value="all">Tutti i tipi</option>
                        <option value="Fattura">Fattura</option>
                        <option value="Ordine">Ordine</option>
                        <option value="DDT">DDT</option>
                        <option value="Contratto">Contratto</option>
                    </select>
                </div>
            }*/
        />
    );
};
