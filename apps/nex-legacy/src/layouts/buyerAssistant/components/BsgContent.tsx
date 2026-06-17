import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
//UI
import { FDIconButton, FDButton, FDInput } from "@nex/fd-ui";
//componenti
import { Markdown } from "layouts/AI/chat/module/markdown";
import { GetBsgAPI, CreateBsgAPI, UpdateBsgAPI } from "../fetchData/BsgList";
import BsgEditDialog from "./BsgEditDialog";
//types
import { BsgItem } from "../types/types";
// Icons
import { IoChevronForwardOutline, IoChevronDownOutline, IoRefreshOutline } from "react-icons/io5";
import { HiOutlineDocumentText } from "react-icons/hi";
import { MdEdit } from "react-icons/md";
import { FaPlus } from "react-icons/fa";

const ChevronRightIcon = IoChevronForwardOutline as React.FC<{ size?: number }>;
const ChevronDownIcon = IoChevronDownOutline as React.FC<{ size?: number }>;
const DocIcon = HiOutlineDocumentText as React.FC<{ size?: number }>;
const RefreshIcon = IoRefreshOutline as React.FC<{ size?: number; className?: string }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type BrandDoc = {
    _id?: any;
    Marca: string;
    PrefissiFornitore?: string[];
};

interface BsgItemCardProps {
    item: BsgItem;
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: (item: BsgItem) => void;
};

interface FornitoreGroupProps {
    codice: string;
    items: BsgItem[];
    expandedKey: string | null;
    onToggleItem: (key: string) => void;
    onEditItem: (item: BsgItem) => void;
};

