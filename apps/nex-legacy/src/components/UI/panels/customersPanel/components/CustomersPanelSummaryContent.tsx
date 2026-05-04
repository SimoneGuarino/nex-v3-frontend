import React from "react";
import { Anagrafica } from "../sections/Anagrafica";
import { Backorders } from "../sections/Backorders";
import { Credit } from "../sections/Credit";
import { Fido } from "../sections/Fido";
import { Payments } from "../sections/Payments";
import { Profilazione } from "../sections/Profilazione";
import { Sconti } from "../sections/Sconti";
import { Trackings } from "../sections/Trackings";
import { CustomerPurchasesSummary } from "../sections/CustomerPurchasesSummary";
import { CustomerQuotesSummary } from "../sections/CustomerQuotesSummary";
import { CustomersPanelSectionSkeleton } from "./CustomersPanelSectionSkeleton";
import type {
    AnyRecord,
    CustomerFullPayload,
    DetailsSection,
    LoadingStates,
    SectionFetchStates,
} from "../types";

// Config runtime di una card nel pannello summary.
// `content === null` significa "non renderizzare la card" (es. sezione non autorizzata/non disponibile).
type SummarySectionConfig = {
    key: string;
    loading: boolean;
    content: React.ReactNode | null;
};

export type CustomersPanelSummaryContentProps = {
    loading: boolean;
    hasErr: boolean;
    loadingStates: LoadingStates;
    sectionFetchStates: SectionFetchStates;
    data: CustomerFullPayload;
    customerCode: string | number;
    anagrafica: AnyRecord | null;
    creditsProfile: AnyRecord | null;
    creditsYears: AnyRecord | null;
    profilazioneReport: AnyRecord | null;
    onOpenDetails: (section: DetailsSection) => void;
};

export const CustomersPanelSummaryContent: React.FC<CustomersPanelSummaryContentProps> = ({
    loading,
    hasErr,
    loadingStates,
    sectionFetchStates,
    data,
    customerCode,
    anagrafica,
    creditsProfile,
    creditsYears,
    profilazioneReport,
    onOpenDetails,
}) => {
    const emptyScontiPayload = React.useMemo(
        () => ({
            total: 0,
            cliente: { total: 0, items: [] },
            categoria: { total: 0, items: [] },
        }),
        []
    );

    const canShowSection = React.useCallback(
        // Le section vengono mostrate solo quando la fetch dedicata va in success.
        // In caso di error, la card viene nascosta senza rompere il layout generale.
        (section: keyof SectionFetchStates) => sectionFetchStates[section] === "success",
        [sectionFetchStates]
    );

    /**
     * Registro dichiarativo delle section summary.
     *
     * Per aggiungere una nuova section:
     * 1) aggiungi una entry con `key`, `loading`, `content`
     * 2) usa la loading key corretta da `LoadingStates`
     * 3) usa `canShowSection(...)` per rispettare il fetch-state
     * 4) se la section apre il pannello details, collega `onOpenDetails("nome-section")`
     */
    const sections: SummarySectionConfig[] = [
        {   //anagrafica
            key: "anagrafica",
            loading: loadingStates.anagrafica,
            content: canShowSection("anagrafica") ? (
                <Anagrafica
                    mode="summary"
                    anagrafica={anagrafica}
                    creditsProfile={creditsProfile}
                    onOpenDetails={() => onOpenDetails("anagrafica")}
                />
            ) : null,
        },
        {   //profilazione
            key: "profilazione",
            loading: loadingStates.profilazione,
            content: canShowSection("profilazione") ? (
                <Profilazione
                    mode="summary"
                    report={profilazioneReport}
                    customerCode={customerCode}
                    onOpenDetails={() => onOpenDetails("profilazione")}
                />
            ) : null,
        },
        {   //fido
            key: "fido",
            loading: loadingStates.credits,
            content: canShowSection("credits") ? (
                <Fido
                    mode="summary"
                    creditsProfile={creditsProfile}
                    onOpenDetails={() => onOpenDetails("fido")}
                />
            ) : null,
        },
        {   //dati creditizi
            key: "credit",
            loading: loadingStates.creditsYears,
            content: canShowSection("creditsYears") ? (
                <Credit
                    mode="summary"
                    creditsYears={creditsYears}
                    onOpenDetails={() => onOpenDetails("credit")}
                />
            ) : null,
        },
        {   //sconti
            key: "sconti",
            loading: loadingStates.sconti,
            content: canShowSection("sconti") ? (
                <Sconti
                    mode="summary"
                    sconti={data.sconti ?? emptyScontiPayload}
                    onOpenDetails={() => onOpenDetails("sconti")}
                />
            ) : null
        },
        {   //backorders
            key: "backorders",
            loading: loadingStates.backorders,
            content: canShowSection("backorders") ? (
                <Backorders
                    mode="summary"
                    customerCode={customerCode}
                    summary={data.backordersSummary}
                    details={data.backordersDetails}
                    onOpenDetails={() => onOpenDetails("backorders")}
                />
            ) : null,
        },
        {   //preventivi
            key: "quotes",
            loading: loadingStates.quotes,
            content: canShowSection("quotes") ? (
                <CustomerQuotesSummary
                    customerCode={String(customerCode ?? "").trim()}
                    quotes={data.quotesSummary ?? { total: 0, items: [] }}
                />
            ) : null,
        },
        {   //acquisti cliente
            key: "purchases",
            loading: loadingStates.purchases,
            content: canShowSection("purchases") ? (
                <CustomerPurchasesSummary
                    customerCode={String(customerCode ?? "").trim()}
                    customerName={String(anagrafica?.RAGIONE_SOCIALE ?? "")}
                    purchases={data.purchasesSummary ?? { total: 0, items: [] }}
                />
            ) : null,
        },
        {   //pagamenti
            key: "payments",
            loading: loadingStates.payments,
            content: canShowSection("payments") ? (
                <Payments
                    mode="summary"
                    customerCode={customerCode}
                    details={data.paymentsDetails}
                    onOpenDetails={() => onOpenDetails("payments")}
                />
            ) : null,
        },
        {   //trackings
            key: "trackings",
            loading: loadingStates.trackings,
            content: canShowSection("trackings") ? (
                <Trackings
                    mode="summary"
                    customerCode={customerCode}
                    details={data.trackingDetails}
                />
            ) : null,
        }

    ];

    const hasSectionsLoading = sections.some((section) => section.loading);
    const visibleSectionsCount = sections.filter((section) => !section.loading && Boolean(section.content)).length;

    return (
        <div className="h-full w-full flex flex-col gap-3">
            {sections.map((section) =>
                section.loading ? (
                    <CustomersPanelSectionSkeleton key={`${section.key}-loading`} />
                ) : section.content ? (
                    <React.Fragment key={section.key}>{section.content}</React.Fragment>
                ) : null
            )}

            {!loading && !hasErr && !hasSectionsLoading && visibleSectionsCount === 0 && (
                <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-900/50 px-4 py-3">
                    <p className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200">
                        Nessuna sezione disponibile
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                        I dati non sono accessibili o non presenti per questo cliente.
                    </p>
                </div>
            )}

            {!loading && hasErr && (
                <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-3">
                    <p className="text-[12px] font-semibold text-rose-800 dark:text-rose-200">
                        Si e verificato un problema nel caricamento
                    </p>
                    <p className="mt-1 text-[11px] text-rose-700/80 dark:text-rose-200/80">
                        Controlla la console e/o i messaggi di sistema per i dettagli.
                    </p>
                </div>
            )}
        </div>
    );
};
