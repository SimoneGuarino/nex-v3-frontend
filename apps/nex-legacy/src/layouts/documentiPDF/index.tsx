import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getChatSocket } from '@nex/realtime-core';
const chatSocket = getChatSocket();
// external libraries
import { Tooltip } from 'react-tooltip';
// components
import TopBar from './components/TopBar';
import EmptyState from './components/EmptyState';
import { useDocuments } from './hooks/useDocuments';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import { ContextMenu } from 'components/UI/menu/ContextMenu';
import DocumentsVirtualView from './components/DocumentsVirtualView';
import DocumentCard from './components/DocumentCard';
import DocumentRow from './components/DocumentRow';
import DocumentsSearch from './components/DocumentsSearch';
import FiltersPanelInMenu from './components/Filters';
import { FilterChip } from 'components/UI/search/FDSearchPanel';
import LoadingState from './components/LoadingState';
// icons
import { MdCheck, MdArrowUpward, MdArrowDownward, MdViewComfy, MdViewCompact, MdGridView, MdViewList, MdPictureAsPdf, MdDownload, MdShare, MdLink, MdOutlineEmail } from 'react-icons/md';
import { PdfViewer } from './components/PdfViewer';
import { buildPdfUrl } from './lib/openPdf';
import { downloadPdfSingleAPI } from './lib/downloadDocuments';
import { downloadPdfBatch } from 'examples/Fetch/FetchFilePDF';
import { DocumentItemMapped, ScopeTab } from './types';
import FDSharePanel, { ShareDoc, ShareTarget } from 'components/UI/share/FDSharePanel';
import { useUserContext } from 'context/UserContext';
import { SearchUsersAPI } from 'examples/Navbars/components/chat/fetchData/search';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { enqueueSnackbar } from 'components/MessageBox';
import { ShareEmailAPI } from './fetchData/shareEmail';
import { LuView } from "react-icons/lu";

//tour
import { useSectionTour } from 'tour/useSectionTour';
import { Role } from 'tour/types';
import { FDBox } from '@nex/fd-ui';
import FDButton from 'components/UI/buttons/FDButton';

const MdCheckIcon = MdCheck as React.FC<{ size?: number; className?: string }>;
const MdArrowUpwardIcon = MdArrowUpward as React.FC<{ size?: number; className?: string }>;
const MdArrowDownwardIcon = MdArrowDownward as React.FC<{ size?: number; className?: string }>;
const MdViewComfyIcon = MdViewComfy as React.FC<{ size?: number; className?: string }>;
const MdViewCompactIcon = MdViewCompact as React.FC<{ size?: number; className?: string }>;
const MdGridViewIcon = MdGridView as React.FC<{ size?: number; className?: string }>;
const MdViewListIcon = MdViewList as React.FC<{ size?: number; className?: string }>;
const MdPictureAsPdfIcon = MdPictureAsPdf as React.FC<{ size?: number; className?: string }>
const MdViewWeekIcon = LuView as React.FC<{ size?: number; className?: string }>
const MdLinkIcon = MdLink as React.FC<{ size?: number; className?: string }>
const MdEmailIcon = MdOutlineEmail as React.FC<{ size?: number; className?: string }>
const MdDownloadIcon = MdDownload as React.FC<{ size?: number; className?: string }>
const MdShareIcon = MdShare as React.FC<{ size?: number; className?: string }>


