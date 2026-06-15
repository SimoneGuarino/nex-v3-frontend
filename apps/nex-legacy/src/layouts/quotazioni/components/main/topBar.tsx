import { FDBox } from "@nex/fd-ui";
import FDButton from "components/UI/buttons/FDButton";
import FDIconButton from "components/UI/buttons/FDIconButton";
import FDSearchPanel, { FilterChip, SearchItem } from "components/UI/search/FDSearchPanel";
import { enqueueSnackbar } from "components/MessageBox";
import type { QuotazioneDTO, Scope } from "layouts/quotazioni/types/quotations";
import { memo, useCallback, useMemo } from "react";
import { MdSearch, MdFilterList } from 'react-icons/md';
import { IoEyeOutline } from "react-icons/io5";

const MdFilterListIcon = MdFilterList as React.FC<{ size?: number; className?: string }>;
const MdSearchIcon = MdSearch as React.FC<{ size?: number; className?: string }>;
const IoEyeOutlineIcon = IoEyeOutline as React.FC<{ size?: number; className?: string }>;

interface FiltersProps {
    loading: boolean;
    deletingId: string | null;
    creating: boolean;
    menuRef: React.MutableRefObject<any>;
    chips: FilterChip[];
    scope: Scope;
    isAgents: boolean;
    isAdmin: boolean;
    setScope: (s: Scope) => void;
    setCreateOpen: (o: boolean) => void;
    runFetch: () => void;
    setOpenFilters: (o: boolean) => void;
    openSearch: boolean;
    setOpenSearch: (o: boolean) => void;
    advancedSearchQuery: string;
    advancedSearchRows: QuotazioneDTO[];
    advancedSearchLoading: boolean;
    onAdvancedSearchQueryChange: (query: string) => void;
    onStopAdvancedSearch: () => void;
    onSelectAdvancedQuotation: (progNum: number) => void;
    onOpenQuotationDetails: (quotationId: string) => void;
};

