import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FDBackdrop } from "components/UI/box/FDBackdrop";
import FDBox from "components/UI/box/FDBox";

import { SidePanelShell } from "./SidePanelShell";
import type {
    CartProductDTO,
    CommercialAlternativeSuggestionDTO,
    ContropropostaDTO,
    ProductEventDTO,
    ProductEventType,
    TextRequestCartDTO,
} from "layouts/quotazioni/types/qts_product";
import {
    stateProductLabels,
    stateProductOptionsPalette,
    Stato,
    RigaStato,
    productStateTransitions,
    Tipologia,
} from "layouts/quotazioni/types/quotations";
//icons
import {
    MdDone,
    MdClose,
    MdEuro,
    MdSwapHoriz,
    MdOutlineRequestQuote,
} from "react-icons/md";
import { FiChevronRight, FiChevronLeft, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { ProductSubstitutionSearch } from "./ProductSubstitutionSearch";
import { GoInfo, GoPlus } from "react-icons/go";
import { LuSend } from "react-icons/lu";

import { ProductDetailsReporting } from "examples/productDetails/ProductDetailsReporting";
import FDSelect, { FDSelectOption } from "components/UI/input/FDSelect";
import FDButton from "components/UI/buttons/FDButton";
import FDIconButton from "components/UI/buttons/FDIconButton";
import FDDate from "components/UI/input/FDDate";
import { useExpiryCountdown } from "../hook/useQuotationClosureGate";
import { UserState } from "types/UserContext";
import { formatISODate, toLocalDateTimeInputValue } from "utils/date/getDate";
import { CapitalizeFirstLetter } from "utils/string/capitalize";
import { CategoryIndex, normalizeKey } from "../hook/useDetailsQuotation";

const MdDoneIcon = MdDone as React.FC<{ className?: string }>;
const MdCloseIcon = MdClose as React.FC<{ className?: string; size?: number }>;
const MdEuroIcon = MdEuro as React.FC<{ className?: string }>;
const MdSwapHorizIcon = MdSwapHoriz as React.FC<{ className?: string }>;
const MdOutlineRequestQuoteIcon =
    MdOutlineRequestQuote as React.FC<{ className?: string }>;
const FiChevronRightIcon = FiChevronRight as React.FC<{ className?: string }>;
//const GoAlertIcon = GoAlert as React.FC<{ className?: string }>;
const GoInfoIcon = GoInfo as React.FC<{ size?: number; className?: string }>;
const GoPlusIcon = GoPlus as React.FC<{ size?: number; className?: string }>;
const LuSendIcon = LuSend as React.FC<{ size?: number; className?: string }>;


// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
type ProductsDetailsProps = {
    open: boolean;
    onClose: () => void;
    product: CartProductDTO | TextRequestCartDTO;
    /** true se Buyer/Admin/Dev (CheckAdminDev) */
    isBuyer: boolean;
    /** true se Agent */
    isAgent: boolean;
    qtsState: Stato | null;

    searchQuery: string;
    searchDebounced: (value: string) => void;
    searchItems: CartProductDTO[];
    loading: { [key: string]: boolean | Map<string, boolean> };

    // Buyer side
    /** Funzione che permettere di ricercare il prodotto in base alla descrizione, all'apertura del pannello SECONDARY dedicato alla ricerca */
    onOpenSubstitutionSearch: () => void;
    onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDirectQuoteExpiryChange: (value: string) => void;
    onSubmitPrice: () => void;
    /** aggiorna la quantità proposta nella controproposta attiva */
    onChangeProposalQuantity: (value: number, _id: string) => void;
    /** aggiorna il prezzo proposto nella controproposta attiva */
    onChangeProposalPrice: (e: React.ChangeEvent<HTMLInputElement>, _id: string) => void;
    onChangeProposalExpiry: (value: string, _id: string) => void;
    /** aggiorna la nota associata alla proposta (opzionale) */
    onChangeProposalNote: (value: string) => void;
    /** nota corrente (se esiste) */
    currentProposalNote?: string;
    sendProductNote: () => void;

    // Agent side
    onAccept: () => void;
    onAcceptProposal: () => void;
    onRefuse: () => void;
    onRefuseProposal: () => void;
    onRequestCounter: () => void;
    onSubmitProposal: () => void;

    // substitution
    selectSubstitutionProductForCurrent: (product: CartProductDTO) => void;
    toggleCommercialAlternativeForCurrent: (product: CartProductDTO) => void;
    createCounterProposalFromCommercialSuggestionForCurrent: (suggestionId: string) => void;

    /** true se la quotazione padre è in stato BOZZA */
    isDraftQuotation?: boolean;
    isPassiveBid?: boolean;

    /** elenco buyer selezionabili dal commerciale */
    buyerOptions?: {
        value: string;
        label: string;
        description?: string;
    }[];

    categoryIndex: CategoryIndex;

    /** loading durante la chiamata di assegnazione */
    assigningBuyer?: boolean;

    /** callback per assegnare il buyer alla riga corrente */
    onAssignBuyer?: (buyerCode: string) => void | Promise<any>;
    /** callback per assegnare le categorie alla riga corrente */
    onAssignCategories: (from: "prefisso" | "linea" | "gruppo", value: string | null) => void;
    /** callback invocata quando l'utente invia la segnalazione anomalia scheda prodotto */
    onReportProductAnomaly?: (payload: {
        note: string;
        original: Record<string, any>;
        patch: Record<string, any>;
    }) => void;
    /** stato di loading invio segnalazione */
    reportingAnomaly?: boolean;

    /** se valorizzato, apre automaticamente il pannello Dettaglio prodotto per questo id */
    autoOpenProductDetailsId: string | null;

    /** callback chiamata dopo aver gestito autoOpenProductDetailsId (per resettare lo stato nel parent) */
    onAutoOpenProductDetailsHandled: () => void;

    /** Ottieni gli eventi filtrati per il prodotto corrente */
    getFilteredEventsForCurrentProduct: ({ includeTypes, excludeTypes }: { includeTypes?: ProductEventType[]; excludeTypes?: ProductEventType[] }) => ProductEventDTO[];
    onSelectCounterProposal: (proposalId: string) => void;
    /** Stato che definisce un ulteriore condizione di blocco per interagire con il prodotto */
    locked?: boolean;
    userState?: UserState | null;
    CheckAdminDev: boolean;
};

type CounterProposalSectionProps = {
    proposals: ContropropostaDTO[];
    isBuyer: boolean;
    showBuyerActions: boolean;

    onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmitProposal: () => void;
    onOpenSubstitutionSearch: () => void;
    /** Apri i dettagli del prodotto selezionato */
    fetchProductDetails: (id_product: string) => void;
    isTextRequest: boolean;
    /** Indica se abilitare la selezione della controproposta (lato commerciale) */
    selectionEnabled?: boolean;
    /** Id della controproposta selezionata (lato commerciale) */
    selectedProposalId?: string | null;
    /** Callback chiamata quando si seleziona una controproposta (lato commerciale) */
    onSelectProposal?: (proposalId: string) => void;
    /** Indica se la quotazione è in stato RIFIUTATO (lato commerciale) */
    isRefusedState: boolean;
    /** Indica se la quotazione è in stato COMPLETATO (lato commerciale) */
    isCompletedState: boolean;
    currentState?: RigaStato;
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const productEventTypeUI: Record<
    ProductEventType,
    { label: string; tone: "neutral" | "positive" | "negative" | "alert" | "highlight" }
> = {
    CREAZIONE_QUOTAZIONE: { label: "Quotazione creata", tone: "neutral" },
    RICHIESTA_PREZZO: { label: "Richiesta prezzo", tone: "neutral" },
    PROPOSTA_PREZZO: { label: "Proposta di prezzo", tone: "highlight" },
    ACCETTAZIONE_PREZZO: { label: "Prezzo accettato", tone: "positive" },
    RIFIUTO_PREZZO: { label: "Prezzo rifiutato", tone: "negative" },
    RICHIESTA_SOSTITUZIONE: { label: "Richiesta sostituzione", tone: "alert" },
    PROPOSTA_SOSTITUZIONE: { label: "Proposta sostitutiva", tone: "highlight" },
    ACCETTAZIONE_SOSTITUZIONE: {
        label: "Sostituzione accettata",
        tone: "positive",
    },
    RIFIUTO_SOSTITUZIONE: { label: "Sostituzione rifiutata", tone: "negative" },
    CAMBIO_STATO: { label: "Cambio stato", tone: "neutral" },
    NOTA: { label: "Nota", tone: "neutral" },
    SEGNALAZIONE_ANOMALIA_SCHEDA: { label: "Segnalazione anomalia scheda", tone: "alert" },
    CAMBIO_BUYER: { label: "Cambio buyer", tone: "neutral" },
    CAMBIO_DETTAGLI_PRODOTTO: { label: "Cambio dettagli prodotto", tone: "neutral" },
    SUGGERIMENTO_ALTERNATIVA_AGGIUNTO: { label: "Alternativa commerciale aggiunta", tone: "highlight" },
    SUGGERIMENTO_ALTERNATIVA_RIMOSSO: { label: "Alternativa commerciale rimossa", tone: "negative" },
    ALTRO: { label: "Aggiornamento", tone: "neutral" },
};

const toneClasses: Record<
    "neutral" | "positive" | "negative" | "alert" | "highlight",
    string
> = {
    neutral:
        "bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-900/70 dark:text-neutral-100 dark:border-neutral-700",
    positive:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700",
    negative:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700",
    highlight:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-700",
    alert:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700",
};

function buildEventTitle(event: ProductEventDTO): string {
    const ui = productEventTypeUI[event.type] ?? productEventTypeUI.ALTRO;

    // se hai meta fromState/toState, arricchisci il titolo
    if (event.type === "CAMBIO_STATO" && event.meta?.fromState && event.meta?.toState) {
        return `${ui.label}: ${event.meta.fromState} → ${event.meta.toState}`;
    }

    if (
        (event.type === "PROPOSTA_SOSTITUZIONE" ||
            event.type === "ACCETTAZIONE_SOSTITUZIONE" ||
            event.type === "RIFIUTO_SOSTITUZIONE") &&
        event.meta?.substitutedProductId
    ) {
        return `${ui.label} (prodotto sostitutivo)`;
    };

    return ui.label;
};

function formatDecimal(val?: string | number): string {
    if (val === undefined || val === null) return "-";
    const num =
        typeof val === "string" ? Number(val.replace(",", ".")) : Number(val);
    if (Number.isNaN(num)) return String(val);
    return num.toLocaleString("it-IT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

function formatISODateTime(val?: string | Date): string {
    if (!val) return "-";
    const d = new Date(val);
    if (typeof val === "string" && Number.isNaN(d.getTime())) return val;
    return d.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });
};

function isExpiredDateTime(val?: string | Date | null): boolean {
    if (!val) return false;
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
};


// ——————————————————————————————————————————————————————————
// SUB COMPONENT
// ——————————————————————————————————————————————————————————
const ProductSummaryHeader: React.FC<{
    isPassiveBid?: boolean;
    document: CartProductDTO | TextRequestCartDTO;
    proposals: ContropropostaDTO[];
    fetchProductDetails: (id_product: string) => void;

    // Opzioni assegnazione buyer (solo lato commerciale in BOZZA)
    canShowBuyerSelect?: boolean;
    canChangeBuyer?: boolean;
    buyerOptions?: {
        value: string;
        label: string;
        description?: string;
    }[];
    assigningBuyer?: boolean; onAssignBuyer?: (buyerCode: string) => void | Promise<any>;
    /** callback per assegnare le categorie alla riga corrente */
    onAssignCategories: (from: "prefisso" | "linea" | "gruppo", value: string | null) => void;

    /** Indice delle categorie, costruito a partire da categoryData con useMemo nel parent */
    categoryIndex: CategoryIndex;

    /** Indica se la richiesta è di tipo testo */
    isTextRequest?: boolean;
    isRefusedState: boolean;
    isCompletedState: boolean;
}> = ({ isPassiveBid, document, proposals, fetchProductDetails, canShowBuyerSelect, canChangeBuyer, buyerOptions,
    categoryIndex, assigningBuyer, onAssignBuyer, onAssignCategories, isTextRequest, isRefusedState, isCompletedState }) => {
        const [editingBuyer, setEditingBuyer] = useState(false);
        const [extendedDescription, setExtendedDescription] = React.useState(false)

        const { quotazione } = document;
        const stato = quotazione?.stato;
        const chipClass = stateProductOptionsPalette[stato] ?? stateProductOptionsPalette.ATTESA_VALUTAZIONE;

        const hasProposals = Array.isArray(proposals) && proposals.length > 0;

        const scadenza = quotazione?.scadenza;


        // ─────────────────────────────────────────────────────────────
        // USE EFFECT
        // ─────────────────────────────────────────────────────────────
        // reset modalità edit quando cambio riga
        useEffect(() => {
            setEditingBuyer(false);
        }, [document._id]);

        const selectedLinea = normalizeKey(
            (document as CartProductDTO)?.dettagli_prodotto?.linea
        );

        const selectedGruppo = normalizeKey(
            (document as CartProductDTO)?.dettagli_prodotto?.gruppo
        );

        const prefissoOptions = categoryIndex.prefissoOptions;
        const lineaOptions = useMemo<FDSelectOption[]>(() => {
            if (!isPassiveBid) return [];

            const lineaByGruppo = Array.from(
                categoryIndex.lineeByGruppo.get(selectedGruppo)?.values() ?? []
            );

            if (selectedGruppo && lineaByGruppo.length > 0) {
                return lineaByGruppo;
            }

            return categoryIndex.allLineaOptions;
        }, [categoryIndex, selectedGruppo, isPassiveBid]);
        const gruppoOptions = useMemo<FDSelectOption[]>(() => {
            if (!isPassiveBid) return [];

            const gruppiByLinea = Array.from(
                categoryIndex.gruppiByLinea.get(selectedLinea)?.values() ?? []
            );
            if (selectedLinea && gruppiByLinea.length > 0) {
                return gruppiByLinea;
            }

            return categoryIndex.allGruppoOptions;
        }, [categoryIndex, selectedLinea, isPassiveBid]);

        //dati che permetto la creazione dei select a filtraggio.
        const dataSelects = [
            {
                label: "Prefisso",
                ref: "label",
                stateRef: (document as CartProductDTO)?.dettagli_prodotto?.prefisso,
                noneOnClick: () => {
                    onAssignCategories("prefisso", null);
                },
                menuItemOnClick: (item: string) => {
                    onAssignCategories("prefisso", item);
                },
                dataArray: prefissoOptions
            },
            {
                label: "Linea",
                ref: "label",
                stateRef: selectedLinea,
                noneOnClick: () => {
                    onAssignCategories("linea", null);
                },
                menuItemOnClick: (item: string) => {
                    onAssignCategories("linea", item);
                },
                dataArray: lineaOptions
            },
            {
                label: "Gruppo",
                ref: "label",
                stateRef: selectedGruppo,
                noneOnClick: () => {
                    onAssignCategories("gruppo", null);
                },
                menuItemOnClick: (item: string) => {
                    onAssignCategories("gruppo", item);
                },
                multiSelect: true,
                dataArray: gruppoOptions
            },
        ];


        // ─────────────────────────────────────────────────────────────
        // COMPONENT RENDER
        // ─────────────────────────────────────────────────────────────
        const renderBuyerSection = () => {
            if (!buyerOptions || !onAssignBuyer) {
                // modalità "pill" semplice
                return (
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-900 text-[11px] text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2.5 py-[3px]">
                            {document.codice_buyer ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="font-medium">{document.codice_buyer}</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span className="font-medium">Non assegnato</span>
                                </>
                            )}
                        </span>
                    </div>
                );
            };

            const canUseSelect =
                (canShowBuyerSelect || (canChangeBuyer && editingBuyer)) && buyerOptions.length > 0;

            if (canUseSelect) {
                return (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2"
                    >
                        <FDSelect
                            size="xs" radius="md"
                            placeholder="Seleziona il buyer…"
                            options={buyerOptions}
                            value={document.codice_buyer ?? undefined}
                            onChange={(value) => {
                                if (typeof value === "string") {
                                    onAssignBuyer(value);
                                    if (canChangeBuyer) {
                                        setEditingBuyer(false);
                                    }
                                }
                            }}
                            disabled={assigningBuyer}
                            virtualized={false}
                            className="min-w-60"
                        />
                        {canChangeBuyer && (
                            <button
                                type="button"
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    setEditingBuyer(false);
                                }}
                                className="text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 underline-offset-2 hover:underline"
                            >
                                Annulla
                            </button>
                        )}
                    </div>
                );
            };

            // pill + "cambia buyer"
            return (
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-900 text-[11px] text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2.5 py-[3px]">
                        {document.codice_buyer ? (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="font-medium">{document.codice_buyer}</span>
                            </>
                        ) : (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span className="font-medium">Non assegnato</span>
                            </>
                        )}
                    </span>

                    {canChangeBuyer && document.codice_buyer && (
                        <button
                            type="button"
                            onClick={(ev) => {
                                ev.stopPropagation();
                                setEditingBuyer(true);
                            }}
                            className="text-[10px] font-medium text-sky-600 dark:text-sky-300 hover:text-sky-700 dark:hover:text-sky-200"
                        >
                            Cambia buyer
                        </button>
                    )}
                </div>
            );
        };

        const renderStatusChip = () => {
            //controlla se lo stato è definito e se è presente nella mappa productStateTransitions, altrimenti usa uno stato di default
            const displayStato = stato ? (productStateTransitions[stato] ?
                CapitalizeFirstLetter(productStateTransitions[stato].replace("_", " "))
                : stateProductLabels[stato]) : "Stato non definito";

            return <span
                className={[
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    chipClass,
                ].join(" ")}
            >
                <span className="w-1.5 h-1.5 rounded-full bg-current/40" />
                <span>
                    {displayStato}
                </span>
            </span>
        };


        // ─────────────────────────────────────────────────────────────
        // LAYOUT TEXT_REQUEST
        // ─────────────────────────────────────────────────────────────
        if (isTextRequest) {
            const { textRequest } = document as TextRequestCartDTO;
            return (
                <FDBox
                    variant="soft"
                    color="neutral"
                    radius="lg"
                    pad="md"
                    shadow="sm"
                    className="mb-4 flex flex-col gap-3 bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-700/80"
                >
                    {/* Header: titolo + stato */}
                    <div className="flex flex-col items-start justify-between gap-2">
                        <div className="w-full space-y-1">
                            <div className="flex w-full justify-between gap-2 mb-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-700 px-2 py-[2px] text-[10px] text-sky-700 dark:text-sky-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                    <span className="font-semibold tracking-[0.08em] uppercase">
                                        Richiesta descrittiva
                                    </span>
                                </span>
                                {/** Mostra FDIconButton solo se c'è effettivamente la necessità di espandere/contrarre la descrizione */}
                                {textRequest?.descrizione && textRequest.descrizione.length > 100 && (
                                    <FDIconButton
                                        icon={extendedDescription ? FiChevronUp({}) : FiChevronDown({})}
                                        size="small"
                                        onClick={extendedDescription ? () => setExtendedDescription(false) : () => setExtendedDescription(true)}
                                    />
                                )}
                            </div>

                            <h2 className="text-[14px] font-semibold text-neutral-800 dark:text-neutral-100 line-clamp-2">
                                {textRequest?.titolo || "Richiesta senza titolo"}
                            </h2>

                            {textRequest?.descrizione && (
                                <p className={`text-[12px] text-neutral-600 dark:text-neutral-300 ${extendedDescription ? "" : "line-clamp-3"}`}>
                                    {textRequest.descrizione}
                                </p>
                            )}
                        </div>

                        {renderStatusChip()}
                    </div>

                    {/* Buyer */}
                    <div className="mt-1 flex flex-col gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                            Gestita dal buyer
                        </span>
                        {renderBuyerSection()}
                    </div>

                    {/* Scadenza, se presente */}
                    {scadenza && (
                        <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                La richiesta restera visibile fino alla scadenza della quotazione.
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-900 text-[11px] text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2.5 py-1">
                                <span className="text-[9px] uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                                    Scadenza
                                </span>
                                <span className="font-medium">
                                    {formatISODate(scadenza)}
                                </span>
                            </span>
                        </div>
                    )}
                </FDBox>
            );
        };


        // ─────────────────────────────────────────────────────────────
        // COMPONENT RENDER
        // ─────────────────────────────────────────────────────────────
        const renderCategorySection = () => {
            if (!isPassiveBid) return null;
            return dataSelects.map((elements, index) => {
                return <div key={elements.label + ":__" + index} className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                        {elements.label}
                    </span>
                    {buyerOptions && onAssignBuyer &&
                        (canShowBuyerSelect || (canChangeBuyer && editingBuyer)) ? (
                        // Modalità SELECT (prima assegnazione o cambio)
                        <div
                            onClick={(e) => {
                                // evita di aprire il dettaglio prodotto
                                e.stopPropagation();
                            }}
                            className="flex items-center gap-2"
                        >

                            <FDSelect
                                options={elements?.dataArray}
                                value={(document as CartProductDTO).dettagli_prodotto[elements.label.toLocaleLowerCase() as keyof CartProductDTO['dettagli_prodotto']] ?? null}
                                onChange={(v: any) => elements.menuItemOnClick(v)}
                                placeholder="Seleziona..."
                                size="xs" variant="outline" color="dark" radius="md" fullWidth searchable
                                disabled={!elements.dataArray || elements.dataArray.length === 0}
                                virtualized={false}
                                menuMaxHeight={240}
                                className="min-w-60"
                            />

                            {canChangeBuyer && (
                                <button
                                    type="button"
                                    onClick={(ev) => {
                                        ev.stopPropagation();
                                        setEditingBuyer(false);
                                    }}
                                    className="text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 underline-offset-2 hover:underline"
                                >
                                    Annulla
                                </button>
                            )}
                        </div>
                    ) : (
                        // Modalità "pill" (read-only o con pulsante Cambia)
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-900 text-[11px] text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2.5 py-[3px]">
                                {product?.dettagli_prodotto?.linea ? (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="font-medium">
                                            {product.dettagli_prodotto[elements.label.toLocaleLowerCase() as keyof typeof product.dettagli_prodotto] ?? "N/A"}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        <span className="font-medium">
                                            Non assegnato
                                        </span>
                                    </>
                                )}
                            </span>

                            {canChangeBuyer && (
                                <button
                                    type="button"
                                    onClick={(ev) => {
                                        ev.stopPropagation();
                                        setEditingBuyer(true);
                                    }}
                                    className="text-[10px] font-medium text-sky-600 dark:text-sky-300 hover:text-sky-700 dark:hover:text-sky-200"
                                >
                                    Cambia {elements.label}
                                </button>
                            )}
                        </div>
                    )}


                </div>
            })
        };

        
        // ─────────────────────────────────────────────────────────────
        // KIND = PRODUCT
        // ─────────────────────────────────────────────────────────────
        const product = document as CartProductDTO;
        const { dettagli_prodotto, quantita } = product;

        const canOpenProductDetails =
            !!fetchProductDetails && !isTextRequest && !!product.product_id;


        // ─────────────────────────────────────────────────────────────
        // LAYOUT STANDARD (NESSUNA CONTROPROPOSTA ATTIVA)
        // ─────────────────────────────────────────────────────────────
        return (<>
            <FDBox
                variant="soft"
                color="neutral"
                radius="lg"
                pad="md"
                shadow="sm"
                border={true}
                className={[
                    "space-y-2 bg-white/80 dark:bg-neutral-900/80",
                    "border-neutral-200/80 dark:border-neutral-700/80",
                    canOpenProductDetails ? "cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800" : "",
                ].join(" ")}
                data-tooltip-id="general-quotations-tooltip" data-tooltip-content="Visualizza dettagli prodotto"
                onClick={() => canOpenProductDetails && fetchProductDetails(product.product_id)}
            >
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                            Quotazione prodotto
                        </span>
                        <span className="inline-flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span>{hasProposals ? "È attiva una proposta di sostituzione" : "Dettagli del prodotto richiesto"}</span>
                        </span>
                    </div>

                    {renderStatusChip()}
                </div>

                <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 overflow-hidden shrink-0">
                        {dettagli_prodotto?.anteprima ? (
                            <img
                                src={dettagli_prodotto.anteprima}
                                alt={dettagli_prodotto.descrizione ?? "Prodotto"}
                                className="w-full h-full object-contain bg-white dark:bg-neutral-900"
                            />
                        ) : (
                            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center px-2">
                                Nessuna immagine
                            </span>
                        )}
                    </div>

                    {/* Testo principale */}
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="min-w-0">
                            <h2 className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-100 truncate">
                                {dettagli_prodotto?.descrizione ??
                                    "Prodotto senza descrizione"}
                            </h2>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                                {dettagli_prodotto?.marca ?? "Marca non disponibile"}
                            </p>
                            {(dettagli_prodotto?.codiceProduttore ||
                                dettagli_prodotto?.codiceEAN) && (
                                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                                        {dettagli_prodotto?.codiceProduttore ??
                                            dettagli_prodotto?.codiceEAN}
                                    </p>
                                )}
                        </div>

                        {/* Buyer assignment */}
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                                    Gestita dal buyer
                                </span>

                                {buyerOptions && onAssignBuyer &&
                                    (canShowBuyerSelect || (canChangeBuyer && editingBuyer)) ? (
                                    // Modalità SELECT (prima assegnazione o cambio)
                                    <div
                                        onClick={(e) => {
                                            // evita di aprire il dettaglio prodotto
                                            e.stopPropagation();
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <FDSelect
                                            size="xs" radius="md"
                                            placeholder="Seleziona il buyer…"
                                            options={buyerOptions}
                                            value={product.codice_buyer ?? null}
                                            onChange={(value) => {
                                                if (typeof value === "string") {
                                                    onAssignBuyer(value);
                                                    // se stavo cambiando il buyer, torno in modalità "pill"
                                                    if (canChangeBuyer) {
                                                        setEditingBuyer(false);
                                                    };
                                                };
                                            }}
                                            disabled={assigningBuyer}
                                            virtualized={false}
                                            className="min-w-60"
                                        />
                                        {canChangeBuyer && (
                                            <button
                                                type="button"
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    setEditingBuyer(false);
                                                }}
                                                className="text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 underline-offset-2 hover:underline"
                                            >
                                                Annulla
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    // Modalità "pill" (read-only o con pulsante Cambia)
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-900 text-[11px] text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2.5 py-[3px]">
                                            {product.codice_buyer ? (
                                                <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="font-medium">
                                                        {product.codice_buyer}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                    <span className="font-medium">
                                                        Non assegnato
                                                    </span>
                                                </>
                                            )}
                                        </span>

                                        {canChangeBuyer && product.codice_buyer && (
                                            <button
                                                type="button"
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    setEditingBuyer(true);
                                                }}
                                                className="text-[10px] font-medium text-sky-600 dark:text-sky-300 hover:text-sky-700 dark:hover:text-sky-200"
                                            >
                                                Cambia buyer
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {renderCategorySection()}
                        </div>

                        {/* Riepilogo quantità e prezzo */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                                <span>
                                    Quantità richiesta:{" "}
                                    <span className="font-medium text-neutral-800 dark:text-neutral-100">
                                        {quantita}
                                    </span>
                                </span>
                                {quotazione?.prezzo_finale != null && (
                                    <span>
                                        • Prezzo netto in valutazione:{" "}
                                        <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                                            {formatDecimal(quotazione.prezzo_finale)} €
                                        </span>
                                    </span>
                                )}
                            </div>

                            {quotazione?.scadenza && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-900 text-[11px] text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2.5 py-1">
                                    <span className="text-[9px] uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                                        Scadenza
                                    </span>
                                    <span className="font-medium">
                                        {formatISODate(quotazione.scadenza)}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </FDBox>

            {(hasProposals && !isRefusedState) && <div className="hidden md:flex items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm px-3 py-1.5 text-[11px] text-neutral-500 dark:text-neutral-300">
                    <MdSwapHorizIcon className="text-neutral-500 dark:text-neutral-300" />
                    <span>{isCompletedState ? "Sostituito con" : "Proposta di Sostituzione"}</span>
                </div>
            </div>}
        </>
        );
    };

const CounterProposalSection: React.FC<CounterProposalSectionProps> = ({
    proposals,
    isBuyer,
    onSubmitProposal,
    onOpenSubstitutionSearch,
    fetchProductDetails,
    isTextRequest,
    showBuyerActions,
    selectionEnabled,
    selectedProposalId,
    onSelectProposal,
    isRefusedState,
    isCompletedState,
    currentState,
}) => {
    if (!proposals.length) return null;

    // euristica: l’ultima controproposta è quella “attiva”
    const previousProposals = proposals.slice(0, -1);
    const submitProposalLabel = currentState === "CONTROPROPOSTA_INVIATA"
        ? "Aggiorna proposta al commerciale"
        : "Invia proposta al commerciale";

    // determina se selezionabile per la scelta del commerciale
    const isSelectable = !!selectionEnabled && typeof onSelectProposal === "function";

    const sendDisabled = !proposals
        || (proposals && Array.isArray(proposals)
            && proposals.filter(p => !p.quotazione?.prezzo_finale || !p.quantita).length > 0);

    return (
        <FDBox
            variant="soft"
            color="neutral"
            radius="lg"
            pad="md"
            shadow="sm"
            className="space-y-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
        >
            {/* Box Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                        {isSelectable ? "Seleziona una proposta" : "Proposta di sostituzione"}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {!isTextRequest ? "Confronto tra prodotto richiesto dal commerciale e prodotto proposto dal Buyer." :
                            "Confronto tra richiesta descrittiva del commerciale e proposta del Buyer."}
                    </p>
                </div>

                {!(isRefusedState || isCompletedState) && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-[3px] text-[10px] font-medium text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {isSelectable
                        ? "Selezione richiesta"
                        : isBuyer
                            ? !showBuyerActions
                                ? "Proposta inviata"
                                : "Visibile al commerciale dopo l’invio"
                            : "Proposta ricevuta"}
                </span>}
            </div>

            {/* Lista dei prodotti proposti + quantità e quotazione */}
            {/* Lista proposte: selezionabili (radio-card) quando selectionEnabled === true */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1 p-2">
                {proposals.map((proposal, index) => {
                    const proposalDett = proposal.dettagli_prodotto;
                    const { marca, codiceProduttore, codiceEAN, anteprima, descrizione } = proposalDett || {};

                    const isSelected = !!selectedProposalId
                        ? proposal._id === selectedProposalId
                        : false; // fallback compat (se non passi selectedProposalId)
                    const proposalExpired = isExpiredDateTime(proposal.quotazione?.scadenza);
                    const proposalExpiryLabel = proposal.quotazione?.scadenza ? formatISODateTime(proposal.quotazione.scadenza) : null;

                    const cardBase =
                        "group relative flex gap-2 rounded-xl p-2 border transition" +
                        "bg-white/70 dark:bg-neutral-900/60";

                    const cardSelected =
                        "border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-400/40 dark:ring-emerald-300/30";
                    const cardIdle = "border-neutral-200 dark:border-neutral-700";

                    return (
                        <motion.div
                            key={proposal._id ?? `${codiceProduttore}:${index}`}
                            whileHover={(isSelectable && !proposalExpired) ? { scale: 1.01 } : {}}
                            whileTap={(isSelectable && !proposalExpired) ? { scale: 0.995 } : {}}
                            className={[
                                cardBase,
                                isSelected ? cardSelected : cardIdle,
                                isSelectable && proposalExpired ? "opacity-60 cursor-not-allowed" : ""
                            ].join(" ")}
                            onClick={() => {
                                if (isSelectable) {
                                    if (proposalExpired) return;
                                    onSelectProposal?.(proposal._id);
                                }/* else {
                                    fetchProductDetails(proposal.product_id);
                                }*/
                            }}
                            role={isSelectable ? "radio" : "button"}
                            aria-checked={isSelectable ? isSelected : undefined}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    if (isSelectable) onSelectProposal?.(proposal._id);
                                    else fetchProductDetails(proposal.product_id);
                                }
                            }}
                        >
                            {/* Indicatore radio (solo quando selezionabile) */}
                            {isSelectable && (
                                <div className="absolute right-2 top-2">
                                    <span
                                        className={[
                                            "inline-flex h-5 w-5 items-center justify-center rounded-full border transition",
                                            isSelected
                                                ? "bg-emerald-500 border-emerald-400 shadow-[0_8px_20px_rgba(16,185,129,0.25)]"
                                                : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700",
                                        ].join(" ")}
                                    >
                                        {isSelected && <MdDoneIcon className="w-3.5 h-3.5 text-white" />}
                                    </span>
                                </div>
                            )}

                            {/* Thumbnail */}
                            <div className="w-11 h-11 rounded-xl bg-neutral-50 dark:bg-neutral-900 overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700">
                                {anteprima ? (
                                    <img
                                        src={anteprima}
                                        alt={descrizione ?? "Prodotto"}
                                        className="w-full h-full object-contain bg-white dark:bg-neutral-900"
                                        loading="lazy"
                                    />
                                ) : (
                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center px-2">
                                        Nessuna immagine
                                    </span>
                                )}
                            </div>

                            {/* Body */}
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 pr-7">
                                    {descrizione ?? "Prodotto proposto"}
                                </p>

                                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">
                                    {[marca, codiceProduttore, codiceEAN].filter(Boolean).join(" • ")}
                                </p>

                                <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-neutral-900 px-2 py-[3px] border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-800 dark:text-neutral-100">
                                        Q.tà: {proposal.quantita ?? 1}
                                    </span>

                                    <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-neutral-900 px-2 py-[3px] border border-neutral-200 dark:border-neutral-700 font-semibold text-emerald-600 dark:text-emerald-300">
                                        <MdEuroIcon className="w-3 h-3" />
                                        {formatDecimal(proposal.quotazione?.prezzo_finale ?? proposal.quotazione?.prezzo_base ?? 0)}
                                    </span>

                                    {proposal.quotazione?.scadenza && (
                                        <span className={[
                                            "inline-flex items-center gap-1 rounded-full px-2 py-[3px] border text-[10px]",
                                            proposalExpired
                                                ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-700 text-red-700 dark:text-red-200"
                                                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200",
                                        ].join(" ")}>
                                            {proposalExpired ? "Scaduta" : "Valida fino al"}
                                            <span className="opacity-80">{proposalExpiryLabel}</span>
                                        </span>
                                    )}

                                    {/* Bottone "Dettagli" (non cambia selezione) */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fetchProductDetails(proposal.product_id);
                                        }}
                                        className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px]
                                        bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700
                                        text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                    >
                                        <span>Dettagli</span>
                                        <FiChevronRightIcon className="w-3 h-3" />
                                    </button>
                                </div>

                                {isSelectable && (
                                    <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                                        {proposalExpired
                                            ? "Questa proposta è scaduta e non può essere selezionata"
                                            : isSelected ? "Selezionata per l’accettazione" : "Clicca per selezionare questa proposta"}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* CTA */}
            {showBuyerActions && <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onOpenSubstitutionSearch}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 
                        border border-sky-200 dark:border-sky-800 text-[11px] 
                        text-sky-700 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition"
                    >
                        <MdSwapHorizIcon className="w-4 h-4" />
                        <span>{currentState === "CONTROPROPOSTA_INVIATA" ? "Modifica prodotti proposti" : "Cambia prodotti proposti"}</span>
                    </button>

                    {previousProposals.length > 0 && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            Storico: {previousProposals.length}{" "}
                            {previousProposals.length === 1
                                ? "proposta precedente"
                                : "proposte precedenti"}
                        </p>
                    )}


                    <button
                        type="button"
                        onClick={onSubmitProposal}
                        disabled={sendDisabled}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-sky-500 text-[13px] 
                            font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale hover:brightness-110 active:brightness-95 transition"
                    >
                        <MdDoneIcon className="w-4 h-4" />
                        <span>{submitProposalLabel}</span>
                    </button>
                </div>
            </div>}
        </FDBox>
    );
};

const BuyerActions: React.FC<{
    document: CartProductDTO | TextRequestCartDTO;
    isTextRequest: boolean;
    onOpenSubstitutionSearch: () => void;
    onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDirectQuoteExpiryChange: (value: string) => void;
    onSubmitPrice: () => void;
    onRefuse: () => void;
    currentState: RigaStato;
    buyerOptions?: Array<{ label: string; value: string }>;
    assigningBuyer?: boolean;
    onAssignBuyer?: (buyerCode: string) => void | Promise<any>;
}> = ({
    document,
    isTextRequest,
    onOpenSubstitutionSearch,
    onPriceChange,
    onDirectQuoteExpiryChange,
    onSubmitPrice,
    onRefuse,
    currentState,
    buyerOptions,
    assigningBuyer,
    onAssignBuyer,
}) => {
        const prezzoProposto = document.quotazione?.prezzo_finale ?? "";
        const [isReassignMode, setIsReassignMode] = useState(false);
        const [selectedBuyerCode, setSelectedBuyerCode] = useState<string>("");
        const availableBuyerOptions = useMemo(
            () => (buyerOptions ?? []).filter((opt) => opt.value !== document.codice_buyer),
            [buyerOptions, document.codice_buyer],
        );
        const isEditingSubmittedPrice = currentState === "ATTESA_APPROVAZIONE";
        const submitPriceLabel = isEditingSubmittedPrice ? "Aggiorna quotazione" : "Invia quotazione";
        const substitutionLabel = currentState === "CONTROPROPOSTA_INVIATA"
            ? "Modifica prodotti proposti"
            : "Proponi prodotto in sostituzione";

        useEffect(() => {
            if (!isReassignMode) setSelectedBuyerCode("");
        }, [isReassignMode]);

        const enterReassignMode = useCallback(() => {
            setIsReassignMode(true);
            setSelectedBuyerCode("");
        }, []);

        const exitReassignMode = useCallback(() => {
            if (assigningBuyer) return;
            setIsReassignMode(false);
            setSelectedBuyerCode("");
        }, [assigningBuyer]);

        const submitReassign = useCallback(() => {
            if (!selectedBuyerCode || typeof onAssignBuyer !== "function") return;
            onAssignBuyer(selectedBuyerCode);
        }, [onAssignBuyer, selectedBuyerCode]);

        return (
            <FDBox
                variant="soft"
                color="neutral"
                radius="lg"
                pad="md"
                shadow="sm"
                className="space-y-4 items-start gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-300 text-[11px]">
                            B
                        </span>
                        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-neutral-500 dark:text-neutral-400">
                            Azioni Buyer
                        </p>
                    </div>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {isReassignMode
                            ? "Seleziona il buyer destinatario e conferma l'invio"
                            : isTextRequest
                                ? "Gestisci richiesta di testo proponendo prodotti"
                                : isEditingSubmittedPrice
                                    ? "Correggi la proposta inviata prima che il commerciale la lavori"
                                    : currentState === "CONTROPROPOSTA_INVIATA"
                                        ? "Correggi la controproposta inviata prima che il commerciale la lavori"
                                        : "Proponi prezzo, sostituzione o rifiuta la riga"}
                    </span>
                </div>

                {!!document?.codice_buyer && !!availableBuyerOptions.length && typeof onAssignBuyer === "function" && (
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-950/40 p-3 space-y-3 w-full">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-neutral-500 dark:text-neutral-400">
                                    Gira ad altro buyer
                                </p>
                                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1">
                                    Buyer corrente: <span className="font-medium text-neutral-800 dark:text-neutral-100">{document.codice_buyer}</span>
                                </p>
                            </div>
                            {!isReassignMode && (
                                <FDButton
                                    size="sm"
                                    variant="outline"
                                    color="info"
                                    icon={<MdSwapHorizIcon className="w-4 h-4" />}
                                    onClick={enterReassignMode}
                                >
                                    Gira ad altro buyer
                                </FDButton>
                            )}
                        </div>

                        {!isReassignMode ? (
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                                Attivando questa modalità nascondi temporaneamente le altre azioni buyer e confermi manualmente la riassegnazione con Invio.
                            </p>
                        ) : (
                            <>
                                <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                                    Seleziona il nuovo buyer destinatario. Finché questa modalità è attiva, le azioni di proposta prezzo e sostituzione vengono sospese per evitare invii ambigui.
                                </p>
                                <FDSelect
                                    size="sm"
                                    placeholder="Seleziona il nuovo buyer…"
                                    options={availableBuyerOptions}
                                    value={selectedBuyerCode || undefined}
                                    onChange={(value) => {
                                        if (typeof value === "string") setSelectedBuyerCode(value);
                                    }}
                                    disabled={assigningBuyer}
                                    virtualized={false}
                                    className="min-w-60"
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                    <FDButton
                                        size="sm"
                                        color="info"
                                        icon={<MdDoneIcon className="w-4 h-4" />}
                                        disabled={!selectedBuyerCode || assigningBuyer}
                                        onClick={submitReassign}
                                    >
                                        Invia
                                    </FDButton>
                                    <FDButton
                                        size="sm"
                                        variant="outline"
                                        color="neutral"
                                        disabled={assigningBuyer}
                                        onClick={exitReassignMode}
                                    >
                                        Annulla
                                    </FDButton>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {!isReassignMode && !isTextRequest && <div className="grid grid-cols-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,2.1fr)] gap-3 items-end w-full">
                    <div className="space-y-1.5 col-span-1 flex-start">
                        <label className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span>{isEditingSubmittedPrice ? "Aggiorna il prezzo netto già inviato al commerciale" : "Tale Prezzo Netto verrà proposto al commerciale come quotazione del prodotto in dettaglio"}</span>
                        </label>
                        <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-3 py-2 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/30 transition">
                            <MdEuroIcon className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                            <input
                                type="number"
                                className="flex-1 bg-transparent border-none outline-none text-[13px] 
                                text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 
                                dark:placeholder-neutral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                                [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="Inserisci un prezzo netto…"
                                value={prezzoProposto as any}
                                onChange={onPriceChange}
                            />
                        </div>
                    </div>

                    <div className="col-span-1 space-y-1.5 col-span-1 flex-start">
                        <label className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span>Fissa una scadenza di validità della quotazione monetaria che sta per essere proposta al commerciale</span>
                        </label>
                        <FDDate
                            type="datetime-local"
                            value={toLocalDateTimeInputValue(document.quotazione?.scadenza)}
                            onChange={(value) => onDirectQuoteExpiryChange(value as any)}
                            range={false}
                            min={toLocalDateTimeInputValue(new Date(Date.now() - 60 * 60 * 1000))}
                            size="sm"
                            color="neutral"
                            containerClassName="dark:text-white"
                            dataTooltipId="general-quotations-tooltip"
                            dataTooltipContent={`${document.quotazione?.scadenza ?
                                `Scadenza: ${formatISODate(document.quotazione?.scadenza)}` : "Nessuna scadenza impostata"}`}
                        />
                    </div>

                    <button
                        type="button"
                        disabled={
                            prezzoProposto === null ||
                            prezzoProposto === undefined ||
                            prezzoProposto === ""
                        }
                        onClick={onSubmitPrice}
                        className="col-span-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 
                        disabled:grayscale inline-flex items-center justify-center gap-2 h-9 w-full 
                        rounded-xl bg-sky-500 text-[13px] font-semibold text-white hover:brightness-110 
                        active:brightness-95 transition"
                    >
                        <MdDoneIcon className="w-4 h-4" />
                        <span>{submitPriceLabel}</span>
                    </button>
                </div>}

                {!isReassignMode && (
                    <div className="flex flex-wrap gap-2 w-full">
                        <button
                            type="button"
                            onClick={onOpenSubstitutionSearch}
                            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-700 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition"
                        >
                            <MdSwapHorizIcon className="w-4 h-4" />
                            <span>{substitutionLabel}</span>
                        </button>

                        <FDButton
                            variant="outline"
                            color="error"
                            icon={<MdCloseIcon className="w-4 h-4" />}
                            onClick={onRefuse}
                            className="ml-auto"
                        >
                            Rifiuta quotazione
                        </FDButton>
                    </div>
                )}

                {isReassignMode && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-3 text-[11px] text-amber-800 dark:text-amber-200 w-full">
                        Modalità riassegnazione attiva: finché non confermi o annulli, le azioni di proposta standard restano nascoste.
                    </div>
                )}
            </FDBox>
        );
    };

const AgentActions: React.FC<{
    isRefusedState: boolean;
    onAccept: () => void;
    onRefuse: () => void;
    onRequestCounter: () => void;

    /** "COUNTER" quando la proposta è una controproposta con più prodotti */
    mode?: "PRICE" | "COUNTER";
    /** true se l’utente deve selezionare una proposta prima di accettare */
    requireCounterProposalSelection?: boolean;
    /** abilita/disabilita il bottone Accetta */
    canAccept?: boolean;
    expiredValue?: string | null; //indica se siamo in modalità "scauduto" per mostrare il timer
    expiredMessage?: string | null;
    /** label della proposta selezionata (per UI) */
    selectedProposalLabel?: string | null;
}> = ({
    isRefusedState,
    onAccept,
    onRefuse,
    onRequestCounter,
    mode = "PRICE",
    requireCounterProposalSelection = false,
    canAccept = true,
    expiredValue = false,
    expiredMessage = null,
    selectedProposalLabel = null,
}) => {
        const { expired, countdownLabel } = useExpiryCountdown(expiredValue);

        return (
            <FDBox className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-500 dark:text-sky-300 text-[11px]">
                            C
                        </span>
                        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-neutral-500 dark:text-neutral-400">
                            Azioni Commerciale
                        </p>
                    </div>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        Gestisci la proposta ricevuta dal Buyer
                    </span>
                </div>

                {mode === "COUNTER" && requireCounterProposalSelection && (
                    <div
                        className={[
                            "rounded-2xl border px-3 py-2 text-[11px] space-y-1",
                            canAccept
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200"
                                : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200",
                        ].join(" ")}
                    >
                        <p className="font-semibold">
                            {canAccept ? "Proposta selezionata" : "Azione richiesta"}
                        </p>

                        {!canAccept ? (
                            <p className="opacity-90">
                                Seleziona una delle proposte sopra per abilitare <span className="font-semibold">Accetta</span>.
                            </p>
                        ) : (
                            <p className="opacity-90">
                                Selezionata:{" "}
                                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {selectedProposalLabel ?? "Proposta"}
                                </span>
                            </p>
                        )}
                    </div>
                )}

                {(expired && expiredMessage && expiredValue) ? (
                    <div className="rounded-2xl border px-3 py-2 text-[11px] space-y-1 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-700 text-red-700 dark:text-red-200">
                        <p className="font-semibold">Proposta scaduta</p>
                        <p className="opacity-90">{expiredMessage}</p>
                    </div>
                ) : (expiredValue && countdownLabel && expiredValue) && (
                    <div className="rounded-2xl border px-3 py-2 text-[11px] space-y-1 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-200">
                        <p className="font-semibold">Proposta in scadenza</p>
                        <p className="opacity-90">La proposta sta per scadere, agisci prima che sia troppo tardi!</p>
                        {/** TIMER - COUNTDOWN */}
                        <p className="text-sm font-mono text-center">
                            {countdownLabel}
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {!isRefusedState && (
                        <>
                            <FDButton color="success" icon={<MdDoneIcon />} disabled={!canAccept || expired} onClick={() => {
                                if (!canAccept || expired) return;
                                onAccept();
                            }}>
                                Accetta
                            </FDButton>

                            <FDButton variant="outline" color="error" icon={<MdCloseIcon />} onClick={onRefuse} className="ml-auto">
                                Rifiuta
                            </FDButton>
                        </>
                    )}

                    <FDButton color="warning" icon={<MdOutlineRequestQuoteIcon />} onClick={onRequestCounter}>
                        Richiedi nuova proposta
                    </FDButton>
                </div>
            </FDBox>
        );
    };

/** Pannello avanzato (SECONDARIO) con i dettagli della quotazione e le azioni disponibili 
 * - TODO: rifattorizzare in componenti più piccoli per migliorare la leggibilità
*/
const AdvancedPanel: React.FC<{
    document: CartProductDTO | TextRequestCartDTO; proposals: ContropropostaDTO[];
    isBuyer: boolean, isAdmin: boolean, isTextRequest: boolean, showBuyerActions: boolean,
    onChangeProposalQuantity: (quantity: number, _id: string) => void, onChangeProposalPrice: (e: React.ChangeEvent<HTMLInputElement>, _id: string) => void;
    getFilteredEventsForCurrentProduct: ({ includeTypes, excludeTypes }: { includeTypes?: ProductEventType[]; excludeTypes?: ProductEventType[] }) => ProductEventDTO[];
    /** Azione quando scegli un prodotto come controproposta */
    onSelectProduct: (item: any) => void;
    onChangeProposalExpiry: (value: string, _id: string) => void;
    CommercialAlternativesSection: any;
}> = ({
    document,
    proposals,
    isBuyer, isAdmin,
    isTextRequest,
    showBuyerActions,
    onChangeProposalQuantity,
    onChangeProposalPrice,
    getFilteredEventsForCurrentProduct,
    onSelectProduct,
    onChangeProposalExpiry,
    CommercialAlternativesSection
}) => {
        const product = document as CartProductDTO;
        const { quotazione, dettagli_prodotto } = product as CartProductDTO;
        const activeProposal = proposals.length ? proposals[proposals.length - 1] : null;

        /** Array di riepilogo economico */
        const economicSummary = [
            {
                label: "Prezzo base",
                value: quotazione?.prezzo_base,
                type: "currency",
                icon: <MdEuroIcon className="w-3 h-3" />,
            },
            {
                label: "% Sconto",
                value: quotazione?.sconto_percentuale,
                type: "percentage",
            },
            {
                label: "Prezzo finale",
                value: quotazione?.prezzo_finale,
                type: "currency",
                icon: <MdEuroIcon className="w-3 h-3" />,
                highlight: true,
            },
            {
                label: "Validità offerta",
                value: quotazione?.validita_offerta,
                type: "date",
            },
            {
                label: "Scadenza prodotto",
                value: quotazione?.scadenza,
                type: "date",
            },
        ];

        const tag_requested_product = <span className="text-[8px]">(prodotto richiesto)</span>
        const notes = getFilteredEventsForCurrentProduct({ excludeTypes: ["NOTA"] });
        const hasNotes = notes.length > 0;

        const ComposeTag: React.FC<{ label: string; value: string }> = ({ label, value }) => (
            <span className="px-2 py-[3px] rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                {label}: {value}
            </span>
        )

        return (
            <div className="flex flex-col h-full gap-4 lg:overflow-auto pr-2">
                {/* dettagli riassuntivi prodotto */}
                {!isTextRequest && <>
                    {/* riepilogo prodotto in dettaglio */}
                    <FDBox border={true} radius="md" className="border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm p-4 space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                            Prodotto richiesto
                        </p>
                        <div className="space-y-1 flex items-center gap-3">
                            {product.kind === "PRODUCT" && <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-inner">
                                {product.dettagli_prodotto.anteprima ? (
                                    <img
                                        src={product.dettagli_prodotto.anteprima}
                                        alt={product.dettagli_prodotto.descrizione ?? "Prodotto"}
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <span className="text-xs text-neutral-400">IMG</span>
                                )}
                            </div>}
                            <div>
                                <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 line-clamp-2">
                                    {dettagli_prodotto?.descrizione ?? "Prodotto senza descrizione"}
                                </p>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                                    {[dettagli_prodotto?.marca, dettagli_prodotto?.codiceProduttore, dettagli_prodotto?.codiceEAN]
                                        .filter(Boolean)
                                        .join(" • ")}
                                </p>
                                <p className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                                    Quantità richiesta:{" "}
                                    <span className="font-semibold">
                                        {product.quantita ?? 1}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </FDBox>
                    {/* blocco catalogo */}
                    <FDBox border={true} radius="md" className="border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm p-4 space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                            Informazioni di catalogo {tag_requested_product}
                        </p>

                        <div className="flex flex-wrap gap-2 text-[11px] text-neutral-800 dark:text-neutral-100">
                            {dettagli_prodotto?.marca && (
                                <ComposeTag label="Brand" value={dettagli_prodotto.marca} />
                            )}
                            {dettagli_prodotto?.descrizioneLinea && (
                                <ComposeTag label="Linea" value={dettagli_prodotto.descrizioneLinea} />
                            )}
                            {dettagli_prodotto?.descrizioneGruppo && (
                                <ComposeTag label="Gruppo" value={dettagli_prodotto.descrizioneGruppo} />
                            )}
                            {dettagli_prodotto?.codiceProduttore && (
                                <ComposeTag label="Cod. Produttore" value={dettagli_prodotto.codiceProduttore} />
                            )}
                            {dettagli_prodotto?.codiceEAN && (
                                <ComposeTag label="EAN" value={dettagli_prodotto.codiceEAN} />
                            )}
                        </div>
                    </FDBox>
                </>}

                {/* blocco economico */}
                {(isBuyer || isAdmin) && <FDBox border={true} radius="md" className="border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm p-4 space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                        Riepilogo quotazione {isTextRequest ? "(richiesta di testo)" : tag_requested_product}
                    </p>

                    {/** Riepilogo Economico se il document in questione non è una richiesta di testo */}
                    {(!isTextRequest && quotazione.prezzo_finale) && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-neutral-800 dark:text-neutral-100">
                        {
                            economicSummary.map((item: any, index: number) => (
                                <div key={item.label + index} className="space-y-1 space-x-2">
                                    <span className="text-neutral-500 dark:text-neutral-400">{item.label}</span>
                                    <span className={`inline-flex items-center gap-1 font-medium ${item.highlight ? 'text-emerald-600 dark:text-emerald-300 font-semibold' : ''}`}>
                                        {item.icon}
                                        {item.type === 'currency' ? formatDecimal(item.value) :
                                            item.type === 'percentage' ? (item.value != null ? `${item.value}%` : '-') :
                                                item.type === 'date' ? formatISODate(item.value) : ''
                                        }
                                    </span>
                                </div>
                            ))
                        }
                    </div>}

                    {isBuyer && (
                        <div className="mt-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700 px-3 py-2 text-[11px] text-emerald-700 dark:text-emerald-200">
                            <p className="font-medium mb-0.5">Vista Buyer</p>
                            <p className="text-[11px] opacity-80">
                                Valuta rapidamente struttura prezzi (base, sconto, finale) prima
                                di confermare o proporre la quotazione al commerciale.
                            </p>
                        </div>
                    )}
                </FDBox>}

                {!isTextRequest && CommercialAlternativesSection()}

                {/* blocco prodotti inseriti nella proposta */}
                {showBuyerActions && <FDBox border={true} radius="md" className="border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm p-4 space-y-3 mb-12">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                        Prodotti inseriti nella proposta ({proposals.length})
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-3 max-h-160 overflow-y-auto ">
                        {activeProposal ? (
                            proposals.map((prod: ContropropostaDTO, idx: number) => (
                                <FDBox key={prod._id ?? `${prod.dettagli_prodotto?.codiceProduttore ?? "proposal"}:${idx}`} border={true} radius="xl"
                                    className="border-gray-200 dark:border-neutral-700 bg-gray-50/80 dark:bg-neutral-800/40 p-3 space-y-2">
                                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                                        {prod.dettagli_prodotto?.descrizione ?? "Prodotto proposto"}
                                    </p>
                                    {/* Cancella gli elementi dalla lista */}
                                    <FDIconButton icon={<MdCloseIcon />} variant="danger" className="absolute top-2 right-2" size="small"
                                        dataTooltipId="general-quotations-tooltip"
                                        dataTooltipContent="Elimina il prodotto dalle controproposte"
                                        onClick={() => onSelectProduct({ _id: prod._id })} />

                                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">
                                        {[prod.dettagli_prodotto?.marca, prod.dettagli_prodotto?.codiceProduttore, prod.dettagli_prodotto?.codiceEAN]
                                            .filter(Boolean)
                                            .join(" • ")}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[11px] mt-auto">
                                        {/* quantità proposta */}
                                        <div className="flex flex-col space-y-1 justify-end">
                                            <span className="text-neutral-500 dark:text-neutral-400">
                                                Quantità proposta
                                            </span>
                                            {(isBuyer || isAdmin) ? (
                                                <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 
                                                px-2 py-1.5 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/30 transition">
                                                    <input
                                                        type="number"
                                                        className="flex-1 w-full bg-transparent outline-none border-none text-[13px] text-neutral-900 dark:text-neutral-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        value={prod.quantita ?? ""}
                                                        onChange={(e) =>
                                                            onChangeProposalQuantity(
                                                                Number.isNaN(Number(e.target.value))
                                                                    ? 1 : Number(e.target.value), prod._id
                                                            )
                                                        }
                                                        min={0}
                                                    />
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-neutral-900 px-2 
                                                py-[3px] border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-800 dark:text-neutral-100">
                                                    {prod.quantita}
                                                </span>
                                            )}
                                        </div>

                                        {/* prezzo proposto */}
                                        <div className="flex flex-col space-y-1 justify-end">
                                            <span className="text-neutral-500 dark:text-neutral-400">
                                                Prezzo proposto
                                            </span>
                                            {(isBuyer || isAdmin) ? (
                                                <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-2 py-1.5 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/30 transition">
                                                    <MdEuroIcon className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                                                    <input
                                                        type="number"
                                                        id="proposal-price-input"
                                                        aria-label="Prezzo proposto"
                                                        className="flex-1 w-full bg-transparent outline-none border-none text-[13px] 
                                                        text-neutral-900 dark:text-neutral-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                                                        [&::-webkit-inner-spin-button]:appearance-none"
                                                        defaultValue={prod.quotazione?.prezzo_finale as any}
                                                        onChange={(e) => onChangeProposalPrice(e, prod._id)}
                                                        placeholder="Inserisci il prezzo netto…"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-neutral-900 px-2 py-[3px] 
                                                border border-neutral-200 dark:border-neutral-700 font-semibold text-emerald-600 dark:text-emerald-300">
                                                    <MdEuroIcon className="w-3 h-3" />
                                                    {formatDecimal(prod.quotazione?.prezzo_finale)}
                                                </span>
                                            )}
                                        </div>

                                        {(isBuyer || isAdmin) && showBuyerActions && (
                                            <div className="mt-2 space-y-1 col-span-2">
                                                <label className="text-[10px] text-neutral-500 dark:text-neutral-400">Scadenza controproposta (opzionale)</label>
                                                <FDDate
                                                    type="datetime-local"
                                                    value={toLocalDateTimeInputValue(prod.quotazione?.scadenza)}
                                                    onChange={(value) => onChangeProposalExpiry(value as any, prod._id)}
                                                    range={false}
                                                    min={toLocalDateTimeInputValue(new Date(Date.now() - 60 * 60 * 1000))} // non permettere di impostare scadenze nel passato
                                                    size="sm"
                                                    color="neutral"
                                                    containerClassName="dark:text-white dark:bg-neutral-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 transition"
                                                    dataTooltipId="general-quotations-tooltip"
                                                    dataTooltipContent={`${prod.quotazione?.scadenza ?
                                                        `Scadenza: ${formatISODate(prod.quotazione?.scadenza)}` : "Nessuna scadenza impostata"}`}

                                                />
                                            </div>
                                        )}
                                    </div>
                                </FDBox>
                            ))
                        ) : (
                            <p className="text-xs text-neutral-300 dark:text-neutral-400">Nessun prodotto inserito come controproposta.</p>
                        )}
                    </div>
                </FDBox>}

                {/* STORICO EVENTI & CONTROPROPOSTE */}
                <div className="mt-auto">
                    {/* EVENTI */}
                    {((product && product.eventi?.length) ?? 0) > 0 && (
                        <FDBox border={true} radius="md" className="border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                                Timeline eventi prodotto
                            </p>

                            <div className="relative pl-3 max-h-60 overflow-y-auto space-y-3">
                                {/* linea verticale timeline */}
                                <span className="absolute left-1 top-1 bottom-2 w-px bg-neutral-200 dark:bg-neutral-700" />

                                {hasNotes && notes.map((ev, index: number) => {
                                    const ui =
                                        productEventTypeUI[ev.type] ??
                                        productEventTypeUI.ALTRO;
                                    const tone = toneClasses[ui.tone];
                                    const when = ev.timestamp
                                        ? formatISODate(ev.timestamp)
                                        : "";

                                    return (
                                        <div key={ev.id + index + ":" + ev.timestamp} className="relative flex gap-3">
                                            {/* dot */}
                                            <span className="mt-1.5 inline-flex h-2 w-2 rounded-full bg-sky-500 border-2 border-white dark:border-neutral-900 shadow-sm" />

                                            <div className="flex-1 space-y-0.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-100">
                                                        {buildEventTitle(ev)}
                                                    </p>
                                                    <span
                                                        className={
                                                            "inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10px] border " +
                                                            tone
                                                        }
                                                    >
                                                        {ui.label}
                                                        {when && (
                                                            <span className="opacity-70">
                                                                • {when}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>

                                                {ev.message && (
                                                    <p className="text-[11px] text-neutral-700 dark:text-neutral-300">
                                                        {ev.message}
                                                    </p>
                                                )}

                                                {(ev.meta?.newPrice != null ||
                                                    ev.meta?.newQty != null) && (
                                                        <div className="flex flex-wrap gap-2 text-[10px] text-neutral-600 dark:text-neutral-400">
                                                            {ev.meta?.newQty != null && (
                                                                <span className="px-2 py-[2px] rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                                                    Q.tà proposta:{" "}
                                                                    <span className="font-medium">
                                                                        {ev.meta.newQty}
                                                                    </span>
                                                                    {ev.meta.prevQty != null && (
                                                                        <span className="ml-1 opacity-70">
                                                                            (da {ev.meta.prevQty})
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            )}
                                                            {ev.meta?.newPrice != null && (
                                                                <span className="px-2 py-[2px] rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                                                    Prezzo proposto:{" "}
                                                                    <span className="font-medium">
                                                                        {ev.meta.newPrice.toFixed
                                                                            ? ev.meta.newPrice.toFixed(2)
                                                                            : ev.meta.newPrice}
                                                                        €
                                                                    </span>
                                                                    {ev.meta.prevPrice != null && (
                                                                        <span className="ml-1 opacity-70">
                                                                            (da {ev.meta.prevPrice}€)
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                {ev.actor && (
                                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                                        Azione di{" "}
                                                        <span className="font-medium">
                                                            {ev.actor.name ?? "Utente sconosciuto"}
                                                        </span>
                                                        {ev.actor.role && ` · ${ev.actor.role}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </FDBox>
                    )}

                    {/* CONTROPROPOSTE */}
                    <FDBox border={true} radius="md" className="mt-auto border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                            Storico controproposte ({(document.controproposte || []).length})
                        </p>

                        {document.controproposte && document.controproposte.length > 0 ? (
                            <div className="relative pl-3 space-y-3 max-h-52 overflow-y-auto">
                                <span className="absolute left-1 top-1 bottom-2 w-px bg-neutral-200 dark:bg-neutral-700" />
                                {document.controproposte
                                    .slice()
                                    .reverse()
                                    .map((cp: ContropropostaDTO, idx: number) => {
                                        const statusLabel = cp.stato.replace("_", " ").toLocaleLowerCase() ?? "";
                                        const createdAt = cp.createdAt ?? null;
                                        const labelDate = createdAt
                                            ? formatISODate(createdAt)
                                            : "";

                                        const isActive = cp.stato === "ATTESA_VALUTAZIONE";

                                        return (
                                            <div
                                                key={cp._id + idx}
                                                className="relative flex gap-3"
                                            >
                                                <span
                                                    className={[
                                                        "mt-1.5 inline-flex h-2 w-2 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm",
                                                        isActive
                                                            ? "bg-amber-500"
                                                            : "bg-sky-500",
                                                    ].join(" ")}
                                                />
                                                <div className="flex-1 space-y-0.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-100">
                                                            {cp.dettagli_prodotto?.descrizione ??
                                                                "Proposta di sostituzione"}
                                                        </p>
                                                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10px] border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300">
                                                            {statusLabel}
                                                            {labelDate && (
                                                                <span className="opacity-70">
                                                                    • {labelDate}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>

                                                    <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
                                                        Q.tà proposta:{" "}
                                                        <span className="font-medium">
                                                            {cp.quantita}
                                                        </span>
                                                        {cp.quotazione?.prezzo_finale !=
                                                            null && (
                                                                <>
                                                                    {" "}
                                                                    • Prezzo proposto:{" "}
                                                                    <span className="font-medium">
                                                                        {formatDecimal(cp.quotazione.prezzo_finale)}{" "} €
                                                                    </span>
                                                                </>
                                                            )}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <p className="text-[11px] text-neutral-300 dark:text-neutral-400">
                                Nessuna controproposta registrata.
                            </p>
                        )}
                    </FDBox>
                </div>
            </div>
        );
    };


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export const ProductsDetails: React.FC<ProductsDetailsProps> = ({
    open,
    onClose,
    product,
    qtsState,
    isBuyer, isAgent,
    searchQuery,
    searchDebounced,
    searchItems,
    loading,
    onOpenSubstitutionSearch,
    onPriceChange,
    onDirectQuoteExpiryChange,
    onSubmitPrice,
    onAccept,
    onAcceptProposal,
    onRefuse,
    onRefuseProposal,
    onRequestCounter,
    onSubmitProposal,
    selectSubstitutionProductForCurrent,
    toggleCommercialAlternativeForCurrent,
    createCounterProposalFromCommercialSuggestionForCurrent,
    onChangeProposalQuantity,
    onChangeProposalNote,
    onChangeProposalPrice,
    onChangeProposalExpiry,
    currentProposalNote, sendProductNote,
    getFilteredEventsForCurrentProduct,
    // elementi decisionali per buyers
    isDraftQuotation, isPassiveBid,
    buyerOptions,
    assigningBuyer,
    onAssignBuyer, onAssignCategories,
    onReportProductAnomaly,
    reportingAnomaly,
    //nuovo wiring per il pannello 3
    autoOpenProductDetailsId,
    onAutoOpenProductDetailsHandled,
    onSelectCounterProposal,
    locked,
    userState,
    CheckAdminDev,
    categoryIndex
}) => {
    const [selectedIdProduct, setSelectedIdProduct] = useState<string | null>(null); // prodotto selezionato per i dettagli
    const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false); // pannello dedicato ai dettagli prodotto
    const [secondaryOpen, setSecondaryOpen] = useState(false);
    const [substitutionOpen, setSubstitutionOpen] = useState(false);
    const isSubstitutionMode = secondaryOpen && substitutionOpen;
    const isWideLayout = isSubstitutionMode || isProductDetailsOpen; // layout più ampio se sono aperti i pannelli secondari

    const productDetailsAbortController = React.useRef<AbortController | null>(null); //abort Controller per il fetch dei dettagli prodotto, così da poter annullare la richiesta se l'utente chiude il pannello prima che arrivi la risposta


    // ——————————————————————————————————————————————————————————
    // HANDLERS
    // ——————————————————————————————————————————————————————————
    /** Apre il pannello dei dettagli prodotto */
    const handleOpenProductDetails = useCallback((productId: string) => {
        setSelectedIdProduct(productId);
        setIsProductDetailsOpen(true);
    }, []);

    /** Chiude il pannello dei dettagli prodotto */
    const handleCloseProductDetails = useCallback(() => {
        setIsProductDetailsOpen(false);
        onAutoOpenProductDetailsHandled();
    }, [onAutoOpenProductDetailsHandled]);

    /** Chiude il pannello secondario (avanzato o sostituzione) */
    const closeSecondaryPanel = useCallback(() => {
        setSecondaryOpen(false);
        setSubstitutionOpen(false);
    }, []);

    /** Gestione click sul backdrop: chiude prima il pannello secondario, poi quello principale */
    const handleBackdropClick = useCallback(() => {
        if (secondaryOpen) {
            closeSecondaryPanel();
        } else {
            onClose();
        }
    }, [secondaryOpen, closeSecondaryPanel, onClose]);



    // ——————————————————————————————————————————————————————————
    // USE EFFECTS
    // ——————————————————————————————————————————————————————————
    // chiudi avanzato quando chiudi il principale
    useEffect(() => {
        if (!open) {
            setSecondaryOpen(false);
        };
        productDetailsAbortController.current && productDetailsAbortController.current.abort(); // annulla eventuale richiesta in corso dei dettagli prodotto quando si chiude il pannello
        productDetailsAbortController.current = null; // resetta il ref dell'abort controller
    }, [open]);

    // apre automaticamente i dettagli prodotto se passato l'id
    useEffect(() => {
        if (autoOpenProductDetailsId) {
            handleOpenProductDetails(autoOpenProductDetailsId);
        };
    }, [autoOpenProductDetailsId, product?.kind]);

    // ESC → prima pannello avanzato, poi principale
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (secondaryOpen) closeSecondaryPanel();
            else onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, secondaryOpen, closeSecondaryPanel, onClose]);


    // ——————————————————————————————————————————————————————————
    // HELPERS
    // ——————————————————————————————————————————————————————————
    /** Verifica se il prodotto è di tipo TEXT_REQUEST */
    const isTextRequest = product?.kind === "TEXT_REQUEST";

    /** true se il prodotto ha almeno un evento CAMBIO_BUYER con prevBuyerCode null
    → la riga è nata senza buyer e il buyer è stato assegnato "a mano" in BOZZA */
    const hasBuyerAssignmentFromNull =
        !!product?.eventi?.some(
            (ev) =>
                ev.type === "CAMBIO_BUYER" &&
                (ev.meta?.prevBuyerCode === null ||
                    typeof ev.meta?.prevBuyerCode === "undefined"),
        );

    /** mostra il select quando:
    - commerciale
    - quotazione in BOZZA
    - riga ancora senza buyer */
    const canShowBuyerSelect =
        !!product &&
        (isAgent || CheckAdminDev) &&
        (isDraftQuotation ?? false) &&
        !product.codice_buyer &&
        !!buyerOptions &&
        buyerOptions.length > 0 &&
        !locked &&
        typeof onAssignBuyer === "function";

    /** permette di CAMBIARE il buyer quando:
    - commerciale
    - quotazione in BOZZA
    - la riga ha un buyer
    - ed è stato assegnato partendo da null (non da catalogo) */
    const canChangeBuyer =
        !!product &&
        (isAgent || CheckAdminDev) &&
        (isDraftQuotation ?? false) &&
        !!product.codice_buyer &&
        hasBuyerAssignmentFromNull &&
        !!buyerOptions &&
        buyerOptions.length > 0 &&
        !locked &&
        typeof onAssignBuyer === "function";

    const controproposte = (product?.controproposte ?
        product?.controproposte.filter((cp: ContropropostaDTO) => cp.stato !== "CONTROPROPOSTA_RIFIUTATA") : []) ?? [];
    const hasActiveProposal = controproposte.length > 0;

    const stato = product?.quotazione?.stato ?? "ATTESA_VALUTAZIONE";
    /** Definisce lo stato di lock della quotazione quando la quotazione assume questi stati esplicitati */
    const isQtsLockedState = ['OK', 'KO', 'VALIDAZIONE', 'BOZZA'].includes(qtsState ?? '');
    const isBuyerFlowState =
        stato === "ATTESA_VALUTAZIONE" ||
        stato === "CONTROPROPOSTA_RICHIESTA" ||
        stato === "ATTESA_APPROVAZIONE" ||
        stato === "CONTROPROPOSTA_INVIATA";


    /**
     * Mostra le azioni del buyer quando:
     - la quotazione è in uno stato di flusso buyer (ATTESA_VALUTAZIONE, CONTROPROPOSTA_RICHIESTA, ATTESA_APPROVAZIONE, CONTROPROPOSTA_INVIATA)
     - l'utente è un buyer con lo stesso codice buyer o un admin/dev
     - e non è in stato di blocco (es. APPROVATA, VALIDAZIONE, RIFIUTATA, BOZZA)
     */
    const showBuyerActions = !locked && !isAgent && (CheckAdminDev || (
        (product && product.codice_buyer === userState?.details?.codici.buyer && isBuyer)
    )) && isBuyerFlowState && !isQtsLockedState;

    const showAgentActions = (CheckAdminDev || isAgent) && !locked && !isBuyer && !isQtsLockedState;
    const ruoloLabel = isBuyer ? "Buyer / Admin / Dev" : "Commerciale";
    const lastEvent = (product?.eventi ?? [])
        .slice()
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .pop();

    // logica selezione controproposta attiva
    const isRefusedState = !locked && (stato === "VALUTAZIONE_RIFIUTATA" || stato === "CONTROPROPOSTA_RIFIUTATA"); // stato che indica che l'agente ha rifiutato la quotazione del prodotto originario
    const isCompletedState = !locked && (stato === "VALUTAZIONE_COMPLETATA" || stato === "CONTROPROPOSTA_ACCETTATA"); // stato che indica che l'agente ha completato la valutazione (accettato una controproposta)
    const activeCounterProposals = controproposte.filter((cp: ContropropostaDTO) => cp.stato == "CONTROPROPOSTA_ACCETTATA" || cp.approvato);
    const selectionRequired = showAgentActions && stato === "CONTROPROPOSTA_INVIATA" && controproposte.length >= 1;
    const selectedCounterProposal = (!locked && !isRefusedState)
        ? (controproposte.find((cp: ContropropostaDTO) => cp.approvato) ?? (activeCounterProposals.length === 1 ? activeCounterProposals[0] : null))
        : null;
    // condizione per determinare se il btn è abilitato e quindi accettare la controproposta del buyers
    const canAcceptCounterProposal = !locked && (!selectionRequired || !!selectedCounterProposal);


    // logica alternative commerciali
    const commercialAlternativeSuggestions = ((product as CartProductDTO)?.alternativeSuggestions ?? []) as CommercialAlternativeSuggestionDTO[];
    const hasCommercialAlternatives = commercialAlternativeSuggestions.length > 0;
    const canManageCommercialAlternatives = (isAgent || CheckAdminDev) && isDraftQuotation && !locked && !isTextRequest;
    const canBuyerUseCommercialAlternatives = showBuyerActions && hasCommercialAlternatives;


    const isAlternativeAlreadyProposed = (suggestion_product_id: string) => controproposte.some((cp: any) => cp?.product_id === suggestion_product_id);


    // ——————————————————————————————————————————————————————————
    // COMPONENTS
    // ——————————————————————————————————————————————————————————
    const notes = getFilteredEventsForCurrentProduct({ includeTypes: ["NOTA"] });
    const sortedNotes = [...notes].sort((a, b) =>
        (b.timestamp ?? "").localeCompare(a.timestamp ?? ""),
    );
    const hasNotes = sortedNotes.length > 0;

    /** Storico eventi prodotto, Note e Controproposte */
    const RenderNoteHistory = () => (
        <FDBox border={true} radius="md" className="mt-auto border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                    Storico note
                </p>

                {hasNotes && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-2.5 py-[3px] text-[10px] text-neutral-600 dark:text-neutral-300">
                        {sortedNotes.length}{" "}
                        {sortedNotes.length === 1 ? "nota" : "note"}
                    </span>
                )}
            </div>

            {/* NOTE */}
            <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                    Note
                </p>

                {hasNotes ? (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {sortedNotes.map((n, idx) => {
                            const when = formatISODate(n.timestamp);
                            if (!n.actor) return null;
                            return (
                                <div
                                    key={n.id ?? idx}
                                    className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 
                                    dark:bg-neutral-900 px-3 py-2 text-[11px] space-y-1"
                                >
                                    <div className="flex items-center justify-between gap-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                                        <span>
                                            {n.actor.name ?? "Utente sconosciuto"}
                                        </span>
                                        <span>
                                            {when}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-800 dark:text-neutral-100">
                                        {n.message}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-[11px] text-neutral-300 dark:text-neutral-400">
                        Nessuna nota registrata per questo prodotto.
                    </p>
                )}
            </div>
        </FDBox>
    );

    const CommercialAlternativesSection = () => (
        <FDBox border={true} radius="xl" pad="lg" variant="gradient" shadow="sm">
            {/** HEADER */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        Alternative commerciali
                    </p>
                    <p className="mt-1 items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                        {hasCommercialAlternatives
                            ? `Sono presenti ${commercialAlternativeSuggestions.length} prodotti suggeriti dal commerciale.`
                            : "Nessuna alternativa commerciale ancora suggerita per questa riga."}
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center rounded-full border border-sky-200 dark:border-sky-800 px-2 py-1 text-[10px] font-medium text-sky-700 dark:text-sky-200">
                        Suggerita dal commerciale
                    </span>
                    {canManageCommercialAlternatives && (
                        <FDButton
                            variant={(substitutionOpen && secondaryOpen) ? "solid" : "outlined"}
                            color={(substitutionOpen && secondaryOpen) ? "primary" : "neutral"}
                            radius="full"
                            size="sm"
                            textSize="xs"
                            onClick={() => {
                                if (!substitutionOpen || !secondaryOpen) {
                                    onOpenSubstitutionSearch();
                                    setSecondaryOpen(true);
                                    setSubstitutionOpen(true);
                                } else {
                                    setSubstitutionOpen(false);
                                }
                            }}
                            rightIcon={<FiChevronRightIcon />}
                        >Aggiungi alternativa</FDButton>
                    )}
                </div>
            </div>

            {hasCommercialAlternatives && (
                <div className="mt-4 grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                    {commercialAlternativeSuggestions.map((suggestion) => {
                        const isAlreadyProposed = isAlternativeAlreadyProposed(suggestion.product_id);
                        const _loading = !!(loading.agents_alternatives as Map<string, boolean>).get(suggestion._id);

                        return <div key={suggestion._id}
                            className="rounded-2xl border border-amber-400/80 dark:border-amber-900/70 bg-amber-50/70 dark:bg-amber-950/20 p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
                                        {suggestion.dettagli_prodotto?.descrizione ?? suggestion.dettagli_prodotto?.codiceProduttore ?? "Prodotto alternativo"}
                                    </p>
                                    <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                                        {[suggestion.dettagli_prodotto?.marca, suggestion.dettagli_prodotto?.codiceProduttore, suggestion.dettagli_prodotto?.codiceEAN].filter(Boolean).join(" · ")}
                                    </p>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {canBuyerUseCommercialAlternatives && (
                                        <FDIconButton
                                            variant={isAlreadyProposed ? "danger" : "dark"}
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                createCounterProposalFromCommercialSuggestionForCurrent(suggestion._id)
                                            }}
                                            icon={isAlreadyProposed ? <MdCloseIcon /> : <GoPlusIcon />}
                                            dataTooltipId="general-quotations-tooltip"
                                            dataTooltipContent={isAlreadyProposed ? "Rimuovi" : "Proponi come controproposta"}
                                            asMotion={false}
                                        />
                                    )}

                                    {canManageCommercialAlternatives && (
                                        <FDButton
                                            radius="full"
                                            size="small"
                                            textSize="xs"
                                            border={true}
                                            shadow="md"
                                            disabled={_loading}
                                            loading={_loading}
                                            onClick={() =>
                                                toggleCommercialAlternativeForCurrent({
                                                    _id: suggestion.product_id,
                                                    suggestionId: suggestion._id,
                                                } as any)
                                            }
                                        >
                                            Rimuovi
                                        </FDButton>
                                    )}
                                </div>
                            </div>
                        </div>
                    })}
                </div>
            )}
        </FDBox>
    );

    /**
     * Permette di avere l'informazione sulle alternative commerciali anche quando si visualizzano i dettagli di un prodotto sostitutivo, 
     * senza dover aprire il pannello dedicato alle sostituzioni.
     * @returns 
     */
    const RenderResumeCommercialAlternativesSection = () => (
        <FDBox border={true} radius="xl" pad="lg" variant="gradient" shadow="sm" className="flex items-center gap-2">
            <GoInfoIcon className="text-sky-400" size={25} />
            <div className="flex items-start justify-between gap-3 w-full">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        Alternative commerciali
                    </p>
                    <p className="mt-1 items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                        {hasCommercialAlternatives
                            ? `Sono presenti ${commercialAlternativeSuggestions.length} prodotti suggeriti dal commerciale.`
                            : "Nessuna alternativa commerciale ancora suggerita per questa riga."}
                    </p>
                </div>
                <FDButton variant="outlined" radius="full" size="md" textSize="xs"
                    onClick={() => {
                        onOpenSubstitutionSearch();
                        setSecondaryOpen(true);
                        setSubstitutionOpen(true);
                    }}
                    rightIcon={<FiChevronRightIcon className="w-3.5 h-3.5" />}
                    asMotion={false}
                    dataTooltipId="general-quotations-tooltip"
                    dataTooltipContent="Inserisci prodotti da suggerire al buyer come alternative alla riga originaria"
                >
                    Visualizza
                </FDButton>
            </div>
        </FDBox>
    );


    // ——————————————————————————————————————————————————————————
    // RETURN
    // ——————————————————————————————————————————————————————————
    return (
        <AnimatePresence>
            {open && (
                <>
                    <FDBackdrop onClick={handleBackdropClick} />

                    <div
                        className="fixed inset-0 z-20 flex justify-end pointer-events-none"
                        aria-modal="true"
                        role="dialog"
                    >
                        <div
                            className={`relative h-full w-full ml-auto transition-[max-width] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${isWideLayout
                                ? "max-w-6xl"
                                : "max-w-xl lg:max-w-2xl"
                                }`}
                        >
                            {/* PANNELLO PRINCIPALE */}
                            <div className="absolute inset-y-0 right-0 w-full z-20 pointer-events-auto">
                                <SidePanelShell
                                    title={isTextRequest ? "Gestione richiesta descrittiva" : "Quotazione prodotto"}
                                    animateVariant={secondaryOpen ? "background" : "visible"}
                                    contentState={secondaryOpen ? "background" : "front"}
                                    onClose={onClose}
                                    footer={<div className="p-5 border-t border-neutral-400/50 dark:border-neutral-800 flex items-center justify-between gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                Dettagli avanzati
                                            </span>
                                            <span className="text-[11px] text-neutral-700 dark:text-neutral-200">
                                                Storico e breakdown economico del
                                                prodotto
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSecondaryOpen(true);
                                                setSubstitutionOpen(false); // assicurati che NON parta la ricerca
                                            }}
                                            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                                        >
                                            <span>Apri pannello</span>
                                            <FiChevronRightIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>}
                                >
                                    <div className="flex flex-col h-full gap-4">
                                        {/* chip ruolo */}
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-2 py-[3px] text-[10px] text-neutral-600 dark:text-neutral-300 shadow-sm">
                                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                                {ruoloLabel}
                                            </span>
                                        </div>

                                        {/* sotto le info principali del prodotto */}
                                        {lastEvent && (
                                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-2 py-[2px]">
                                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                                                <span className="text-[10px] text-neutral-600 dark:text-neutral-300">
                                                    Ultimo evento:{" "}
                                                    <span className="font-medium">
                                                        {productEventTypeUI[
                                                            lastEvent.type
                                                        ]?.label ?? "Aggiornamento"}
                                                    </span>
                                                    {lastEvent.timestamp && (
                                                        <span className="opacity-70">
                                                            {" "}
                                                            ·{" "}
                                                            {formatISODate(
                                                                lastEvent.timestamp
                                                            )}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        <ProductSummaryHeader
                                            isPassiveBid={isPassiveBid}
                                            document={product} // intero oggetto integrale ("PRODUCT" | "TEXT_REQUEST")
                                            proposals={controproposte}
                                            fetchProductDetails={handleOpenProductDetails}
                                            isTextRequest={isTextRequest}
                                            canShowBuyerSelect={canShowBuyerSelect}
                                            canChangeBuyer={canChangeBuyer}
                                            buyerOptions={buyerOptions}
                                            assigningBuyer={assigningBuyer}
                                            onAssignBuyer={onAssignBuyer}
                                            onAssignCategories={onAssignCategories}
                                            isRefusedState={isRefusedState}
                                            isCompletedState={isCompletedState}
                                            categoryIndex={categoryIndex}
                                        />

                                        {!isTextRequest && <RenderResumeCommercialAlternativesSection />}

                                        {/* NOTE ACTION-PHASE */}
                                        {((![
                                            "CONTROPROPOSTA_RIFIUTATA",
                                            "CONTROPROPOSTA_ACCETTATA",
                                            "VALUTAZIONE_COMPLETATA",
                                            "VALUTAZIONE_RIFIUTATA"
                                        ].includes(stato)) && !isRefusedState) && (
                                                <FDBox
                                                    variant="soft"
                                                    color="neutral"
                                                    radius="lg"
                                                    pad="md"
                                                    shadow="sm"
                                                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
                                                >
                                                    <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-neutral-500 dark:text-neutral-400">
                                                        Inserisci una Nota
                                                    </p>
                                                    <label className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                        Note per il commerciale (opzionale)
                                                    </label>
                                                    <textarea
                                                        value={currentProposalNote ?? ""}
                                                        onChange={(e) => onChangeProposalNote?.(e.target.value)}
                                                        rows={2}
                                                        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-[11px] text-neutral-800 dark:text-neutral-100 resize-none focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300 transition"
                                                        placeholder="Aggiungi una nota per spiegare la proposta di sostituzione..."
                                                    />
                                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-2">
                                                        La nota verrà salvata insieme alla controproposta quando invii la
                                                        proposta al commerciale.
                                                    </p>
                                                    <FDButton icon={<LuSendIcon />} variant="outline" size="sm" className="mt-2 float-right" onClick={sendProductNote} disabled={loading.add_product_note as boolean} loading={loading.add_product_note as boolean}
                                                        dataTooltipId="general-quotations-tooltip" dataTooltipContent="Invia solo la nota (le note verranno inviate, se compilate, anche nel momento in cui si compie l'azione)">
                                                        Invia la nota
                                                    </FDButton>
                                                </FDBox>
                                            )}

                                        {!isRefusedState && <CounterProposalSection
                                            proposals={controproposte}
                                            isBuyer={isBuyer}
                                            onPriceChange={onPriceChange}
                                            fetchProductDetails={handleOpenProductDetails}
                                            onSubmitProposal={onSubmitProposal}
                                            onOpenSubstitutionSearch={() => {
                                                onOpenSubstitutionSearch();
                                                setSecondaryOpen(true);
                                                setSubstitutionOpen(true);
                                            }}
                                            isTextRequest={isTextRequest}
                                            showBuyerActions={showBuyerActions}
                                            selectionEnabled={selectionRequired}
                                            selectedProposalId={selectedCounterProposal?._id ?? null}
                                            onSelectProposal={onSelectCounterProposal}
                                            isRefusedState={isRefusedState}
                                            isCompletedState={isCompletedState}
                                            currentState={stato}
                                        />}

                                        {/* AZIONI BUYER */}
                                        {(showBuyerActions && !hasActiveProposal) && (
                                            <BuyerActions
                                                document={product}
                                                isTextRequest={isTextRequest}
                                                onOpenSubstitutionSearch={() => {
                                                    onOpenSubstitutionSearch();
                                                    setSecondaryOpen(true);
                                                    setSubstitutionOpen(true);
                                                }}
                                                onPriceChange={onPriceChange}
                                                onDirectQuoteExpiryChange={onDirectQuoteExpiryChange}
                                                onSubmitPrice={onSubmitPrice}
                                                onRefuse={onRefuse}
                                                currentState={stato}
                                                buyerOptions={buyerOptions}
                                                assigningBuyer={assigningBuyer}
                                                onAssignBuyer={onAssignBuyer}
                                            />
                                        )}

                                        {/* AZIONI AGENTE */}
                                        {showAgentActions &&
                                            ![
                                                "ATTESA_VALUTAZIONE",
                                                "CONTROPROPOSTA_RICHIESTA",
                                                "CONTROPROPOSTA_ACCETTATA",
                                                "VALUTAZIONE_COMPLETATA",
                                            ].includes(stato) && (
                                                <AgentActions
                                                    mode={stato === "CONTROPROPOSTA_INVIATA" ? "COUNTER" : "PRICE"}
                                                    requireCounterProposalSelection={selectionRequired}
                                                    canAccept={canAcceptCounterProposal}
                                                    expiredValue={stato === "CONTROPROPOSTA_INVIATA" ? selectedCounterProposal?.quotazione?.scadenza ?? null : product?.quotazione?.scadenza ?? null}
                                                    expiredMessage={stato === "CONTROPROPOSTA_INVIATA"
                                                        ? "La controproposta selezionata è scaduta e non può essere accettata."
                                                        : "La quotazione del prodotto è scaduta: puoi rifiutarla o richiedere una nuova controproposta, ma non accettarla."}
                                                    selectedProposalLabel={selectedCounterProposal?.dettagli_prodotto?.descrizione ?? null}
                                                    onAccept={() =>
                                                        stato === "CONTROPROPOSTA_INVIATA" ? onAcceptProposal() : onAccept()
                                                    }
                                                    onRefuse={() =>
                                                        stato === "CONTROPROPOSTA_INVIATA" ? onRefuseProposal() : onRefuse()
                                                    }
                                                    onRequestCounter={onRequestCounter}
                                                    isRefusedState={isRefusedState}
                                                />
                                            )}

                                        {/* Storico eventi + Footer */}
                                        <RenderNoteHistory />
                                    </div>
                                </SidePanelShell>
                            </div>

                            {/* PANNELLO SECONDARIO */}
                            <AnimatePresence>
                                {secondaryOpen && (
                                    <div
                                        className={`absolute inset-y-0 right-0 z-30 pointer-events-auto transition-[width] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${substitutionOpen ? "w-full" : "w-[92%]"
                                            }`}
                                    >
                                        <SidePanelShell
                                            title="Dettagli avanzati / storico"
                                            animateVariant="visible"
                                            contentState="front"
                                            onClose={closeSecondaryPanel}
                                        >
                                            <div className="flex h-full flex-col xl:flex-row gap-4">
                                                {/* COLONNA DETTAGLI AVANZATI (sempre visibile) */}
                                                <div className="flex flex-col gap-4 xl:flex-[2]">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                            Vista approfondita per{" "}
                                                            <span className="font-medium text-neutral-800 dark:text-neutral-100">
                                                                valutazioni e operazioni
                                                            </span>
                                                        </p>
                                                    </div>

                                                    <AdvancedPanel
                                                        document={product}
                                                        proposals={controproposte}
                                                        isBuyer={isBuyer} isAdmin={CheckAdminDev}
                                                        isTextRequest={isTextRequest}
                                                        onChangeProposalQuantity={onChangeProposalQuantity}
                                                        onChangeProposalPrice={onChangeProposalPrice}
                                                        showBuyerActions={showBuyerActions}
                                                        getFilteredEventsForCurrentProduct={getFilteredEventsForCurrentProduct}
                                                        onSelectProduct={selectSubstitutionProductForCurrent}
                                                        onChangeProposalExpiry={onChangeProposalExpiry}
                                                        CommercialAlternativesSection={CommercialAlternativesSection}
                                                    />
                                                </div>

                                                {/* COLONNA RICERCA (solo quando substitutionOpen === true) */}
                                                {substitutionOpen && (
                                                    <div className="flex-1 min-w-0 min-h-[400px] xl:flex-[3]">
                                                        <ProductSubstitutionSearch
                                                            open={substitutionOpen}
                                                            onClose={() => setSubstitutionOpen(false)}
                                                            baseProductTitle={product.kind == "PRODUCT" ? ((product as CartProductDTO)?.dettagli_prodotto?.descrizione ??
                                                                (product as CartProductDTO)?.dettagli_prodotto?.codiceProduttore ?? "Prodotto") : "Richiesta Descrittiva"}
                                                            baseProductMeta={product.kind == "PRODUCT" ? `${(product as CartProductDTO).dettagli_prodotto.marca ?? ""} · 
                                                                ${(product as CartProductDTO).dettagli_prodotto?.codiceProduttore ?? ""}`.trim() : undefined}
                                                            query={searchQuery ?? ""}
                                                            onQueryChange={searchDebounced}
                                                            results={searchItems ?? []}
                                                            loading={loading}
                                                            mode={canManageCommercialAlternatives ? "COMMERCIAL_SUGGESTION" : "BUYER_COUNTERPROPOSAL"}
                                                            selectedIds={(canManageCommercialAlternatives ? commercialAlternativeSuggestions.map((item) => item.product_id ?? "") : controproposte.map((cp => cp.product_id ?? ""))) ?? []}
                                                            mapResultToView={(item: any) => ({
                                                                id:
                                                                    item._id ??
                                                                    item.id ??
                                                                    item.codice ??
                                                                    String(
                                                                        item.codiceProduttore ??
                                                                        Math.random()
                                                                    ),
                                                                title:
                                                                    item.descrizioneEstesa ??
                                                                    item.descrizione ??
                                                                    item.productName ??
                                                                    "Prodotto",
                                                                subtitle:
                                                                    item.marca ??
                                                                    item.brand ??
                                                                    undefined,
                                                                code:
                                                                    item.codiceProduttore ??
                                                                    item.sku ??
                                                                    undefined,
                                                                priceLabel:
                                                                    item.prezzoDealer ??
                                                                    item.prezzoFocelda ??
                                                                    item.priceLabel ??
                                                                    (item.price
                                                                        ? `${item.price} €`
                                                                        : undefined),
                                                                badge: item.isNew
                                                                    ? "Nuovo"
                                                                    : item.inPromo
                                                                        ? "Promo"
                                                                        : undefined,
                                                                thumbnailUrl:
                                                                    item.anteprima ??
                                                                    item.imageUrl ??
                                                                    item.pictureUrl ??
                                                                    undefined,
                                                            })}
                                                            onSelectProduct={(selected: CartProductDTO) => canManageCommercialAlternatives ?
                                                                toggleCommercialAlternativeForCurrent(selected as any) : selectSubstitutionProductForCurrent(selected as any)}
                                                            onOpenProductDetails={(selected) => {
                                                                const selectedProductId = String((selected as any)?._id ?? (selected as any)?.id ?? "").trim();
                                                                if (!selectedProductId) return;
                                                                handleOpenProductDetails(selectedProductId);
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </SidePanelShell>
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* PANNELLO TERZIARIO */}
                            <AnimatePresence>
                                {(isProductDetailsOpen && !isTextRequest) && (
                                    <div
                                        className={`absolute inset-y-0 right-0 z-30 pointer-events-auto transition-[width] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] 
                                            ${isWideLayout ? "w-[96%]" : "w-[92%]"}`}
                                    >
                                        {/* Pannello unico dettaglio+segnalazione:
                                            - default: scheda read-only
                                            - reportMode: form editabile con invio evento Mongo */}
                                        <ProductDetailsReporting
                                            onClose={handleCloseProductDetails}
                                            productId={selectedIdProduct}
                                            onReportProductAnomaly={onReportProductAnomaly}
                                            reportingAnomaly={reportingAnomaly}
                                            abortController={productDetailsAbortController}
                                        />
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
