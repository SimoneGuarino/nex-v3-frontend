import React from "react";
import { Anagrafica } from "../sections/Anagrafica";
import { Backorders } from "../sections/Backorders";
import { Credit } from "../sections/Credit";
import { Fido } from "../sections/Fido";
import { Payments, type PaymentsFooterStats } from "../sections/Payments";
import { Profilazione } from "../sections/Profilazione";
import { Sconti } from "../sections/Sconti";
import { Statement } from "../sections/Statement";
import { CustomerNotesPanelContent } from "../../customerNotes/components/CustomerNotesPanelContent";
import { CustomersPanelSectionSkeleton } from "./CustomersPanelSectionSkeleton";
import type {
    AnyRecord,
    BackordersDetailsPayload,
    BackordersSummaryPayload,
    CustomerStatementPayload,
    DetailsSection,
    LoadingStates,
    PaymentsDetailsPayload,
    ScontiPayload,
} from "../types";

export type CustomersPanelDetailsContentProps = {
    activeSection: DetailsSection;
    loadingStates: LoadingStates;
    customerCode: string | number;
    anagrafica: AnyRecord | null;
    creditsProfile: AnyRecord | null;
    creditsYears: AnyRecord | null;
    profilazioneReport: AnyRecord | null;
    backordersSummary: BackordersSummaryPayload | null;
    backordersDetails: BackordersDetailsPayload | null;
    paymentsDetails: PaymentsDetailsPayload | null;
    sconti: ScontiPayload | null;
    statement: CustomerStatementPayload | null;
    paymentsReloadToken: number;
    onPaymentsLoadingChange?: (loading: boolean) => void;
    onPaymentsStatsChange?: (stats: PaymentsFooterStats) => void;
    onSaveProfilazione?: (payload: AnyRecord) => Promise<any> | any;
    userContext?: AnyRecord | null;
    onStatementChange?: (
        updater: (prev: CustomerStatementPayload | null) => CustomerStatementPayload | null
    ) => void;
};

// Fallback uniforme per section abilitate ma senza dati utili.
const SectionUnavailableCard: React.FC = () => (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-900/50 px-4 py-3">
        <p className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200">
            Sezione non disponibile
        </p>
        <p className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-400">
            Non hai accesso a questa sezione o non ci sono dati disponibili.
        </p>
    </div>
);

export const CustomersPanelDetailsContent: React.FC<CustomersPanelDetailsContentProps> = ({
    activeSection,
    loadingStates,
    customerCode,
    anagrafica,
    creditsProfile,
    creditsYears,
    profilazioneReport,
    backordersSummary,
    backordersDetails,
    paymentsDetails,
    sconti,
    statement,
    paymentsReloadToken,
    onPaymentsLoadingChange,
    onPaymentsStatsChange,
    onSaveProfilazione,
    userContext,
    onStatementChange,
}) => {
    /**
     * Router del contenuto details.
     *
     * Ogni nuovo valore di `DetailsSection` deve avere:
     * - il proprio case nel seguente switch
     * - il proprio metadata in `helpers/panelSections.ts`
     * - (se previsto) una card summary che richiami `onOpenDetails(...)`
     */
    switch (activeSection) {
        case "anagrafica":
            if (loadingStates.anagrafica) return <CustomersPanelSectionSkeleton />;
            return <Anagrafica mode="details" anagrafica={anagrafica} creditsProfile={creditsProfile} />;
        case "fido":
            if (loadingStates.credits) return <CustomersPanelSectionSkeleton />;
            return <Fido mode="details" creditsProfile={creditsProfile} />;
        case "credit":
            if (loadingStates.creditsYears) return <CustomersPanelSectionSkeleton />;
            return <Credit mode="details" creditsYears={creditsYears} />;
        case "statement":
            if (loadingStates.statement) return <CustomersPanelSectionSkeleton />;
            if (!statement) return <SectionUnavailableCard />;
            return (
                <Statement
                    mode="details"
                    customerCode={customerCode}
                    statement={statement}
                    onStatementChange={onStatementChange}
                />
            );
        case "backorders":
            if (loadingStates.backorders) return <CustomersPanelSectionSkeleton />;
            return (
                <Backorders
                    mode="details"
                    customerCode={customerCode}
                    summary={backordersSummary}
                    details={backordersDetails}
                />
            );
        case "payments":
            if (loadingStates.payments) return <CustomersPanelSectionSkeleton />;
            return (
                <Payments
                    mode="details"
                    customerCode={customerCode}
                    details={paymentsDetails}
                    reloadToken={paymentsReloadToken}
                    onLoadingChange={onPaymentsLoadingChange}
                    onStatsChange={onPaymentsStatsChange}
                />
            );
        case "profilazione":
            if (loadingStates.profilazione) return <CustomersPanelSectionSkeleton />;
            return (
                <Profilazione
                    mode="details"
                    report={profilazioneReport}
                    customerCode={customerCode}
                    onSave={onSaveProfilazione}
                />
            );
        case "sconti":
            if (loadingStates.sconti) return <CustomersPanelSectionSkeleton />;
            if (!sconti) return <SectionUnavailableCard />;
            return <Sconti mode="details" sconti={sconti} />;
        case "notes":
            return (
                <CustomerNotesPanelContent
                    customerCode={String(customerCode) || null}
                    queryBody={{ ccli: String(customerCode) }}
                    userContext={userContext ?? {}}
                    enabled={true}
                />
            );
        default:
            return null;
    }
};
