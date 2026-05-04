import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteQuotationData } from "../fetchdata/destroy/deleteQuotationData";

import type { CartProductDTO, ProductDoc, TextRequestCartDTO } from "../types/qts_product";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import HeaderBar from "../components/details/headerBar";
import { Tooltip } from "react-tooltip";
import FDBox from "components/UI/box/FDBox";
import QuoteProgressCard from "../components/details/cards/quoteProgress";
import CustomersCard from "../components/details/cards/customers";
import QuotationDetailsCard from "../components/details/cards/quotation";
import InternalBar from "../components/details/internalBar";
import { DONE_QUOTATION_STATES, useDetailsQuotation } from "../hook/useDetailsQuotation";
import FDSearchPanel, { FilterChip, SearchItem } from "components/UI/search/FDSearchPanel";
import DocumentsVirtualView from "../components/details/tables/DocumentsVirtualView";
import ProductCard from "../components/details/tables/ProductCard";
import CartPanel from "../components/details/cards/cart";

import cartEmpty from 'assets/images/emptyCart/shopping-cart-with-boxes-concept-illustration_114360-18772-noBg.png';

import { ProductsDetails } from "layouts/quotazioni/sidePanel/productsDetails";
import { useGeneralDataContext } from "context/GeneralDataContext";
import { TextRequestForm } from "../components/details/TextRequestForm";
import TextRequestCard from "../components/details/tables/TextRequestCard";
import { CustomersPanel } from "components/UI/panels/customersPanel";
import ContextMenu from "components/UI/menu/ContextMenu";
import Filters from "../components/details/filters";
import { FDButton } from "components/UI/buttons/FDButton";
import FDIconButton from "components/UI/buttons/FDIconButton";
import QuotazioneLock from "../components/details/lock";
import { ClosureDraft, QuotazioneDTOExtended } from "../types/closure";
import { useQuotationClosureGate } from "../hook/useQuotationClosureGate";
import { ClosureWizard } from "../components/details/closure/ClosureWizard";
import { ValidityBanner } from "../components/details/closure/ValidityBanner";

//icons
import { MdDone } from "react-icons/md";
import { TbAlertTriangle } from "react-icons/tb";
import { BsCartPlus } from "react-icons/bs";
import { IoEyeOutline } from "react-icons/io5";

import { DuplicateQuotationModal } from "../components/details/DuplicateQuotationModal";
import QuotationCard from "../components/details/tables/QuotationCard";
import { enqueueSnackbar } from "components/MessageBox";
import placeholder from 'assets/images/placeholder/av5c8336583e291842624.webp';
import { CheckRole } from "utils/checkRole";
import { OkLinksSidePanel } from "../components/OkLinksSidePanel";
import { FDSkeletonLayout, FDSkeletonPresets, FDSkeletonSwitch } from "components/UI/box/FDSkeleton";

const MdDoneIcon = MdDone as React.FC<{ size?: number; className?: string }>;
const TbAlertTriangleIcon = TbAlertTriangle as React.FC<{ size?: number; className?: string }>;
const BsCartPlusIcon = BsCartPlus as React.FC<{ size?: number; className?: string }>;
const IoEyeOutlineIcon = IoEyeOutline as React.FC<{ size?: number; className?: string }>;

// ——————————————————————————————————————————————————————————
// SUB COMPONENTS
// ——————————————————————————————————————————————————————————
const RenderError = ({ error }: { error: string }) => (
    <div className="rounded-2xl border border-red-200 bg-red-50 
                dark:border-red-500/40 dark:bg-red-900/10 px-4 py-3 text-sm mt-2">
        <TbAlertTriangleIcon size={20} className="inline-block mr-2 text-red-500" />
        <span className="text-red-700 dark:text-red-400">{error}</span>
    </div>
);


