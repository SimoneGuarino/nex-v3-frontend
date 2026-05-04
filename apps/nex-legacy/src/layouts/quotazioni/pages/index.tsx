import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckAdminPermissions } from "utils";
import { useNavigate } from "react-router-dom";

import ContextMenu from "components/UI/menu/ContextMenu";
import { useQuotation } from "../hook/useQuotation";
import { Tooltip } from "react-tooltip";
import Filters from "../components/main/filters";
import TopBar from "../components/main/topBar";
import { FilterChip } from "components/UI/search/FDSearchPanel";
import type { FDSelectOption } from "components/UI/input/FDSelect";
import { useGeneralDataContext } from "context/GeneralDataContext";

import { TfiTime } from "react-icons/tfi";
import { FcApproval } from "react-icons/fc";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { CiSquarePlus } from "react-icons/ci";
import { IoEyeOutline } from "react-icons/io5";
import { MdOutlineDelete } from "react-icons/md";
import { PiInvoiceLight } from "react-icons/pi";

import EmptyState from "layouts/documentiPDF/components/EmptyState";
import LoadingState from "layouts/documentiPDF/components/LoadingState";
import TableSubObj from "../components/main/TableSubObj";
import { enqueueSnackbar } from "components/MessageBox";
import { deleteQuotationData } from "../fetchdata/destroy/deleteQuotationData";
import { createQuotationData } from "../fetchdata/create/createQuotationData";
import CreateQuotationModal, { FormStateProps } from "../components/createQuotation";
import StatsPanel from "../components/StatsPanel";
import { OkLinksSidePanel } from "../components/OkLinksSidePanel";


// ——————————————————————————————————————————————————————————
// ICONS
// ——————————————————————————————————————————————————————————
const MdOutlineDeleteIcon = MdOutlineDelete as React.FC<{ size?: number; className?: string }>;
const IoEyeOutlineIcon = IoEyeOutline as React.FC<{ size?: number; className?: string }>;

const TfiTimerIcon = TfiTime as React.FC<{ size?: number; className?: string }>;
const FcApprovalIcon = FcApproval as React.FC<{ size?: number; className?: string }>;
const IoCloseCircleOutlineIcon = IoIosCloseCircleOutline as React.FC<{ size?: number; className?: string }>;
const CiSquarePlusIcon = CiSquarePlus as React.FC<{ size?: number; className?: string }>;
const PiInvoiceLightIcon = PiInvoiceLight as React.FC<{ size?: number; className?: string }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
export const q_state = [
    { value: "APERTA", icon: <TfiTimerIcon className="text-orange-400 size-5" /> },
    { value: "KO", icon: <IoCloseCircleOutlineIcon className="text-red-500 size-6" /> },
    { value: "ANNULLATA", icon: <IoCloseCircleOutlineIcon className="text-red-500 size-6" /> },
    { value: "OK", icon: <FcApprovalIcon className="size-6" /> },
];

export interface QuotationType {
    value: string;
    icon: React.ReactNode;
    description: string;
    onlyForBuyers?: boolean;
};

export const mepaTypes = {
    value: "MEPA", icon: <CiSquarePlusIcon />, description: "È una richiesta per una gara con CIG o RDO o una fornitura per cui il cliente finale può essere individuato come un ente o, comunque, non come un rivenditore o una azienda provata/libero professionista"
};
export const quotationTypes: QuotationType[] = [
    { value: "STANDARD", icon: <CiSquarePlusIcon />, description: "Richiesta di quotazione per uno special price, per quantità o per esigenze commerciali, ricorda di valutare il prezzo trattaiva banco" },
    { value: "BID ATTIVO", icon: <CiSquarePlusIcon />, description: "Il commerciale richiede per conto del proprio cliente un BID. Per BID si intende una quotazione speciale, autorizzabile esclusivamente dal vendor. È necessario inserire nelle note i dati COMPLETI dell’utente finale" },
    { value: "BID PASSIVO", icon: <CiSquarePlusIcon />, onlyForBuyers: true, description: "IL Vendor comunica al buyer/commerciale una quotazione speciale dedicata ad un cliente – passivo perché è il vendor che ha gestito la quotazione direttamente con cliente" },
    { value: "CTO", icon: <CiSquarePlusIcon />, description: "È una richiesta di quotazione che prevede una configurazione ad hoc (dividere CTO nostri da brand)" },
    { value: "LICENZE", icon: <CiSquarePlusIcon />, description: "Licenze Software" },
];