const DocumentsPage: React.FC = () => {
    const location = useLocation();
    const {
        items,
        counts,
        view, setView,
        scope, setScope,
        sortBy, setSortBy,
        sortDir, setSortDir,
        groupBy, setGroupBy,
        selected, clearSelection,
        isSelected, toggleSelect,
        toggleFavorite,
        loading, loadingSearch, loadingMore,
        groupCounts, groupLabels,
        q,
        rawSearch,
        singleSelected, setSingleSelected,
        search, searchDebounced,
        recentSearch, setRecentSearch,
        filterType, setFilterType,
        filterCompany, setFilterCompany,
        dateFrom, setDateFrom,
        dateTo, setDateTo,
        filterCc, setFilterCc,
        filterCdar, setFilterCdar,

        filterDocId, setFilterDocId,
        filterDocNum, setFilterDocNum,

        openFiltersPanel, setOpenFiltersPanel,
        inpagination,
        setInpagination,
        correlatedTarget, setCorrelatedTarget,
    } = useDocuments();

    const [userContext] = useUserContext() as any;
    const { createPrivateChat } = useGeneralDataContext();

    const [openSearch, setOpenSearch] = React.useState(false);

    const [openGroup, setOpenGroup] = React.useState(false);
    const [openSort, setOpenSort] = React.useState(false);
    const [openView, setOpenView] = React.useState(false);
    const contextMenuRef = React.useRef<HTMLDivElement>(null);

    const [density, setDensity] = React.useState<'comfortable' | 'compact'>('comfortable');
    // Se i correlati vengono avviati da un tab diverso da "all", salviamo lo scope
    // per ripristinarlo all'uscita dalla modalità correlati.
    const prevScopeBeforeCorrelatedRef = React.useRef<ScopeTab | null>(null);

    const [shareOpen, setShareOpen] = React.useState<boolean>(false);
    const [shareEmailOpen, setShareEmailOpen] = React.useState<boolean>(false);
    const [settingsDocumentCard, setSettingsDocumentCard] = React.useState<boolean>(false);

    const abortController = React.useRef(null);

    const [openPdf, setOpenPdf] = React.useState(false);
    const [pdfDoc, setPdfDoc] = React.useState<{ id: string; name: string; company: "FOCELDA" | "IOT" } | null>(null);
    const [shareActive, setShareActive] = React.useState(true);

    // Traccia se il filtro cc è stato impostato da URL per eseguire automaticamente la ricerca
    const isInitializedFromUrl = React.useRef(false);

    // Leggi il parametro 'cc' dall'URL query string al mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const ccFromUrl = params.get('cc');
        if (ccFromUrl && !filterCc) {
            setFilterCc(ccFromUrl);
            isInitializedFromUrl.current = true;
        }
    }, [location.search, filterCc]);

    // Esegui automaticamente la ricerca quando filterCc viene impostato da URL
    useEffect(() => {
        if (isInitializedFromUrl.current && filterCc) {
            search();
            isInitializedFromUrl.current = false;
        }
    }, [filterCc, search]);

    //tour-system
    type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";
    const shouldIgnoreClose = (reason?: CloseReason) => {
        if (!tour.isOpen) return false;
        if (!reason) return false;
        return reason === "backdropClick" || reason === "clickAway" || reason === "escapeKeyDown";
    };

    const tour = useSectionTour({
        id: 'nex_v2_documents',
        version: '2.0.0',
        user: {
            id: userContext?.details?._id ?? '',
            role: (userContext?.details?.ruolo as Role) ?? 'Tester',
        },
        keys: 'documents',
        actions: {
            2: () => { setOpenGroup(false) },
            3: () => { setOpenGroup(false); setOpenSort(false); },
            4: () => { setOpenGroup(false); setOpenSort(false); setOpenView(false) },
            5: () => { setOpenSort(false); setOpenView(false); setOpenFiltersPanel(false) },
            6: () => { setOpenView(false); setOpenFiltersPanel(false) },
            7: () => { setOpenFiltersPanel(true) },
            8: () => { setOpenFiltersPanel(true) },
            10: () => { setOpenFiltersPanel(true) },
            12: () => { setOpenFiltersPanel(false); setOpenSearch(false) },
            13: () => { setOpenSearch(true) },
            15: () => { setOpenSearch(true) },
            20: () => { setOpenPdf(false) },
            21: () => { setOpenPdf(true) },
            24: () => { setOpenPdf(true) },
            25: () => { setOpenPdf(false); setShareOpen(false) },
            26: () => { setShareOpen(true); setShareActive(false); },
            27: () => { setShareOpen(true); setShareActive(false); },
            28: () => { setShareOpen(true); setShareActive(false); },
            29: () => { setShareOpen(true); setShareActive(false); },
            30: () => { setShareOpen(true); setShareActive(true); }
        }
    });

    // layout
    const cardH = density === 'compact' ? 140 : 160;
    const rowH = density === 'compact' ? 56 : 68;
    const minColW = density === 'compact' ? 280 : 320;

    // chips filtri attivi
    const chips: FilterChip[] = [
        ...(filterDocId ? [{
            key: "docId",
            label: "Documento",
            value: filterDocNum ? filterDocNum : "N/D",
            onRemove: () => { setFilterDocId(""); setFilterDocNum(""); }
        }] : []),
        ...(correlatedTarget ? [{
            key: "correlated",
            label: "Correlati",
            value: correlatedTarget.label ?? correlatedTarget.fileName,
            onRemove: () => {
                // Uscita dalla modalità correlati: torniamo alla ricerca normale senza cambiare gli altri filtri
                setCorrelatedTarget(null);
                if (prevScopeBeforeCorrelatedRef.current) {
                    setScope(prevScopeBeforeCorrelatedRef.current);
                    prevScopeBeforeCorrelatedRef.current = null;
                }
                setInpagination(undefined as any);
                clearSelection?.();
                setSingleSelected([]);
                search(false);
            }
        }] : []),

        ...(filterType !== "" ? [{ key: "filterType", label: "Tipologia", value: filterType, onRemove: () => setFilterType("") }] : []),
        ...(filterCompany !== "" ? [{ key: "company", label: "Azienda", value: filterCompany, onRemove: () => setFilterCompany("") }] : []),
        ...((dateFrom || dateTo) ? [{
            key: "daterange",
            label: "Data",
            value: `${dateFrom ?? "…"} → ${dateTo ?? "…"} `,
            onRemove: () => { setDateFrom(""); setDateTo(""); }
        }] : []),
        ...(filterCc ? [{ key: "cc", label: "Codice Cliente", value: filterCc ?? "N/A", onRemove: () => setFilterCc('') }] : []),
        /*
        TASK: chip “codice prodotto”
        - mostra in UI che è attivo un filtro su WCDAR
        - permette rimozione rapida coerente con gli altri filtri
        */
        ...(filterCdar ? [{
            key: "cdar",
            label: "Codice Prodotto Interno",
            value: filterCdar,
            onRemove: () => setFilterCdar("")
        }] : []),

    ];


    // ——————————————————————————————————————————————————————————
    // ACTIONS CONTEXT MENU 
    // ——————————————————————————————————————————————————————————
    // SORT
    const sortContextMenu = React.useMemo(() => {
        const mkItem = (title: string, active: boolean, onClick: () => void) => ({
            title,
            icon: active ? <MdCheckIcon size={16} /> : <span className="w-[16px]" />,
            onClick,
            action: true,
            className: active ? "bg-[#2e2e2e]" : undefined,
        });
        const by = [
            mkItem('Data', sortBy === 'date', () => setSortBy('date')),
            mkItem('Nome', sortBy === 'name', () => setSortBy('name')),
            mkItem('Tipo', sortBy === 'type', () => setSortBy('type')),
            mkItem('Azienda', sortBy === 'company', () => setSortBy('company')),
        ];
        const dir = [
            {
                title: 'Ascendente',
                icon: <MdArrowUpwardIcon size={16} />,
                onClick: () => setSortDir('asc'),
                action: true,
                className: sortDir === 'asc' ? "bg-[#2e2e2e]" : undefined,
                separator: true,
            },
            {
                title: 'Discendente',
                icon: <MdArrowDownwardIcon size={16} />,
                onClick: () => setSortDir('desc'),
                action: true,
                className: sortDir === 'desc' ? "bg-[#2e2e2e]" : undefined,
            },
        ];
        return [...by, ...dir];
    }, [sortBy, sortDir]);

    // GROUP BY
    const groupContextMenu = React.useMemo(() => {
        const mkItem = (title: string, val: 'none' | 'date' | 'company' | 'type') => ({
            title,
            icon: groupBy === val ? <MdCheckIcon size={16} /> : <span className="w-[16px]" />,
            onClick: () => setGroupBy(val),
            action: true,
            className: groupBy === val ? "bg-[#2e2e2e]" : undefined,
        });
        return [
            mkItem('Nessuno', 'none'),
            mkItem('Data', 'date'),
            mkItem('Azienda', 'company'),
            mkItem('Tipo', 'type'),
        ];
    }, [groupBy, setGroupBy]);

    // VIEW
    const viewContextMenu = React.useMemo(() => {
        return [
            {
                title: 'Grid',
                icon: view === 'grid' ? <MdCheckIcon size={16} /> : <MdGridViewIcon size={16} />,
                onClick: () => setView('grid'),
                action: true,
                className: view === 'grid' ? "bg-[#2e2e2e]" : undefined,
            },
            {
                title: 'List',
                icon: view === 'list' ? <MdCheckIcon size={16} /> : <MdViewListIcon size={16} />,
                onClick: () => setView('list'),
                action: true,
                className: view === 'list' ? "bg-[#2e2e2e]" : undefined,
                separator: true,
            },
            {
                title: 'Comfortable',
                icon: density === 'comfortable' ? <MdCheckIcon size={16} /> : <MdViewComfyIcon size={16} />,
                onClick: () => setDensity('comfortable'),
                action: true,
                className: density === 'comfortable' ? "bg-[#2e2e2e]" : undefined,
            },
            {
                title: 'Compact',
                icon: density === 'compact' ? <MdCheckIcon size={16} /> : <MdViewCompactIcon size={16} />,
                onClick: () => setDensity('compact'),
                action: true,
                className: density === 'compact' ? "bg-[#2e2e2e]" : undefined,
            },
        ];
    }, [view, setView, density]);

    /** Settings del card (menu dei 3 pallini) per ogni documento. */
    const settingsDocumentCardContextMenu = React.useMemo(() => {
        const it = singleSelected[0];
        if(!it) return [];
        return [
            { title: "Download", icon: <MdDownloadIcon />, onClick: () => downloadFiles([it]) },
            { title: "Visualizza", icon: <MdViewWeekIcon />, onClick: () => openPdfFor(it) },
            {
                title: "Condividi", icon: <MdShareIcon />,
                childrenMenu: [{
                    component: <div className="flex flex-col items-center gap-2">
                        <FDButton
                            icon={<MdShareIcon />}
                            size='small'
                            fullWidth
                            variant='text'
                            color='dark'
                            className='justify-start'
                            onClick={() => { setShareOpen(true); setSettingsDocumentCard(false); }}>
                            Tramite chat
                        </FDButton>
                        <FDButton
                            icon={<MdEmailIcon />}
                            size='small'
                            fullWidth
                            variant='text'
                            color='dark'
                            className='justify-start'
                            onClick={() => { setShareEmailOpen(true); setSettingsDocumentCard(false); }}>
                            Condividi via mail
                        </FDButton>
                    </div>
                }]
            },
            { title: `Visualizza ${it.type == "BOLLA" ? "fatture" : "bolle"} correlate`, icon: <MdLinkIcon />, onClick: () => showCorrelated(it) }
        ];
    }, [singleSelected, setShareOpen, setShareEmailOpen, downloadFiles, openPdfFor]);


    const loadMore = React.useCallback(() => {
        if (scope !== 'all') return;
        if (filterDocId) return;
        search(true);
    }, [inpagination, scope, filterDocId, search]);

    function openPdfFor(it: any) {
        if (!it) return;
        setPdfDoc({ id: it.id, name: it.name, company: it.company });
        setOpenPdf(true);
    };

    /*
     * MODALITÀ CORRELATI (BOLLA <-> FATTURA)
     * Questo handler nasce per la TOPBAR: lì l’utente prima seleziona un documento nella lista
     * e poi clicca “Correlati”. In quel caso la sorgente dati è `selected[0]`.
     * 
     * Nella SEARCHBAR (e in generale nei menu contestuali) però abbiamo già in mano il documento “x”
     * su cui l’utente ha cliccato l’azione, e NON possiamo affidarci a `selected` perché:
     * - la selezione potrebbe non essere ancora aggiornata (setState asincrono)
     * - potremmo aver fatto click su un item senza “selezionarlo” nella lista principale
     * - la logica di showCorrelated azzera/riporta la selezione per entrare in modalità correlati
     *
     * Per evitare di duplicare la funzione, la rendiamo retro-compatibile:
     * - se arriva `doc`, usiamo quello (caso SearchPanel / context menu)
     * - altrimenti usiamo `selected` (caso Topbar, comportamento IDENTICO a prima)
     *
     * IMPORTANTISSIMO:
     * se questa funzione viene passata DIRETTAMENTE a un onClick (es. onClick={showCorrelated}),
     * React passerà automaticamente il MouseEvent come primo argomento.
     * Da quando accettiamo `doc`, rischiamo quindi di interpretare l’evento come “documento”.
     * Qui sotto mettiamo una guardia: usiamo `doc` SOLO se ha la shape minima di un DocumentItemMapped.
     */
    const showCorrelated = React.useCallback(
        (doc?: DocumentItemMapped) => {
            const isDocumentItemMapped = (x: any): x is DocumentItemMapped => {
                if (!x || typeof x !== "object") return false;
                // deve avere le proprietà minime che ci servono per la correlazione
                return (
                    typeof x.id === "string" &&
                    typeof x.name === "string" &&
                    typeof x.company === "string" &&
                    x.element_type === "DOCUMENT"
                );
            };

            const docSafe = isDocumentItemMapped(doc) ? doc : undefined;

            const it =
                docSafe ??
                (() => {
                    // Caso TOPBAR: devo avere una singola selezione valida
                    if (selected.length !== 1) return null;
                    // Cerco l’elemento selezionato dentro la lista corrente
                    const found = items.find((d) => d.id === selected[0]);
                    // Safety: l’azione correlati ha senso solo sui DOCUMENT
                    if (!found || found.element_type !== "DOCUMENT") return null;
                    return found;
                })();
            // Se non ho un documento target, non faccio nulla (evita side-effect inutili)
            if (!it) return;
            /**
             * L’endpoint /pdf/v2/correlated lavora solo su DOC-BOLLA / DOC-FATTURA.
             * Qualsiasi altro PDF non è correlabile con questa logica.
             */
            const upper = String(it.name || "").toUpperCase();
            const isSupported = upper.startsWith("DOC-BOLLA-") || upper.startsWith("DOC-FATTURA-");
            if (!isSupported) {
                enqueueSnackbar("Correlazione disponibile solo per BOLLA o FATTURA.", { type: "warning" });
                return;
            }
            /**
             * Entriamo in modalità correlati:
             * - togliamo l’eventuale filtro documento (altrimenti vedremmo solo 1 elemento)
             * - reset paginazione (riparte da offset 0)
             * - puliamo selezione per evitare azioni su ID che non esistono più nella lista
             * - resettiamo eventuale selezione singola usata per azioni contestuali
             *
             * Nota: questi reset sono fondamentali perché stiamo cambiando “sorgente dati”
             * (da /pdf/v2/search a /pdf/v2/correlated) mantenendo la stessa UI.
             */
            setFilterDocId("")
            setFilterDocNum("");
            setInpagination(undefined as any);
            clearSelection?.();
            setSingleSelected([]);

            // Se parto da un tab diverso da "Tutti", lo salvo e mostro i correlati su scope "all"
            // per non nascondere i risultati non marcati come preferiti.
            if (scope !== 'all') {
                prevScopeBeforeCorrelatedRef.current = scope;
                setScope('all');
            } else {
                prevScopeBeforeCorrelatedRef.current = null;
            };

            /**
             * Impostiamo il target correlato:
             * - `from`: company per la mappatura WSISI lato BE (FOCELDA/IOT/ADJ)
             * - `fileName`: nome file usato come chiave stabile per correlare (WPDFB/WPDFF)
             * - `label`: testo mostrato nella UI (chip/info), utile per ricordare “da quale doc” provengono i correlati
             */
            setCorrelatedTarget({
                from: it.company, // può essere "FOCELDA" o "ADJ" (il BE accetta anche ADJ)
                fileName: it.name,
                label: `${it.type ?? ""} - ${it.ragione_sociale ?? ""} – ${it.numdoc ?? ""}`.trim(),
            });

            /**
             * Fetch immediata nella stessa pagina (stesso comportamento di "Cerca"):
             * la fetchSearch, vedendo correlatedRef.current valorizzato e non essendo in debounce,
             * chiamerà /pdf/v2/correlated invece di /pdf/v2/search.
             */
            search(false);
        },
        [selected, items, clearSelection, setSingleSelected, setFilterDocId, setFilterDocNum, setInpagination, setCorrelatedTarget, search, scope, setScope]
    );

    // pick ricerca mirata → applica filtri + rilancia
    const pendingAutoSearch = React.useRef(false);
    const pendingAutoSearchQuery = React.useRef<string>("");

    const toLocalISODate = React.useCallback((input: any) => {
        const d = new Date(input);
        if (Number.isNaN(d.getTime())) return "";
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const applyPickFromSearch = React.useCallback((doc: DocumentItemMapped) => {
        if (!doc) return;

        pendingAutoSearch.current = true;
        pendingAutoSearchQuery.current = "";

        setScope('all');
        clearSelection?.();
        setSingleSelected([]);
        setOpenFiltersPanel(false);

        /**
         * CASO 1: Selezione di un cliente dalla ricerca mirata.
         * Comportamento "storico":
         * - resettiamo i filtri documento
         * - azzeriamo eventuale filtro prodotto
         * - applichiamo il codice cliente
         */
        if (doc.element_type === "PERSON") {
            setFilterDocId("");
            setFilterDocNum("");

            setFilterType("");
            setFilterCompany("");
            setDateFrom("");
            setDateTo("");

            setFilterCdar("");
            setFilterCc(doc.codice_cliente || "");

            setOpenSearch(false);
            return;
        }

        /**
         CASO 2: Documento proveniente da una ricerca mirata per codice prodotto (cdar).
        Qui NON vogliamo selezionare un singolo documento (filterDocId),
        Scelta UX:
        - cliccando un PDF vogliamo mostrare SOLO quel PDF (quindi settiamo filterDocId)
        - ma vogliamo anche che il pannello filtri mostri il cdar digitato (quindi settiamo filterCdar)
        Effetto utile:
        - se l’utente rimuove il chip "Documento", rimane attivo "Codice Prodotto Interno"
        e quindi vede tutti i documenti del prodotto.
         */
        if (doc.searchCdar) {
            setFilterCdar(doc.searchCdar);

            setFilterDocId(doc.id);
            setFilterDocNum(doc.numdoc ? String(doc.numdoc) : "");

            setOpenSearch(false);
            return;
        }

        /**
         * CASO 3: Documento “normale” (ricerca testuale o altri criteri).
         * Comportamento attuale:
         * - seleziono il singolo documento
         * - pulisco eventuale filtro prodotto, perché potrebbe nascondere il documento scelto
         */
        setFilterCdar("");

        setFilterDocId(doc.id);
        setFilterDocNum(doc.numdoc ? String(doc.numdoc) : "");

        setFilterCompany(doc.company ?? "");
        setFilterType(doc.type ?? "");
        setFilterCc(doc.codice_cliente ?? "");

        const day = doc.date ? toLocalISODate(doc.date) : "";
        setDateFrom(day);
        setDateTo(day);

        setOpenSearch(false);
    }, [
        clearSelection,
        setSingleSelected,
        setScope,
        setOpenFiltersPanel,
        setFilterDocId,
        setFilterDocNum,
        setFilterType,
        setFilterCompany,
        setFilterCc,
        setFilterCdar,
        setDateFrom,
        setDateTo,
        toLocalISODate
    ]);

    useEffect(() => {
        if (!pendingAutoSearch.current) return;
        pendingAutoSearch.current = false;
        search(false, pendingAutoSearchQuery.current);
    }, [filterType, filterCompany, dateFrom, dateTo, filterCc, filterCdar, filterDocId, scope, search]);

    type DownloadInput = Array<string | DocumentItemMapped>;
    async function downloadFiles(docs?: DownloadInput) {
        /** Se non arrivano argomenti, usa la selezione corrente (comportamento precedente) */
        const sourceList: DownloadInput =
            docs && docs.length > 0 ? docs : (selected as unknown as DownloadInput);

        /** Mappa ogni voce a un DocumentItemMapped (da id → item, oppure item già pronto) */
        const resolvedItems: DocumentItemMapped[] = sourceList
            .map((d) => {
                if (typeof d === "string") {
                    return items.find((i) => i.id === d) || null;
                }
                return d;
            })
            .filter(Boolean) as DocumentItemMapped[];

        if (resolvedItems.length === 0) return;

        const documents: any = resolvedItems.map((it) => ({
            fileName: it.name,
            url: buildPdfUrl({ fileName: it.name, company: it.company, download: "1" }),
        }));

        /*const { total, ok, fail } = */ await downloadPdfBatch(documents, {
            concurrent: 3,
            retry: 1,
            credentials: "include",
            onProgress: (done, tot) => console.log(Math.round((done / tot) * 100)),
        });
    };

    /** funzione che converte i selected id[] in selectedDocs */
    const isSelectedMapped = React.useCallback((items_prop?: DocumentItemMapped[]) => {
        return (items_prop ?? (selected as unknown as DocumentItemMapped[])).map(s => {
            const it: DocumentItemMapped | undefined = items_prop ? (s as DocumentItemMapped) : items.find(i => i.id === (s as any));
            return it ? { id: it.id, fileName: it.name, company: it.company } : null;
        }) as any;
    }, [selected, singleSelected, items]);

    /** Funzione per il fetch degli utenti da passare al pannello di condivisione  */
    const fetchUsers = React.useCallback(async (q: string, page: number) => {
        const data = await SearchUsersAPI({ userContext, abortController, sstr: q });
        if (!data || (data && !Array.isArray(data))) return { users: [], hasMore: false };
        return {
            users: data?.map((u: any) => ({
                _id: u._id,
                nome: u.nome,
                cognome: u.cognome,
                username: u.username,
                idBlock: u.idBlock ?? null,
                immagini: u.immagini ?? {},
                biografia: u.biografia ?? ""
            })),
            hasMore: false
        };
    }, []);

    const { createPrivateChat: _cpc } = useGeneralDataContext();

    /** gestione della condivisione in chat */
    const onShare = React.useCallback(async ({
        targets,
        message,
        attachments, // ShareDoc[]  -> { fileName, company, displayName? }
    }: {
        targets: ShareTarget[];
        message?: string;
        attachments: ShareDoc[];
    }) => {
        if (!userContext?.details?._id) return; // non loggato
        if (!attachments || attachments.length === 0 || !targets || targets.length === 0) return;

        /** prepara allegati resource-based per la chat */
        const chatAttachments = attachments.map((d) => ({
            kind: "resource" as const,
            fileType: "pdf" as const,
            company: d.company,
            fileName: d.fileName, // es: DOC-BOLLA-…-081025.pdf
            displayName: d.displayName ?? d.fileName,
        }));

        // invio verso ciascun destinatario
        for (const t of targets) {
            const { idBlock } = await createPrivateChat({
                data: {
                    idBlock: t.idBlock, // può essere null/undefined → crea nuovo
                    userID: t._id,
                    nome: t.nome,
                    cognome: t.cognome,
                    disabilitato: false,
                    path: "privata",
                    message: {
                        user: {
                            _id: userContext.details._id,
                            nome: userContext.details.nome,
                            cognome: userContext.details.cognome,
                        },
                        msg: message ?? "",
                        attachments: chatAttachments,
                        viewed: false,
                        date: new Date(),
                    }
                },
                settings: { loadFromRemote: true, createRemoteBlock: true, avoidToFocus: true },
                openAfter: false,
            });

            if (!idBlock) continue;

            // emetti il messaggio su quella chat associata al blocco
            const payload = {
                idBlock,
                user: {
                    _id: userContext.details._id,
                    nome: userContext.details.nome,
                    cognome: userContext.details.cognome,
                },
                msg: message ?? "",
                attachments: chatAttachments,
                viewed: false,
                date: new Date(),
            };

            await new Promise<void>((resolve) => {
                chatSocket.emit("privateMessage", payload, () => resolve());
            });
        }

        // UI/UX cleanup
        setShareOpen(false);
        clearSelection?.();
        setSingleSelected([]); // reset selezione mirata
        // notifica successo
        enqueueSnackbar(`Documenti condivisi con ${targets.length} utente${targets.length > 1 ? 'i' : ''} in chat.`,
            { title: "Condivisione documenti", type: 'success' });
    }, [createPrivateChat, userContext, clearSelection, setSingleSelected]);

    /**
     * Condivisione documenti via email:
     * - riusa lo stesso pannello/UX della chat, ma chiama il BE che invia allegati reali
     * - usa username come email (in Mongo username = mail)
     * - gli allegati sono "resource-based": passiamo al BE solo { fileName, company }
     * - invia i PDF come allegati tramite BE /pdf/v2/shareEmail
     */
    const onShareByEmail = React.useCallback(async ({
        targets,
        message,
        attachments,
    }: {
        targets: ShareTarget[];
        message?: string;
        attachments: ShareDoc[];
    }) => {
        // Se non c'è nessun destinatario o nessun allegato → non fare nulla
        if (!attachments || attachments.length === 0 || !targets || targets.length === 0) return;

        // "username" è l'email quindi lo usiamo come destinatario
        const to = targets
            .map(t => String(t?.username || "").trim())
            .filter(Boolean);
        // Se non abbiamo destinatari validi, notifichiamo e usciamo senza chiamare il BE
        if (to.length === 0) {
            enqueueSnackbar("Nessun destinatario valido.", {
                title: "Condivisione via email",
                type: "error",
            });
            return;
        }
        // Chiamiamo il BE che recupera i PDF dal filesystem in base a { fileName, company }
        const res = await ShareEmailAPI({
            abortController,
            to,
            message: message ?? "",
            docs: attachments.map(d => ({ fileName: d.fileName, company: d.company })),
            HandleError: (errorMessage: string) => {
                // Gestione errori centralizzata: snackbar coerente con resto UI
                enqueueSnackbar(errorMessage, { title: "Errore", type: "error" });
            },
        });

        // Se ShareEmailAPI ha gestito l'errore e ha ritornato undefined, non chiudiamo nulla
        if (!res?.ok) return;
        // Feedback all’utente
        enqueueSnackbar(
            `Email inviata a ${res.sent} destinatario/i con ${res.attached} allegato/i`,
            { title: "Condivisione via email", type: "success" }
        );

        // Cleanup come per chat: chiusura pannello + reset selezioni
        setShareEmailOpen(false);
        clearSelection?.();
        setSingleSelected([]);
    }, [abortController, clearSelection, setSingleSelected]);

    const onSearchClick = React.useCallback(() => {
        /*
         * FIX UX "Correlati":
         * Prima il bottone "Cerca" chiamava direttamente search().
         * Ma search() (nel hook) se correlatedTarget è attivo usa l'endpoint /pdf/v2/correlated.
         * Risultato: l'utente non riusciva a tornare alla lista "iniziale" dei documenti.
         * Ora, ad ogni click su "Cerca":
         * 1) resettiamo la paginazione (offset 0)
         * 2) se siamo in modalità correlati, usciamo (correlatedTarget = null) e puliamo selezione
         * 3) rilanciamo la ricerca "normale" (endpoint /pdf/v2/search)
         */
        setInpagination(undefined as any);

        // se siamo in correlati, usciamo e ripristiniamo la vista normale
        if (correlatedTarget) {
            setCorrelatedTarget(null);
            if (prevScopeBeforeCorrelatedRef.current) {
                setScope(prevScopeBeforeCorrelatedRef.current);
                prevScopeBeforeCorrelatedRef.current = null;
            }
            clearSelection?.();
            setSingleSelected([]);
        }

        // rilancia la ricerca "normale" (primo caricamento)
        search(false);
    }, [
        correlatedTarget,
        setCorrelatedTarget,
        setScope,
        setInpagination,
        clearSelection,
        setSingleSelected,
        search
    ]);

    /*
     * Il conteggio correlati deve riflettere la risposta "grezza" della query /correlated,
     * non la vista corrente (items) che cambia con scope/tab, filtri e merge preferiti.
     */
    const correlatedCount = correlatedTarget ? counts.raw : 0;

    const correlatedIsBolla = correlatedTarget
        ? String(correlatedTarget.fileName || "").toUpperCase().startsWith("DOC-BOLLA-")
        : false;


    const shareDocs = React.useMemo(() => {
        /**
         * FIX:
         * - In modalità "search" (openSearch=true) usiamo sempre singleSelected.
         * - Fuori dalla search, se singleSelected è valorizzato significa che l'utente ha cliccato
         *   un'azione contestuale su una card (3 pallini) senza necessariamente selezionarla.
         *   In quel caso vogliamo condividere QUEL documento, quindi usiamo singleSelected.
         * - Se singleSelected è vuoto, torniamo al comportamento storico: usiamo selected (selezione UI).
         */
        const hasSingle = (singleSelected?.length ?? 0) > 0;
        return (openSearch || hasSingle) ? isSelectedMapped(singleSelected) : isSelectedMapped();
    }, [openSearch, singleSelected, isSelectedMapped]);


    return (
        <DashboardLayout>
            <div className='flex flex-col h-full mx-auto max-w-[1400px] w-full max-h-[93.2vh]'>
                {/* floating button: reset tour */}
                <TopBar
                    // onSearch={search}
                    onSearch={onSearchClick} // "Cerca" usa un handler dedicato per uscire dai correlati e ripartire dalla lista iniziale
                    setShareEmailOpen={setShareEmailOpen}
                    selected={selected}
                    selectionCount={selected.length}
                    setOpenView={setOpenView}
                    scope={scope} setScope={setScope}
                    groupBy={groupBy} setOpenGroup={setOpenGroup}
                    sortBy={sortBy} setOpenSort={setOpenSort}
                    setOpenFiltersPanel={setOpenFiltersPanel}
                    menuRef={contextMenuRef}
                    setOpenSearch={setOpenSearch}
                    chips={chips}
                    downloadFiles={downloadFiles}
                    clearSelection={clearSelection}
                    openPdfFor={openPdfFor}
                    items={items}
                    setShareOpen={setShareOpen}
                    showCorrelated={showCorrelated}
                />

                <DocumentsSearch
                    open={openSearch}
                    onClose={(_e?: any, reason?: CloseReason) => {
                        if (shouldIgnoreClose(reason)) return;
                        setOpenSearch(false);
                    }}
                    query={q}
                    onQueryChange={searchDebounced}
                    results={(rawSearch as any)}
                    onPick={applyPickFromSearch}
                    loading={loadingSearch}
                    chips={chips}
                    downloadFiles={downloadFiles}
                    openPdfFor={openPdfFor}
                    setShareOpen={setShareOpen}
                    setShareEmailOpen={setShareEmailOpen}
                    setSingleSelected={setSingleSelected}
                    recent={recentSearch}
                    setRecent={setRecentSearch}
                    showCorrelated={showCorrelated}
                    toggleFavorite={toggleFavorite}
                />

                <main className="flex-1 min-h-0 w-full py-4 overflow-hidden">
                    {/* Il banner "correlati" non è mostrato in Preferiti:
                        in quel tab la lista è filtrata e il messaggio risulterebbe fuorviante. */}
                    {correlatedTarget && scope !== 'favorites' && (
                        <FDBox variant='soft' pad='sm' border radius="xl" color='warning' className='mb-3 inline-flex items-center gap-2' fullWidth>
                            <MdPictureAsPdfIcon />
                            <p className="py-1 text-sm opacity-80 pe-2">
                                Per la{" "}
                                <strong>{correlatedTarget.label ?? correlatedTarget.fileName}</strong>{" "}
                                {correlatedCount > 0 ? (
                                    <>  {/* FIX grammaticale:
                                        - se c'è 1 solo risultato usiamo il singolare ("è stata trovata" e "fattura/ bolla correlata")
                                        - altrimenti manteniamo il plurale ("sono state trovate" e "fatture/ bolle correlate")
                                        */}
                                        {(correlatedCount === 1 && !inpagination?.hasMore) ? "è stata trovata " : "sono state trovate "}{" "}
                                        <strong>
                                            {correlatedCount}{inpagination?.hasMore ? "+" : ""}
                                        </strong>{" "}
                                        {correlatedCount === 1
                                            ? (correlatedIsBolla ? "fattura correlata." : "bolla correlata.")
                                            : (correlatedIsBolla ? "fatture" : "bolle") + " correlate."
                                        }
                                    </>
                                ) : (
                                    <>
                                        non sono state trovate{" "}
                                        <strong>{correlatedIsBolla ? "fatture" : "bolle"}</strong>{" "}
                                        correlate.
                                    </>
                                )}
                            </p>
                        </FDBox>
                    )}

                    {!loading ? (
                        counts.raw === 0 ? (
                            // non è arrivato nessun dato
                            <EmptyState text="Nessun documento disponibile." />
                        ) : (!loading && counts.flat === 0 ? (
                            // ci sono dati 'raw', ma i filtri/ambito li hanno esclusi
                            <EmptyState text="Nessun documento trovato. Prova a cambiare i filtri." />
                        ) : (items.length !== 0 &&
                            <div className="h-full min-h-0">
                                <DocumentsVirtualView
                                    items={items}
                                    view={view}
                                    cardHeight={cardH}
                                    itemHeight={rowH}
                                    minColWidth={minColW}
                                    gapX={16}
                                    gapY={16}
                                    overscan={6}
                                    groupCounts={groupCounts}
                                    groupLabels={groupLabels}
                                    renderCard={(it) => (
                                        <DocumentCard
                                            item={it}
                                            selected={isSelected(it.id)}
                                            onSelect={(multi) => toggleSelect(it.id, multi)}
                                            onToggleFavorite={() => toggleFavorite(it.id)}
                                            handleOpenMenu={(e: any) => {
                                                setSingleSelected([it]);
                                                (contextMenuRef as React.MutableRefObject<HTMLElement | null>).current = e.currentTarget as HTMLElement;
                                                setSettingsDocumentCard(true);
                                            }}
                                        />
                                    )}
                                    renderRow={(it) => (
                                        <DocumentRow
                                            item={it}
                                            selected={isSelected(it.id)}
                                            onSelect={(multi) => toggleSelect(it.id, multi)}
                                            onToggleFavorite={() => toggleFavorite(it.id)}
                                        />
                                    )}
                                    scope={scope}
                                    onEndReached={loadMore}
                                    endReachedDisabled={!inpagination?.hasMore || inpagination?.loadingMore}
                                    loadingMore={loadingMore}
                                />
                            </div>
                        ))
                    ) : <LoadingState />}
                </main>
                {/* Context Menu per che viene utilizzato da diversi buttons/stati */}
                <ContextMenu
                    openFor={openFiltersPanel || openGroup || openSort || openView || settingsDocumentCard}
                    pos={contextMenuRef}
                    onClose={(_e?: any, reason?: CloseReason) => {
                        if (shouldIgnoreClose(reason)) return;
                        setOpenGroup(false);
                        setOpenSort(false);
                        setOpenView(false);
                        setOpenFiltersPanel(false);
                        setSettingsDocumentCard(false);
                    }}
                    menuButtons={
                        openGroup
                            ? groupContextMenu
                            : openSort
                                ? sortContextMenu
                                : openView
                                    ? viewContextMenu
                                    : settingsDocumentCard
                                        ? settingsDocumentCardContextMenu
                                        : undefined
                    }
                    panel={
                        openFiltersPanel ? (
                            <FiltersPanelInMenu
                                dateFrom={dateFrom} setDateFrom={setDateFrom}
                                dateTo={dateTo} setDateTo={setDateTo}
                                filterCompany={filterCompany} setFilterCompany={setFilterCompany}
                                filterType={filterType} setFilterType={setFilterType}
                                filterCc={filterCc} setFilterCc={setFilterCc}
                                filterCdar={filterCdar} setFilterCdar={setFilterCdar}
                                filterDocId={filterDocId} setFilterDocId={setFilterDocId}
                                filterDocNum={filterDocNum} setFilterDocNum={setFilterDocNum}
                            />
                        ) : undefined
                    }
                />

                <Tooltip id="general-documents-tooltip" place="bottom" className="max-w-[15vw] min-w-[150px] !text-xs text-center z-50 !rounded-md" />
            </div>

            {pdfDoc && (
                <PdfViewer
                    open={openPdf}
                    onClose={(_e?: any, reason?: CloseReason) => {
                        if (shouldIgnoreClose(reason)) return;
                        setOpenPdf(false);
                    }}
                    title={pdfDoc.name}
                    source={{ type: "url", url: buildPdfUrl({ fileName: pdfDoc.name, company: pdfDoc.company }) }}
                    onDownload={() => downloadPdfSingleAPI(pdfDoc.name, pdfDoc.company, {
                        asAttachment: true,
                        credentials: "include",
                    })}
                />
            )}

            <FDSharePanel
                open={shareOpen || shareEmailOpen}
                onClose={(_e?: any, reason?: CloseReason) => {
                    if (shouldIgnoreClose(reason)) return;
                    setShareOpen(false);
                    setShareEmailOpen(false);
                    setShareActive(true);
                    /*
                    * Se il pannello era stato aperto da un menu contestuale (3 pallini),
                    * singleSelected era la sorgente degli allegati. Lo resettiamo in chiusura
                    * per evitare che una condivisione successiva "erediti" documenti vecchi.
                    */
                    setSingleSelected([]);
                }}
                //docs={openSearch ? isSelectedMapped(singleSelected) : isSelectedMapped()}
                docs={shareDocs}
                fetchUsers={fetchUsers}
                onShare={shareOpen ? onShare : onShareByEmail}
                title={`Condividi documenti ${shareOpen ? "in chat" : "via email"}`}
                isActive={!tour.isOpen || shareActive}
            />
        </DashboardLayout>
    );
};

export default DocumentsPage;