// ——————————————————————————————————————————————————————————
// MAIN COMPONENTS
// ——————————————————————————————————————————————————————————
export function QuotationDetails() {
    const navigate = useNavigate();
    const {
        CheckAdminDev,

        quotationId, // id della quotazione
        userState, // dati utente
        isRequester, // flag se l'utente è il richiedente della quotazione

        raw, // risultati grezzi nella lista prodotti
        inpagination, setInpagination,
        cart,
        highlightedItemId,

        openProductQtsSettings, setOpenProductQtsSettings, handleOpenQtsSettings,
        openFilters, setOpenFilters,
        openSearch, setOpenSearch,
        openCustomersDetails, setOpenCustomersDetails,
        filters, setFilters,
        contextMenuRef,

        searchQuery,
        searchItems, searchCartItems,
        recentSearch, setRecentSearch,

        scope, handleScopeChange,
        view, setView,
        density, setDensity,

        customer,
        categoryData,
        qts, setQts,
        errorMsg, setErrorMsg,

        fetchDetails,

        loading, setLoading,
        getProgressPercentage, areAllProductsDone,

        // pannelli di dettaglio links OC/FB
        openOkLinksPanel, setOpenOkLinksPanel,
        okLinks, setOkLinks,
        fetchQuotationOkLinks,

        searchDebounced,
        runSearch, runSearchOnCart,
        handleSelectFromSearch,
        // operazioni sulla quotazione
        HandleQuotationState,
        // azioni sul carrello
        addToCart, addTextToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        handleImportCartFromFile, // new function per import da file
        // azioni sulla quotazione
        handleProposeQtsProductsPrice,
        handleDirectQuoteExpiryChange,
        handleReqQtsProductsChangeState,
        selectSubstitutionProductForCurrent,
        toggleCommercialAlternativeForCurrent,
        createCounterProposalFromCommercialSuggestionForCurrent,
        updateSubstitutionDraft,
        onChangeProposalNote, currentProposalNote,
        getFilteredEventsForCurrentProduct,
        handleUpdateValidityWindow,
        handleReplacePlaceholderCustomer,
        sendProductNote,
        //abort controllers
        abortQtsRef,
        abortCartRef,
        abortDeleteRef,
        // gestione assegnazione buyer
        assigningBuyer,
        handleAssignBuyer,
        handleAssignExtraProductsDetails,
        setActiveCounterProposalForCurrent,
        reportingAnomaly,
        handleReportProductAnomaly,

        // gestione duplicazione quotazione
        duplicateModalOpen,
        duplicateCandidates,
        closeDuplicateModal,
        continueOpenAfterDuplicate,

        categoryIndex
    } = useDetailsQuotation();
    const { globalData } = useGeneralDataContext();
    const buyerOptions = globalData?.buyers?.map(b => ({ value: b.codici?.buyer ?? "", label: `${b.codici?.buyer} - ${b.nome} ${b.cognome}` })) || []; // opzioni buyer

    // dati
    const [expandedId, setExpandedId] = useState<string | null>(null); // NEW
    const [productDetailsTargetId, setProductDetailsTargetId] = useState<string | null>(null); // NEW
    // stato upload da file
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const productsQueryRef = useRef<string>("");
    const isBozza = qts?.stato === "BOZZA";
    const isDone = (qts && DONE_QUOTATION_STATES.has(qts.stato));

    // Parametri di layout derivati dalla densità
    const cardH = density === 'compact' ? 310 : 330;
    const minColW = density === 'compact' ? 280 : 320;

    //const hasTextRequest = cart?.some(p => p.kind === "TEXT_REQUEST");
    const hasProducts = cart?.some(p => p.kind === "PRODUCT");

    // chips per i filtri attivi
    // derivati dai filtri controllati
    // usati sia in TopBar che in DocumentsSearch
    const chips: FilterChip[] = [
        ...(filters.marca ? [{ key: "marca", value: `Marca: ${filters.marca.Marca}`, onRemove: () => setFilters({ ...filters, marca: null }) }] : []),
        ...(filters.linea ? [{ key: "linea", value: `Linea: ${filters.linea.Linea}`, onRemove: () => setFilters({ ...filters, linea: null }) }] : []),
        ...(filters.gruppo ? [{ key: "gruppo", value: `Gruppo: ${filters.gruppo.Gruppo}`, onRemove: () => setFilters({ ...filters, gruppo: null }) }] : []),
        ...(filters.raggruppamento ? [{ key: "raggruppamento", value: `Raggruppamento: ${filters.raggruppamento}`, onRemove: () => setFilters({ ...filters, raggruppamento: null }) }] : []),
    ];

    const searchPanelMode = (openSearch && typeof openSearch === "object") ? openSearch.from : null;
    const isTargetedSearchMode = searchPanelMode === "prodotti" || searchPanelMode === "quotazioni";

    const cartProductIds = useMemo(() => {
        const ids = new Set<string>();
        (cart ?? []).forEach((item) => {
            if ((item.kind ?? "PRODUCT") === "PRODUCT") {
                ids.add((item as CartProductDTO).product_id);
            }
        });
        return ids;
    }, [cart]);

    const searchPanelItems = useMemo(() => {
        return searchItems.map((d: ProductDoc) => {
            const icon = d?.anteprima ? <img src={d.anteprima} /> : <img src={placeholder} />;
            const isInCart = loading.cart ? Boolean(d.inCart) : cartProductIds.has(d._id);

            return {
                id: d._id,
                title: d.descrizione ? d.descrizione?.slice(0, 30) + (d.descrizione && d.descrizione.length > 30 ? "..." : "") : "Prodotto senza descrizione",
                subtitle: [d.codiceProduttore, d.codiceEAN, d.descrizione].filter((e) => e).join(" | "),
                iconLeft: icon,
                payload: d,
                metaRight: isTargetedSearchMode ? (
                    <FDIconButton
                        variant={(isBozza && isInCart) ? "success" : "general"}
                        rounded="md"
                        size="small"
                        asMotion={false}
                        className="border border-neutral-200 dark:border-neutral-700"
                        dataTooltipId="general-quotations-tooltip"
                        dataTooltipContent={isBozza ? (isInCart ? "Rimuovi dal carrello" : "Aggiungi alla quotazione") : "Visualizza il prodotto nel carrello"}
                        icon={isBozza ? <BsCartPlusIcon size={15} /> : <IoEyeOutlineIcon size={15} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isBozza) {
                                if (isInCart) {
                                    removeFromCart(d._id);
                                    return;
                                }
                                addToCart(d);
                            } else {
                                handleSelectFromSearch({ payload: d } as SearchItem<any>); // riusa la logica di selezione per visualizzare il prodotto nel carrello
                            };
                        }}
                    />
                ) : null,
                actions: searchPanelMode === "propose_qts_products" ? [
                    {
                        label: "Seleziona Prodotto per la sostituzione",
                        icon: <MdDoneIcon size={18} />,
                        onAction: () => { },
                    }
                ] : [],
            };
        }) as any[];
    }, [searchItems, isBozza, cartProductIds, isTargetedSearchMode, searchPanelMode, removeFromCart, addToCart, loading.cart]);

    /** Stato che ha lo scopo di gestire ClosureWizard */
    const [openClosure, setOpenClosure] = useState<boolean>(false);

    // Cast non-breaking (qts resta quello che arriva dal BE, noi lo “vediamo” esteso lato FE)
    const qtsExt = qts as unknown as QuotazioneDTOExtended;

    const productRows = useMemo(() => {
        return (cart ?? [])
            .filter(p => p.quotazione.stato === "CONTROPROPOSTA_ACCETTATA" || p.quotazione.stato === "VALUTAZIONE_COMPLETATA")
            .map((p: any) => {
                const stato = p?.quotazione?.stato;

                // Se la riga è CONTROPROPOSTA_ACCETTATA, il “prodotto effettivo” è quello della controproposta accettata
                const acceptedProposal =
                    stato === "CONTROPROPOSTA_ACCETTATA"
                        ? (p?.controproposte ?? []).find(
                            (cp: any) =>
                                cp?.stato === "CONTROPROPOSTA_ACCETTATA" || cp?.approvato === true
                        ) ?? null
                        : null;

                const effectiveDetails = acceptedProposal?.dettagli_prodotto ?? p?.dettagli_prodotto;

                const originalLabel =
                    `${p?.dettagli_prodotto?.codiceProduttore ?? ""} ${p?.dettagli_prodotto?.descrizione ?? ""}`.trim();

                const effectiveLabel =
                    `${effectiveDetails?.codiceProduttore ?? ""} ${effectiveDetails?.descrizione ?? ""}`.trim() ||
                    "Prodotto";

                return {
                    // ID “riga quotazione” (rimane quello del cart doc)
                    quotation_product_docId: p._id,

                    // ID prodotto “effettivo” (quello che andrà in OC/FB)
                    // (se non ti serve ora, puoi anche toglierlo, ma è utilissimo per mapping BE/FE)
                    effective_product_id: acceptedProposal?.product_id ?? p?.product_id,

                    // Label immediata e leggibile
                    label: acceptedProposal
                        ? `Sostituito → ${effectiveLabel}`
                        : effectiveLabel,

                    // opzionale: utile se vuoi tooltip/dettaglio originale
                    originalLabel: acceptedProposal ? originalLabel : undefined,
                    isSubstituted: !!acceptedProposal,
                };
            });
    }, [cart]);

    const gate = useQuotationClosureGate(qtsExt, areAllProductsDone);

    //Se il commerciale proprietario non ha ancora assegnato un cliente valido al posto di quello placeholder, non potrà aprire la chiusura della quotazione.
    //cosa che potrà fare se inserirà un cliente reale.
    const handleOpenClosure = () => {
        if (customer?.isPlaceholder) {
            enqueueSnackbar(
                "Impossibile avviare la chiusura: sostituisci prima il cliente placeholder con un cliente reale.",
                { type: "error" },
            );
            return;
        }

        setOpenClosure(true);
    };


    // ——————————————————————————————————————————————————————————
    // HANDLERS
    // ——————————————————————————————————————————————————————————
    // toggle helper
    const toggleExpanded = (id: string) => setExpandedId(prev => (prev === id ? null : id));

    const handleViewProductDetailsFromProposal = (
        productId: string,
        cartItem: CartProductDTO,
    ) => {
        //apri il pannello “Quotazione prodotto” per quell’articolo
        handleOpenQtsSettings(cartItem);

        // chiedi al pannello 3 di aprirsi su quel productId
        setProductDetailsTargetId(productId);
    };

    /** refresh combinato */
    const refreshAll = () => {
        setErrorMsg(null);
        setQts(null);
        try { abortQtsRef.current?.abort(); } catch { }
        try { abortCartRef.current?.abort(); } catch { }
        fetchDetails({});
    };

    /** elimina quotazione (conferma) */
    const onDeleteQuotation = () => {
        if (!qts?._id) return;
        const ok = window.confirm("Confermi l’eliminazione della quotazione?");
        if (!ok) return;

        setErrorMsg(null);
        try { abortDeleteRef.current?.abort(); } catch { }
        abortDeleteRef.current = new AbortController();

        deleteQuotationData({
            abortController: abortDeleteRef.current,
            user: userState,
            quotationId: qts._id,
            currentStato: qts.stato,
            HandleComplete: () => {
                // dopo delete ritorno alla lista
                navigate("/commerciale/quotazioni");
            },
            HandleError: (msg) => setErrorMsg(String(msg || "Errore durante l’eliminazione.")),
        }).catch(() => { });
    };

    const onClickImport = () => {
        fileInputRef.current?.click();
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            handleImportCartFromFile(file);
            e.target.value = ""; // reset per poter ricaricare lo stesso file
        }
    };


    // ——————————————————————————————————————————————————————————
    // EFFECTS
    // ——————————————————————————————————————————————————————————
    useEffect(() => {
        if (quotationId) refreshAll();
        productsQueryRef.current = "";

        return () => {
            try { abortQtsRef.current?.abort(); } catch { }
            try { abortCartRef.current?.abort(); } catch { }
            try { abortDeleteRef.current?.abort(); } catch { }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quotationId, userState?.token]);

    useEffect(() => {
        // quando la quotazione non è più in BOZZA, la tab prodotti/descrizione non deve restare attiva
        if (!qts?.stato) return;

        const isDraft = qts.stato === "BOZZA";
        const isInvalidScope = scope === "prodotti" || scope === "descrivi_necessita";

        if (!isDraft && isInvalidScope) {
            handleScopeChange("quotazioni");
            // opzionale: chiudi pannelli aperti legati alla tab prodotti
            setOpenSearch(false);
            setOpenFilters(false);
        }
    }, [qts?.stato, scope, handleScopeChange, setOpenSearch, setOpenFilters]);


    // ——————————————————————————————————————————————————————————
    // RETURN HOOK
    // ——————————————————————————————————————————————————————————
    return (
        <DashboardLayout>
            <HeaderBar onDeleteQuotation={onDeleteQuotation} refreshAll={refreshAll} qts={qts} loading={(loading.general_data || loading.cart) as boolean} />
            {qts && qts.stato === "VALIDAZIONE" && <QuotazioneLock className="mt-2" quoteType={qts?.tipologia} status={qts?.stato} onApproveUnlock={HandleQuotationState} onRejectUnlock={(reason) => HandleQuotationState({ isRefused: true, closed_reason: reason })} />}
            {errorMsg && <RenderError error={String(errorMsg)} />}

            {/* Banner di validità della quotazione + messaggio */}
            {(!isBozza && !isDone) && <ValidityBanner
                qts={qts}
                isRequester={isRequester}
                allProductsDone={areAllProductsDone}
                onOpenClosure={handleOpenClosure}
            />}

            {(!isBozza && gate.locked && !isDone) && (
                <RenderError error={`Quotazione bloccata: ${(qts?.tipologia === "MEPA" && gate.lockReason === "VALIDITY_EXPIRED") ? " gara MEPA scaduta e " : ""} in attesa di chiusura da parte del richiedente.`} />
            )}

            {/* Allert sulla data di validita (fine) errata se si è in bozze */}
            {isBozza && qts.finestraValidita?.fine && new Date(qts.finestraValidita.fine) < new Date() && !isDone && (
                <RenderError error="La data di validità della quotazione è scaduta, procedi a cambiarla all'interno della card 'Dettagli Quotazione' prima di aprire la quotazione." />
            )}

            {/* LAYOUT: 3 colonne (1-2-9) con header bar sopra e tabella prodotti a destra */}
            {qts && <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4">
                {/* titolo + azioni principali + cards */}
                <FDBox variant="ghost" className="col-span-12 lg:col-span-3 flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-2">
                    <QuotationDetailsCard quotation={qts} isAdmin={CheckAdminDev}
                        totalAmount={qts?.valore} onUpdateValidityWindow={handleUpdateValidityWindow} prog_num={(qts as any)?.prog_num}
                        setOpenOkLinksPanel={setOpenOkLinksPanel} fetchQuotationOkLinks={fetchQuotationOkLinks} loading={loading} setLoading={setLoading} isAgent={(userState && userState?.details?.ruolo == CheckRole(3)) ?? false} />
                    {isBozza && <CartPanel qts={qts} cart={cart} clearCart={clearCart} loadingCart={loading.adding_to_cart as Map<string, boolean>}
                        updateCartItemQuantity={updateCartItemQuantity} removeFromCart={removeFromCart} openQuotation={HandleQuotationState} />}
                    <QuoteProgressCard value={getProgressPercentage()} />
                    <CustomersCard
                        customer={customer}
                        setOpenCustomersDetails={setOpenCustomersDetails}
                        // Abilitiamo il bottone solo nel caso utile lato UX:
                        // richiedente proprietario + BID_PASSIVO + cliente ancora placeholder.
                        // Se il cliente è già reale, il bottone sparisce (sostituzione one-shot lato UI).
                        // La protezione definitiva resta comunque lato BE.
                        canReplacePlaceholderCustomer={Boolean(isRequester && qts?.tipologia === "BID_PASSIVO" && customer?.isPlaceholder)}
                        onReplacePlaceholderCustomer={handleReplacePlaceholderCustomer}
                    />
                </FDBox>

                {/* LISTA PRODOTTI */}
                <FDBox variant="ghost" className="col-span-12 lg:col-span-9 flex flex-col gap-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={onFileChange}
                    />
                    <InternalBar
                        menuRef={contextMenuRef} chips={chips}
                        setOpenSearch={setOpenSearch} setOpenFilters={setOpenFilters}
                        scope={scope} handleScopeChange={handleScopeChange}
                        isBozza={isBozza}
                        onImportFromFile={onClickImport}
                        onFileChange={onFileChange}
                        hasProducts={hasProducts}
                    />

                    <FDSkeletonSwitch
                        loading={loading.cart as boolean}
                        skeleton={<FDSkeletonLayout layout={FDSkeletonPresets.cardList(3, { rowHeight: 200 })} />}
                        className="flex flex-col gap-2"
                    >
                        <div className=" min-h-full h-[80vh]">
                            {scope === "descrivi_necessita" ?
                                <TextRequestForm
                                    initialDescription={(cart.find(p => p.kind === "TEXT_REQUEST") as TextRequestCartDTO)?.textRequest?.descrizione ?? ""}
                                    initialNote={currentProposalNote}
                                    initialBuyerCode={(cart.find(p => p.kind === "TEXT_REQUEST") as TextRequestCartDTO)?.codice_buyer ?? undefined}
                                    onSubmit={addTextToCart}
                                    onOpenQuotation={HandleQuotationState}
                                    buyersOptions={buyerOptions}
                                /> :
                                (scope === 'prodotti' ? raw.length > 0 : cart.length > 0) ? <DocumentsVirtualView
                                    items={scope === 'prodotti' ? raw : Array.from(cart)}
                                    view={scope === 'prodotti' ? view : 'list'}
                                    // tuning layout
                                    cardHeight={cardH}
                                    minColWidth={minColW}
                                    loading={loading.table_of_products as boolean}
                                    gapX={16}
                                    gapY={16}
                                    overscan={6}
                                    // renderers
                                    renderCard={(it) => ((scope === 'prodotti' && isBozza) &&
                                        <ProductCard item={it} addToCart={addToCart} loadingAddingToCart={((loading.adding_to_cart as Map<string, boolean>).has(it._id))} />)}
                                    renderRow={(it) =>
                                        it.kind === "TEXT_REQUEST" ? (
                                            <TextRequestCard
                                                item={it as TextRequestCartDTO}
                                                isQBozza={isBozza}
                                                isBuyer={CheckAdminDev}
                                                menuRef={contextMenuRef}
                                                handleOpenQtsSettings={handleOpenQtsSettings}
                                            />
                                        ) : (
                                            <QuotationCard
                                                item={it as CartProductDTO}
                                                isQBozza={isBozza}
                                                isBIDPassivo={qts?.tipologia === "BID_PASSIVO"}
                                                menuRef={contextMenuRef}
                                                handleOpenQtsSettings={handleOpenQtsSettings}
                                                expanded={expandedId === it._id}
                                                onToggle={() => toggleExpanded(it._id)}
                                                onViewProductDetails={handleViewProductDetailsFromProposal}
                                            />
                                        )
                                    }
                                    scope={scope} // tab attivo - favorites, shared, deleted
                                    // infinite scroll
                                    onEndReached={() => runSearch(productsQueryRef.current, false, true)}                 // dal tuo hook
                                    endReachedDisabled={scope !== "prodotti" || (loading.table_of_products as boolean) || !inpagination?.hasMore || inpagination?.loadingMore || (loading.loadingMore as boolean)}
                                    loadingMore={loading.loadingMore as boolean}
                                    highlightedItemId={highlightedItemId}
                                /> :
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                        <img src={cartEmpty} alt="Carrello vuoto" className="max-h-86 object-contain grayscale opacity-50 avoid-drag" />
                                        <p className="text-sm text-neutral-500">Nessun {scope === "prodotti" ? "prodotto" : "elemento in quotazione"} da mostrare.</p>
                                        {(scope !== "prodotti" && isBozza) ? (
                                            <FDButton variant="outline" size="small" color="warning" onClick={() => handleScopeChange("prodotti")}>
                                                Aggiungi Prodotti alla Quotazione
                                            </FDButton>
                                        ) : null}
                                    </div>
                            }
                        </div>
                    </FDSkeletonSwitch>
                </FDBox>
            </div>}

            <FDSearchPanel
                open={!!openSearch}
                onClose={() => setOpenSearch(false)}
                query={searchQuery}
                onQueryChange={(e: string) => searchDebounced(e, true)}
                loading={loading.search as boolean}
                items={searchPanelItems}
                onSelect={(it: any) => {
                    const d = it.payload as ProductDoc;
                    const isInCart = loading.cart ? Boolean(d.inCart) : cartProductIds.has(d._id);
                    
                    if (isBozza) {
                        if (isInCart) {
                            removeFromCart(d._id);
                            return;
                        }
                        addToCart(d);
                    } else {
                        handleSelectFromSearch({ payload: d } as SearchItem<any>); // riusa la logica di selezione per visualizzare il prodotto nel carrello
                    };
                }}
                placeholder="Cerca prodotti nel catalogo (stato carrello incluso)…"
                emptyLabel="Inizia a digitare per cercare…"
                emptyNoResultsLabel="Nessun risultato per questa ricerca."
                highlight
                recentSearch={{ enabled: true, cookieName: "cart_search_recent", limit: 10 }}
                appliedFilters={[
                    ...(filters.marca ? [{ key: "marca", value: `Marca: ${filters.marca.Marca}`, onRemove: () => setFilters({ ...filters, marca: null }) }] : []),
                    ...(filters.linea ? [{ key: "linea", value: `Linea: ${filters.linea.Linea}`, onRemove: () => setFilters({ ...filters, linea: null }) }] : []),
                    ...(filters.gruppo ? [{ key: "gruppo", value: `Gruppo: ${filters.gruppo.Gruppo}`, onRemove: () => setFilters({ ...filters, gruppo: null }) }] : []),
                    ...(filters.raggruppamento ? [{ key: "raggruppamento", value: `Raggruppamento: ${filters.raggruppamento}`, onRemove: () => setFilters({ ...filters, raggruppamento: null }) }] : []),
                ]}
                customRecent={recentSearch}
                setCustomRecent={setRecentSearch}
            />

            <ProductsDetails
                open={!!openProductQtsSettings}
                onClose={() => setOpenProductQtsSettings(null)}
                product={openProductQtsSettings as CartProductDTO | TextRequestCartDTO}
                qtsState={qts?.stato ?? null}
                isBuyer={(userState && userState?.details?.ruolo == CheckRole(2)) ?? false}
                isAgent={(userState && userState?.details?.ruolo == CheckRole(3)) ?? false}
                CheckAdminDev={CheckAdminDev}
                /* Stato dell'utente */
                userState={userState}

                onOpenSubstitutionSearch={() => {
                    searchDebounced("");
                }}

                searchQuery={searchQuery}
                searchDebounced={searchDebounced}
                searchItems={searchItems}
                loading={loading}

                onSubmitPrice={() => handleReqQtsProductsChangeState("ATTESA_APPROVAZIONE")}
                onAccept={() => handleReqQtsProductsChangeState("VALUTAZIONE_COMPLETATA")}
                onRefuse={() => handleReqQtsProductsChangeState("VALUTAZIONE_RIFIUTATA")}
                onAcceptProposal={() => handleReqQtsProductsChangeState("CONTROPROPOSTA_ACCETTATA")}
                onRefuseProposal={() => handleReqQtsProductsChangeState("CONTROPROPOSTA_RIFIUTATA")}
                onRequestCounter={() => handleReqQtsProductsChangeState("CONTROPROPOSTA_RICHIESTA")}
                onSubmitProposal={() => handleReqQtsProductsChangeState("CONTROPROPOSTA_INVIATA")}
                selectSubstitutionProductForCurrent={selectSubstitutionProductForCurrent}
                toggleCommercialAlternativeForCurrent={toggleCommercialAlternativeForCurrent}
                createCounterProposalFromCommercialSuggestionForCurrent={createCounterProposalFromCommercialSuggestionForCurrent}
                onPriceChange={handleProposeQtsProductsPrice}
                onDirectQuoteExpiryChange={handleDirectQuoteExpiryChange}
                sendProductNote={sendProductNote}

                // nuova gestione prezzo proposta                
                onChangeProposalPrice={(e: React.ChangeEvent<HTMLInputElement>, _id: string) => {
                    if (!openProductQtsSettings) return;
                    const raw = e.target.value.trim();
                    const normalized = raw.replace(",", ".");
                    const value = normalized === "" ? undefined : Number(normalized);
                    updateSubstitutionDraft({
                        price: Number.isFinite(value) ? (value as number) : undefined,
                        _id,
                    });
                }}
                // nuova gestione quantità proposta: riutilizziamo updateCartItemQuantity
                onChangeProposalQuantity={(qty: number, _id: string) => {
                    if (!openProductQtsSettings) return;
                    updateSubstitutionDraft({ quantity: qty, _id });
                }}
                onChangeProposalExpiry={(value: string, _id: string) => {
                    if (!openProductQtsSettings) return;
                    updateSubstitutionDraft({
                        expiry: value ? new Date(value).toISOString() : null,
                        _id,
                    });
                }}
                // nota “draft” collegata alla quotazione aperta
                onChangeProposalNote={onChangeProposalNote}
                currentProposalNote={currentProposalNote}
                getFilteredEventsForCurrentProduct={getFilteredEventsForCurrentProduct}

                isDraftQuotation={isBozza} isPassiveBid={qts?.tipologia === "BID_PASSIVO"}
                buyerOptions={buyerOptions}
                categoryIndex={categoryIndex}
                assigningBuyer={assigningBuyer}
                onAssignBuyer={async (buyerCode) => {
                    const result = await handleAssignBuyer(buyerCode);
                    if (result?.shouldExitQuotation) {
                        navigate("/commerciale/quotazioni");
                    }
                }}
                onAssignCategories={(from: "prefisso" | "linea" | "gruppo", value) => {
                    handleAssignExtraProductsDetails(from, value);
                }}
                // Wiring segnalazione anomalia verso ProductDetailsReporting:
                // il componente figlio costruisce original+patch+note e il hook
                // persiste il tutto come evento prodotto su Mongo.
                onReportProductAnomaly={handleReportProductAnomaly}
                reportingAnomaly={reportingAnomaly}

                // nuovo wiring per il pannello 3
                autoOpenProductDetailsId={productDetailsTargetId}
                onAutoOpenProductDetailsHandled={() => setProductDetailsTargetId(null)}
                onSelectCounterProposal={setActiveCounterProposalForCurrent}

                /* Closure gate */
                locked={gate.locked}
            />

            <CustomersPanel
                cliente={customer?.CodiceCliente?.Focelda ?? ""}
                // Guard finale: se il cliente e placeholder BID_PASSIVO
                // non apriamo il pannello anagrafica (non esiste una scheda reale).
                openFor={Boolean(openCustomersDetails && !customer?.isPlaceholder)}
                onClose={() => setOpenCustomersDetails(false)}
            />

            {/* Wizard di chiusura quotazione */}
            <ClosureWizard
                open={openClosure} // si apre se è requester e la quotazione è pronta per essere chiusa (es. scaduta con tutti i prodotti valutati), oppure se il requester clicca sulla CTA di apertura
                onClose={() => setOpenClosure(false)}
                qts={qtsExt}
                isRequester={isRequester}
                productRows={productRows}
                onConfirm={async (draft: ClosureDraft) => {
                    if (draft && draft.finalOutcome && (draft.finalOutcome == "OK" || draft.finalOutcome == "KO")) {
                        HandleQuotationState({ nextState: draft.finalOutcome, closureDraft: draft });
                    };
                }}
            />

            <DuplicateQuotationModal
                open={duplicateModalOpen}
                onClose={closeDuplicateModal}
                candidates={duplicateCandidates}
                onOpenExisting={(id) => {
                    closeDuplicateModal();
                    navigate(`/quotazioni/${id}`);
                }}
                onContinue={continueOpenAfterDuplicate}
            />

            {/* Context Menu per i filtri */}
            <ContextMenu
                openFor={openFilters}
                pos={contextMenuRef}
                onClose={() => { setOpenFilters(false); }}
                panel={
                    <Filters
                        categoryData={categoryData ?? []}
                        filterState={filters}
                        setFilterState={setFilters}
                        runSearch={(q: string, fromDebounced: boolean, fromScroll?: boolean) => {
                            productsQueryRef.current = q;
                            if (scope == "prodotti") {
                                return runSearch(q, fromDebounced, fromScroll);
                            } else if (scope == "quotazioni") {
                                return runSearchOnCart(q, fromDebounced, false, true);
                            };
                        }}
                        scope={scope}
                        resetFilters={() => {
                            setFilters({
                                marca: null,
                                linea: null,
                                gruppo: null,
                                famiglia: null,
                                raggruppamento: null,
                            });
                        }}
                    />
                }
            />

            <OkLinksSidePanel
                open={openOkLinksPanel}
                onClose={() => setOpenOkLinksPanel(false)}
                onRefresh={fetchQuotationOkLinks}
                loading={Boolean(loading.get_quotation_ok_links)}
                items={okLinks}
            />

            <Tooltip id="general-quotations-tooltip" place="bottom" className="max-w-[15vw] min-w-[150px] !text-xs text-center z-50 !rounded-md" />
        </DashboardLayout >
    );
};

export default QuotationDetails;