export type OnCreateRequestType = {
    titolo: string;
    note?: string;
    type: string;
    // Opzionale per supportare BID_PASSIVO senza cliente selezionato.
    // In quel caso il FE non invia il campo e il BE applica il placeholder.
    customer?: string; //CustomerQuickDetailsDTO;
    dateFrom?: string;
    dateTo?: string;
    extraForm?: Record<string, any>; // campi dinamici extra da form di creazione (es. data scadenza, configurazione CTO, ecc.)
};

/**
 * Calcola i giorni mancanti alla scadenza della quotazione.
 * Fonti supportate (in ordine): finestraValidita.fine -> scadenza -> dateTo.
 * Ritorna:
 * - numero < 0: quotazione gia scaduta
 * - numero 0..5: quotazione in scadenza
 * - numero > 5: quotazione ancora valida
 * - null: data assente o non valida
 * Il confronto e fatto a livello giorno (non ora) per evitare mismatch da timezone.
 */
function getDaysToExpiry(row: any): number | null {
    const raw = row?.finestraValidita?.fine ?? row?.scadenza ?? row?.dateTo;
    if (!raw) return null;

    const expiry = new Date(raw);
    if (Number.isNaN(expiry.getTime())) return null;

    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endExpiry = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate(), 23, 59, 59, 999);
    const msPerDay = 24 * 60 * 60 * 1000;

    return Math.ceil((endExpiry.getTime() - startToday.getTime()) / msPerDay);
}