const Filters: React.FC<FiltersProps> = ({
    loading,
    deletingId,
    creating,
    menuRef,
    chips,
    scope,
    isAgents,
    isAdmin,
    setScope,
    setCreateOpen,
    runFetch,
    setOpenFilters,
    openSearch,
    setOpenSearch,
    advancedSearchQuery,
    advancedSearchRows,
    advancedSearchLoading,
    onAdvancedSearchQueryChange,
    onStopAdvancedSearch,
    onSelectAdvancedQuotation,
    onOpenQuotationDetails,
}) => {
    const formatProgNum = useCallback((progNum?: number) => {
        if (typeof progNum !== "number" || !Number.isFinite(progNum)) return "-";
        return String(progNum).padStart(4, "0");
    }, []);

    const searchItems = useMemo<SearchItem<QuotazioneDTO>[]>(() => {
        return advancedSearchRows.map((row) => {
            const clienteValue =
                typeof row?.cliente === "string"
                    ? row.cliente
                    : ((row as any)?.cliente?.ragione_sociale ?? (row as any)?.cliente?.codice?.Focelda ?? "");

            const subtitle = [
                `ID ${formatProgNum(row?.prog_num)}`,
                row?.tipologia ?? "",
                row?.stato ?? "",
                clienteValue || (row?.tipologia === "BID_PASSIVO" ? "Cliente non ancora registrato" : "-"),
            ]
                .filter(Boolean)
                .join(" • ");

            return {
                id: row?._id ?? `${row?.prog_num ?? "N/A"}-${row?.titolo ?? ""}`,
                title: row?.titolo?.trim() || `Quotazione ${formatProgNum(row?.prog_num)}`,
                subtitle,
                payload: row,
                actions: [
                {
                    label: "Apri Dettagli",
                    icon: <IoEyeOutlineIcon size={18} />,
                    onAction: (q: QuotazioneDTO, e: React.MouseEvent<HTMLButtonElement>) => {
                        const quotationId = String(q?._id ?? "").trim();
                        if (!quotationId) {
                            enqueueSnackbar("Impossibile aprire i dettagli: ID quotazione non valido.", {
                                title: "Ops..",
                                type: "error",
                            });
                            return;
                        }
                        onStopAdvancedSearch();
                        setOpenSearch(false);
                        onOpenQuotationDetails(quotationId);
                    }
                }],
            };
        });
    }, [advancedSearchRows, formatProgNum, onOpenQuotationDetails, onStopAdvancedSearch, setOpenSearch]);

    const handleSelectSearchItem = useCallback((item: SearchItem<QuotazioneDTO>) => {
        const row = item?.payload as QuotazioneDTO | undefined;
        const progNum = Number(row?.prog_num);

        if (!Number.isFinite(progNum) || progNum <= 0) {
            enqueueSnackbar("Impossibile aprire la quotazione selezionata: ID progressivo non valido.", {
                title: "Ops..",
                type: "error",
            });
            return;
        }

        onSelectAdvancedQuotation(progNum);
        onStopAdvancedSearch();
        setOpenSearch(false);
    }, [onSelectAdvancedQuotation, onStopAdvancedSearch, setOpenSearch]);

    return (
        <>
            <FDBox variant="gradient" border={true} radius="md" pad="sm" className="flex gap-2 px-6 justify-between items-center mb-2">
                {/* Filters */}
                <div className="flex items-center gap-1">
                    <div className="relative flex items-center" onClick={(e: any) => menuRef.current = e.currentTarget}>
                        <FDButton variant="outline" color='neutral' size="small" onClick={() => setOpenFilters(true)} data-tour="quotazioni-filter">
                            <MdFilterListIcon className="mr-1.5" /> Filtri {chips.length > 0 && (
                                <span
                                    data-tooltip-id='general-quotations-tooltip'
                                    data-tooltip-content={`${chips.length} filtr${chips.length > 1 ? "i" : "o"} attiv${chips.length > 1 ? "i" : "o"} - ${chips.map(c => c.label).join(", ")}`}
                                    className="text-xs text-sky-500 ml-1 font-bold">({chips.length})</span>
                            )}
                        </FDButton>
                    </div>

                    <FDIconButton
                        variant="outline"
                        rounded='md'
                        data-tour="quotazioni-ricerca-mirata"
                        dataTooltipContent="Ricerca Mirata"
                        // dataTooltipContent='[IN SVILUPPO] Ricerca Mirata - sarà possibile ricercare quotazioni in maniera smart, ricercando prodotti, buyer e altri criteri avanzati'
                        dataTooltipId='general-quotations-tooltip'
                        size='small'
                        onClick={() => setOpenSearch(true)} icon={<MdSearchIcon size={18} />} />
                </div>

                {(isAgents || isAdmin) && <FDButton
                    data-tour="quotazioni-topbar-new"
                    color="primary"
                    size="small"
                    dataTooltipContent="Crea una nuova quotazione"
                    dataTooltipId="general-quotations-tooltip"
                    disabled={loading || !!deletingId || creating}
                    onClick={() => setCreateOpen(true)}
                >
                    Nuova Quotazione
                </FDButton>}
            </FDBox>

            <FDSearchPanel
                open={openSearch}
                onClose={() => {
                    onStopAdvancedSearch();
                    setOpenSearch(false);
                }}
                query={advancedSearchQuery}
                onQueryChange={onAdvancedSearchQueryChange}
                loading={advancedSearchLoading}
                items={searchItems}
                onSelect={handleSelectSearchItem}
                placeholder="Ricerca avanzata quotazioni (cliente, prodotto, ID, titolo...)"
                emptyLabel="Inizia a digitare per cercare nelle quotazioni."
                emptyNoResultsLabel="Nessuna quotazione trovata per questa ricerca."
                appliedFilters={chips}
                recentSearch={{ enabled: true, cookieName: "quotazioni_advanced_recent", limit: 10 }}
            />
        </>
    );
};

export default memo(Filters);