export interface BsgContentProps {
    open: boolean;
    brands?: BrandDoc[];
    brandsLoading?: boolean;
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
// Raggruppa i BSG per codice_fornitore
function groupByFornitore(items: BsgItem[]): Record<string, BsgItem[]> {
    const map: Record<string, BsgItem[]> = {};
    for (const item of items) {
        const key = item.codice_fornitore || "Sconosciuto";
        if (!map[key]) map[key] = [];
        map[key].push(item);
    };
    return map;
};


// ——————————————————————————————————————————————————————————
// SUB-COMPONENTS
// ——————————————————————————————————————————————————————————
// Singolo BSG Item (espandibile con markdown)
const BsgItemCard: React.FC<BsgItemCardProps> = ({ item, isExpanded, onToggle, onEdit }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-100 dark:bg-neutral-700/50 rounded-lg overflow-hidden w-full min-w-0"
        >
            {/* Header - cliccabile per espandere */}
            <div
                onClick={onToggle}
                className="flex items-center gap-2 p-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-600/50 transition-colors min-w-0"
            >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <DocIcon size={18} />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-medium truncate">{item.bsg_tipologia_testo}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {item.codice_fornitore}
                    </p>
                </div>
                <div className="flex-shrink-0">
                    {isExpanded ? <ChevronDownIcon size={20} /> : <ChevronRightIcon size={20} />}
                </div>
                <FDIconButton
                    icon={MdEdit({})}
                    size="small"
                    dataTooltipId="buyer-assistant-tooltip"
                    dataTooltipContent="Modifica"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(item); }}
                />
            </div>

            {/* Contenuto espandibile - Markdown */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="border-t border-gray-200 dark:border-neutral-600 overflow-hidden min-w-0"
                    >
                        <div className="p-4 min-w-0 w-full">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                                Contenuto BSG
                            </p>
                            <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 max-h-80 overflow-auto min-w-0 w-full">
                                <div className="text-sm min-w-0 w-full">
                                    <Markdown text={item.bsg_testo || ""} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Gruppo fornitore (accordion)
const FornitoreGroup: React.FC<FornitoreGroupProps> = ({ codice, items, expandedKey, onToggleItem, onEditItem }) => {
    const [open, setOpen] = useState(true); //state per espandere un fornitore nella lista dei bsg

    return (
        <div className="w-full">
            <div
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-1 py-2 cursor-pointer select-none"
            >
                <div className="flex-shrink-0">
                    {open ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    {codice}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({items.length})
                </span>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-2 pl-2 overflow-hidden"
                    >
                        {items.map((item, idx) => {
                            const key = `${item.codice_fornitore}|${item.bsg_tipologia_testo}|${idx}`;
                            return (
                                <BsgItemCard
                                    key={key}
                                    item={item}
                                    isExpanded={expandedKey === key}
                                    onToggle={() => onToggleItem(key)}
                                    onEdit={onEditItem}
                                />
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
const BsgContent: React.FC<BsgContentProps> = ({ open, brands = [], brandsLoading = false }) => {
    const [bsgData, setBsgData] = useState<BsgItem[]>([]);//state per la lista dei bsg 
    const [loading, setLoading] = useState(false);// State di loading dei bsg
    const [expandedKey, setExpandedKey] = useState<string | null>(null);// State con la key del bsg da espandere
    const abortRef = useRef<AbortController>(new AbortController());// abort controller per cancellare le chiamate
    const fetchedRef = useRef(false); //evita chiamate ripetute
    const [dialogOpen, setDialogOpen] = useState(false);//state per aprire il pannello dei bsg
    const [editTarget, setEditTarget] = useState<BsgItem | null>(null); //state per prendere l'elemento da modificare
    const [dialogLoading, setDialogLoading] = useState(false); //state di loading per il pannello dei bsg

    const [query, setQuery] = useState("");//state per la ricerca dei bsg

    // Fetch al primo open
    useEffect(() => {
        if (!open || fetchedRef.current) return;
        fetchedRef.current = true;

        abortRef.current = new AbortController();
        GetBsgAPI({
            abortController: abortRef.current,
            setData: setBsgData,
            setLoading,
        });

        return () => {
            abortRef.current.abort();
        };
    }, [open]);

    const handleRefresh = () => {
        abortRef.current.abort();
        abortRef.current = new AbortController();
        setExpandedKey(null);
        GetBsgAPI({
            abortController: abortRef.current,
            setData: setBsgData,
            setLoading,
        });
    };

    const handleToggle = (key: string) => {
        setExpandedKey((prev) => (prev === key ? null : key));
    };


    // ——————————————————————————————————————————————————————————
    // ACTIONS
    // ——————————————————————————————————————————————————————————
    // Creazione
    const handleCreate = () => {
        setEditTarget(null);
        setDialogOpen(true);
    };

    // Modifica
    const handleEdit = (item: BsgItem) => {
        setEditTarget(item);
        setDialogOpen(true);
    };

    // Conferma dialog (create o edit)
    const handleDialogConfirm = (data: BsgItem) => {
        const ac = new AbortController();

        if (editTarget) {
            // PATCH — aggiorna solo bsg_testo
            UpdateBsgAPI({
                abortController: ac,
                payload: data,
                setLoading: setDialogLoading,
                onSuccess: (updated) => {
                    setBsgData((prev) =>
                        prev.map((item) =>
                            item.codice_fornitore === updated.codice_fornitore &&
                                item.bsg_tipologia_testo === updated.bsg_tipologia_testo
                                ? updated
                                : item
                        )
                    );
                    setDialogOpen(false);
                    setEditTarget(null);
                },
            });
        } else {
            // POST — crea nuovo
            CreateBsgAPI({
                abortController: ac,
                payload: data,
                setLoading: setDialogLoading,
                onSuccess: (created) => {
                    setBsgData((prev) => [...prev, created]);
                    setDialogOpen(false);
                    setEditTarget(null);
                },
            });
        }
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditTarget(null);
    };

    const grouped = groupByFornitore(bsgData);
    const fornitori = Object.keys(grouped).filter(x => x.toLowerCase().includes(query.toLowerCase())).sort();
    const supplierCodeOptions = React.useMemo(() => {
        const seen = new Set<string>();
        const options: { value: string; label: string }[] = [];

        (Array.isArray(brands) ? brands : []).forEach((b) => {
            const prefissi = Array.isArray((b as any).PrefissiFornitore) ? (b as any).PrefissiFornitore : [];
            prefissi.forEach((p: any) => {
                const code = String(p || "").trim();
                if (!code || seen.has(code)) return;
                seen.add(code);
                options.push({ value: code, label: code });
            });
        });

        return options.sort((a, b) => a.label.localeCompare(b.label, "it", { sensitivity: "base" }));
    }, [brands]);

    return (
        <div className="w-full flex flex-col gap-3 min-h-[200px]">
            {/* Header con refresh */}
            <div className="flex flex-col items-center w-full gap-1">
                <FDInput
                    placeholder="Cerca per codice fornitore..."
                    size="sm"
                    radius="md"
                    fullWidth
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <div className="flex items-center justify-between w-full">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {loading
                            ? "Caricamento..."
                            : `${fornitori.length ?? 0} BSG trovate`}
                    </span>
                    <div className="flex gap-2 items-center">
                        <FDButton
                            size="small"
                            radius="md"
                            variant="solid"
                            color="primary"
                            rightIcon={FaPlus({})}
                            onClick={handleCreate}
                        >
                            Nuovo
                        </FDButton>
                        <FDButton
                            size="small"
                            radius="md"
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={loading}
                            rightIcon={
                                <RefreshIcon
                                    size={14}
                                    className={loading ? "animate-spin" : ""}
                                />
                            }
                        >
                            Aggiorna
                        </FDButton>
                    </div>
                </div>
            </div>

            {/* Lista */}
            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full" />
                </div>
            ) : bsgData.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-gray-400 dark:text-gray-500 text-sm">
                    Nessuna BSG disponibile
                </div>
            ) : (
                fornitori.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-gray-400 dark:text-gray-500 text-sm">
                        Nessuna BSG trovata per "{query}"
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                        {fornitori.map((codice) => (
                            <FornitoreGroup
                                key={codice}
                                codice={codice}
                                items={grouped[codice]}
                                expandedKey={expandedKey}
                                onToggleItem={handleToggle}
                                onEditItem={handleEdit}
                            />
                        ))}
                    </div>
                )
            )}

            {/* Dialog creazione / modifica BSG */}
            <BsgEditDialog
                open={dialogOpen}
                initial={editTarget}
                supplierCodeOptions={supplierCodeOptions}
                supplierCodeLoading={brandsLoading}
                onClose={handleDialogClose}
                onConfirm={handleDialogConfirm}
                loading={dialogLoading}
            />
        </div>
    );
};

export default BsgContent;