// ——————————————————————————————————————————————————————————
// MAIN FUNCTION
// ——————————————————————————————————————————————————————————
export function Quotazioni() {
    const {
        userState,
        items, setRaw,
        scope, setScope,

        openTableRowSettings, setOpenTableRowSettings,
        openFilters, setOpenFilters,
        openSearch, setOpenSearch,
        contextMenuRef,

        openOkLinksPanel, setOpenOkLinksPanel,
        okLinks, setOkLinks,
        fetchQuotationOkLinks,

        setSelectedQuotationId,

        dateFrom, setDateFrom,
        dateTo, setDateTo,
        filterType, setFilterType,
        filterState, setFilterState,
        filterId, setFilterId,
        priceFrom, setPriceFrom,
        priceTo, setPriceTo,
        filterBuyerCode, setFilterBuyerCode,
        filterAgenteId, setFilterAgenteId,

        counts,
        isSelected, toggleSelect,
        // dati e metodi per il fetching
        runFetch,
        runAdvancedSearch,
        stopAdvancedSearch,

        loading, setLoading, infiniteScroll, buildApiFilters,
        inpagination,
        advancedSearchQuery,
        advancedSearchRows,
        advancedSearchLoading,
    } = useQuotation();
    const { globalData } = useGeneralDataContext();
    const navigate = useNavigate();

    const userDetails = userState?.details ?? null;
    const isAgent = CheckAdminPermissions({
        userRole: userState?.details?.ruolo ?? "N/A",
        permissions: userState?.details?.permissions,
        rolesToCheck: [0, 1, 3], // Admin, Developer, Commerciale
        panelToCheck: 'dettagli_quotazione',
    });
    const buyerLabelByCode = useMemo(() => {
        const out = new Map<string, string>();
        for (const buyer of globalData?.buyers ?? []) {
            const code = String(buyer?.codici?.buyer ?? "").trim();
            if (!code) continue;
            const fullName = [buyer?.nome, buyer?.cognome].filter(Boolean).join(" ").trim();
            out.set(code, fullName ? `${code} - ${fullName}` : code);
        }
        return out;
    }, [globalData?.buyers]);

    const agentLabelById = useMemo(() => {
        const out = new Map<string, string>();
        for (const agent of globalData?.agents ?? []) {
            const rawId = agent?._id ?? agent?.id;
            if (!rawId) continue;
            const id = String(rawId).trim();
            if (!id) continue;
            const fullName = [agent?.nome, agent?.cognome].filter(Boolean).join(" ").trim();
            const agentCode = String(agent?.codici?.agente ?? "").trim();
            const label = fullName || agentCode ? [agentCode, fullName].filter(Boolean).join(" - ") : id;
            out.set(id, label);
        }
        return out;
    }, [globalData?.agents]);

    const buyerOptions = useMemo<FDSelectOption<string>[]>(() => {
        const options = Array.from(buyerLabelByCode.entries())
            .sort((a, b) => a[1].localeCompare(b[1], "it"))
            .map(([value, label]) => ({ value, label }));

        return [{ value: "", label: "Tutti" }, ...options];
    }, [buyerLabelByCode]);

    const agentOptions = useMemo<FDSelectOption<string>[]>(() => {
        const options = Array.from(agentLabelById.entries())
            .sort((a, b) => a[1].localeCompare(b[1], "it"))
            .map(([value, label]) => ({ value, label }));

        return [{ value: "", label: "Tutti" }, ...options];
    }, [agentLabelById]);

    const abortRef = useRef<AbortController | null>(null);
    const delAbortRef = useRef<AbortController | null>(null);
    const createAbortRef = useRef<AbortController | null>(null);
    const lastExpiryAlertKeyRef = useRef<string>("");

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [creating, setCreating] = useState<boolean>(false);
    const [createOpen, setCreateOpen] = useState<boolean>(false);

    // chips per i filtri attivi
    // derivati dai filtri controllati
    // usati sia in TopBar che in DocumentsSearch
    const chips: FilterChip[] = [
        ...(filterType !== "" ? [{ key: "filterType", label: "Tipologia", value: filterType, onRemove: () => setFilterType("") }] : []),
        ...((dateFrom || dateTo) ? [{
            key: "daterange",
            label: "Data",
            value: `${dateFrom ?? "…"} → ${dateTo ?? "…"} `,
            onRemove: () => { setDateFrom(""); setDateTo(""); }
        }] : []),
        ...((priceFrom || priceTo) ? [{
            key: "priceRange",
            label: "Valore",
            value: `${priceFrom || "…"}€ → ${priceTo || "…"}€`,
            onRemove: () => { setPriceFrom(""); setPriceTo(""); }
        }] : []),
        ...(filterId ? [{
            key: "filterId",
            label: "ID",
            value: filterId,
            onRemove: () => setFilterId(""),
        }] : []),
        ...(filterBuyerCode ? [{
            key: "filterBuyerCode",
            label: "Buyer",
            value: buyerLabelByCode.get(filterBuyerCode) ?? filterBuyerCode,
            onRemove: () => setFilterBuyerCode(""),
        }] : []),
        ...(filterAgenteId ? [{
            key: "filterAgenteId",
            label: "Agente",
            value: agentLabelById.get(filterAgenteId) ?? filterAgenteId,
            onRemove: () => setFilterAgenteId(""),
        }] : []),

    ];

    // Elabora l'elenco ricevuto dal BE e mostra un avviso solo per quotazioni "in scadenza".
    // Le quotazioni gia scadute non generano popup: sono gia evidenziate in rosso in tabella.
    // Questa funzione viene chiamata dal callback onComplete di runFetch.
    const notifyExpirySummary = (rows: any[]) => {
        if (!Array.isArray(rows) || rows.length === 0) return;

        const summary = rows.reduce(
            (acc, row: any) => {
                const daysToExpiry = getDaysToExpiry(row);
                if (daysToExpiry === null) return acc;

                const progNumLabel = (() => {
                    const n = row?.prog_num;
                    if (typeof n !== "number" || !Number.isFinite(n)) return null;
                    return String(n).padStart(4, "0");
                })();

                if (daysToExpiry >= 0 && daysToExpiry <= 5) {
                    acc.expiringSoon += 1;
                    if (progNumLabel) acc.expiringIds.push(progNumLabel);
                }
                return acc;
            },
            { expiringSoon: 0, expiringIds: [] as string[] }
        );

        // Deduplica: se lo stesso riepilogo "in scadenza" e gia stato mostrato, non notifichiamo di nuovo.
        if (summary.expiringSoon === 0) return;
        const alertKey = `${summary.expiringSoon}-${summary.expiringIds.join("|")}`;
        if (lastExpiryAlertKeyRef.current === alertKey) return;
        lastExpiryAlertKeyRef.current = alertKey;

        const formatIds = (ids: string[]) => {
            const MAX_IDS_IN_MESSAGE = 5;
            if (!ids.length) return "N/D";
            if (ids.length <= MAX_IDS_IN_MESSAGE) return ids.join(", ");
            // Limitiamo il testo popup per leggibilita: prime 5 quotazioni + conteggio residue.
            return `${ids.slice(0, MAX_IDS_IN_MESSAGE).join(", ")} +${ids.length - MAX_IDS_IN_MESSAGE} altre`;
        };

        enqueueSnackbar(
            <span>
                Quotazioni in scadenza: <strong>{formatIds(summary.expiringIds)}</strong>
            </span>,
            { title: "Scadenze quotazioni", type: "warning" }
        );

    };

    const onDelete = (quotationId: string, currentStato?: string) => {
        try { delAbortRef.current?.abort(); } catch { }
        delAbortRef.current = new AbortController();
        setDeletingId(quotationId);

        deleteQuotationData({
            abortController: delAbortRef.current,
            user: userState,
            quotationId,
            currentStato, // guard FE
            HandleComplete: () => {
                setDeletingId(null);
                // Dopo delete, ricarichiamo la lista e rivalutiamo il riepilogo scadenze.
                // Usiamo force=true per bypassare la cache e riflettere subito la delete in tabella.
                runFetch(buildApiFilters(), { force: true, onComplete: (res) => notifyExpirySummary(res.data) });
            },
            HandleError: (msg) => {
                setDeletingId(null);
                enqueueSnackbar(msg ?? "Errore durante l’eliminazione della quotazione.", {
                    title: 'Ops..',
                    type: 'error',
                });
            },
        }).catch((e) => {
            if (e?.name !== "AbortError") {
                setDeletingId(null);
                enqueueSnackbar("Errore durante l’eliminazione della quotazione.", {
                    title: 'Ops..',
                    type: 'error',
                });
            }
        });
    };

    const onCreate = ({ titolo, note, type, customer, dateTo, extraForm, resetStates }: OnCreateRequestType & { resetStates: () => void }) => {
        createAbortRef.current?.abort();
        createAbortRef.current = new AbortController();
        setCreating(true);

        // elimina i campi strighe vuote o nulle in extraForm per evitare confusione con i filtri lato BE (es. dateTo: "" viene interpretato come "tutte le date", mentre dateTo: null viene interpretato come "date senza valore")
        // anche per gli elementi negli oggetti annidati in extraForm (es. configurazione CTO)
        const cleanedExtraForm = Object.entries(extraForm ?? {}).reduce((acc, [key, value]) => {
            if (typeof value === "string") {
                const trimmed = value.trim();
                if (trimmed !== "") {
                    acc[key] = trimmed;
                }
            } else if (typeof value === "object" && value !== null) {
                const cleanedNested = Object.entries(value).reduce((nestedAcc, [nestedKey, nestedValue]) => {
                    if (typeof nestedValue === "string") {
                        const trimmedNested = nestedValue.trim();
                        if (trimmedNested !== "") {
                            nestedAcc[nestedKey] = trimmedNested;
                        }
                    } else if (nestedValue !== null && nestedValue !== undefined) {
                        nestedAcc[nestedKey] = nestedValue;
                    }
                    return nestedAcc;
                }, {} as Record<string, any>);
                if (Object.keys(cleanedNested).length > 0) {
                    acc[key] = cleanedNested;
                }
            } else if (value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>);

        createQuotationData({
            abortController: createAbortRef.current,
            user: userState,
            payload: { titolo, note, type, customer, dateTo, extraForm: cleanedExtraForm },
            HandleComplete: () => {
                setCreating(false);
                setCreateOpen(false);
                // Dopo create, ricarichiamo la lista e aggiorniamo l'avviso scadenze.
                // Usiamo force=true per bypassare la cache e mostrare subito la nuova quotazione.
                runFetch(buildApiFilters(), { force: true, onComplete: (res) => notifyExpirySummary(res.data) });
                resetStates();
            },
            HandleError: (msg) => {
                setCreating(false);
                enqueueSnackbar(msg ?? "Errore durante la creazione della quotazione.", {
                    title: 'Ops..',
                    type: 'error',
                });
            },
        }).catch((e) => {
            if (e?.name !== "AbortError") {
                setCreating(false);
                enqueueSnackbar("Errore durante la creazione della quotazione.", {
                    title: 'Ops..',
                    type: 'error',
                });
            }
        });
    };

    // Cambia lo stato del overview data del pannello in base all'elemento cliccato nella tabella
    const viewItem = () => {
        if (!openTableRowSettings) return;
        const item: any = openTableRowSettings.allData[openTableRowSettings.indexRow];
        navigate(`/quotazioni/${item._id}`);
    };
    const deleteItem = () => {
        if (!openTableRowSettings) return;
        const item: any = openTableRowSettings.allData[openTableRowSettings.indexRow];
        onDelete(item._id, item.stato);
    };

    useEffect(() => {
        if (!userState?.token || !userDetails) return;

        // Fetch principale lista quotazioni con filtri correnti.
        // La callback onComplete usa i dati appena ricevuti per notificare eventuali scadenze.
        // Forziamo il primo fetch della pagina per evitare dati stantii da cache
        // quando si rientra dai dettagli dopo modifiche (es. cambio cliente placeholder).
        runFetch(buildApiFilters(), { force: true, onComplete: (res) => notifyExpirySummary(res.data) });

        return () => {
            try { abortRef.current?.abort(); } catch { }
            try { delAbortRef.current?.abort(); } catch { }
            try { createAbortRef.current?.abort(); } catch { }
        };
    }, [userState?.token, userDetails, filterState, filterType, filterId, dateFrom, dateTo, priceFrom, priceTo, filterBuyerCode, filterAgenteId]);


    return (
        <DashboardLayout>
            <main className="flex flex-col flex-1 min-h-full w-full overflow-hidden">
                {/* Header */}
                {/* merge eseguito con combinazione. potrebbero essere presenti cose inutili */}
                <TopBar loading={loading.general_data} deletingId={deletingId} creating={creating}
                    // Refresh manuale da topbar: ricarica dati e riepilogo scadenze.
                    setCreateOpen={setCreateOpen} runFetch={() => runFetch(buildApiFilters(), { force: true, onComplete: (res) => notifyExpirySummary(res.data) })} menuRef={contextMenuRef}
                    setOpenFilters={setOpenFilters} setOpenSearch={setOpenSearch} openSearch={openSearch}
                    advancedSearchQuery={advancedSearchQuery}
                    advancedSearchRows={advancedSearchRows}
                    advancedSearchLoading={advancedSearchLoading}
                    onAdvancedSearchQueryChange={(query: string) => runAdvancedSearch(query, buildApiFilters())}
                    onStopAdvancedSearch={stopAdvancedSearch}
                    onSelectAdvancedQuotation={(progNum: number) => {
                        setFilterId(String(progNum).padStart(4, "0"));
                        runFetch({
                            ...buildApiFilters(),
                            prog_num: progNum,
                        });
                    }}
                    onOpenQuotationDetails={(quotationId: string) => {
                        navigate(`/quotazioni/${quotationId}`);
                    }}
                    chips={chips} scope={scope} setScope={setScope} isAgents={isAgent} />
                <StatsPanel userDetails={userDetails} />

                {!loading.general_data ?
                    counts.raw === 0 ? (
                        // non è arrivato proprio nulla
                        <EmptyState text="Nessuna quotazione trovata." />
                    ) : (!loading.general_data && counts.flat === 0 ? (
                        // ci sono dati 'raw', ma i filtri/ambito li hanno esclusi
                        <EmptyState text="Nessuna quotazione trovata. Prova a cambiare i filtri." />
                    ) : ((!loading.general_data && items.length !== 0) &&
                        <div className="flex-1 min-h-0 w-full min-w-0">
                            <TableSubObj data={items} loading={loading} isBuyer={!isAgent}
                                contextMenuRef={contextMenuRef}
                                handleOpenSettings={({ indexRow, allData }) => setOpenTableRowSettings({ indexRow, allData })}
                                setData={setRaw}
                                isSelected={isSelected}
                                onSelect={toggleSelect}
                                inpagination={inpagination as any}
                                onLoadMore={infiniteScroll}
                            />
                        </div>
                    ))
                    : <LoadingState />}
            </main>

            {isAgent && <CreateQuotationModal
                open={createOpen}
                loading={creating}
                onClose={() => !creating && setCreateOpen(false)}
                onCreate={onCreate}
                isMEPAUser={userDetails?.isMEPA}
            />}

            {/* Context Menu per i filtri */}
            <ContextMenu
                openFor={openFilters || Boolean(openTableRowSettings)}
                pos={contextMenuRef}
                onClose={() => { setOpenFilters(false); setOpenTableRowSettings(null); }}
                menuButtons={[
                    {
                        title: 'Apri Dettagli',
                        icon: <IoEyeOutlineIcon size={20} />,
                        onClick: viewItem,
                    },
                    ...((openTableRowSettings?.allData[openTableRowSettings.indexRow]?.final_outcome &&
                        openTableRowSettings?.allData[openTableRowSettings.indexRow]?.final_outcome.ok_links_stats &&
                        openTableRowSettings?.allData[openTableRowSettings.indexRow]?.final_outcome.ok_links_stats.links_count > 0)
                        ? [{
                            title: 'Visualizza FB & OC collegati',
                            icon: <PiInvoiceLightIcon size={20} />,
                            onClick: () => {
                                const item: any = openTableRowSettings.allData[openTableRowSettings.indexRow];
                                fetchQuotationOkLinks(item._id);
                                setOpenOkLinksPanel(true);
                            },
                        }] : []),

                    ...(openTableRowSettings?.allData[openTableRowSettings.indexRow]?.stato == 'BOZZA' ? [{
                        title: 'Elimina Quotazione',
                        icon: <MdOutlineDeleteIcon size={20} />,
                        onClick: deleteItem,
                    }] : []),
                ]}
                panel={
                    openTableRowSettings ? null :
                        <Filters
                            dateFrom={dateFrom} setDateFrom={setDateFrom}
                            dateTo={dateTo} setDateTo={setDateTo}
                            filterType={filterType} setFilterType={setFilterType}
                            filterState={filterState} setFilterState={setFilterState}
                            filterId={filterId} setFilterId={setFilterId}
                            priceFrom={priceFrom} setPriceFrom={setPriceFrom}
                            priceTo={priceTo} setPriceTo={setPriceTo}
                            filterBuyerCode={filterBuyerCode} setFilterBuyerCode={setFilterBuyerCode}
                            filterAgenteId={filterAgenteId} setFilterAgenteId={setFilterAgenteId}
                            buyerOptions={buyerOptions}
                            agentOptions={agentOptions}
                        />
                }
            />

            <OkLinksSidePanel
                open={openOkLinksPanel}
                onClose={() => setOpenOkLinksPanel(false)}
                onRefresh={() => {
                    if (!openTableRowSettings) return;
                    const item: any = openTableRowSettings.allData[openTableRowSettings.indexRow];
                    fetchQuotationOkLinks(item._id);
                }}
                loading={Boolean(loading.get_quotation_ok_links)}
                items={okLinks}
            />

            <Tooltip id="general-quotations-tooltip" place="bottom" className="max-w-[15vw] min-w-[150px] !text-xs text-center z-50 !rounded-md" />
        </DashboardLayout>
    );
}

export default Quotazioni;