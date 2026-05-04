import React from "react";
import { SectionPill } from "./sectionUi";

type CustomersPanelTitleProps = {
    customerTitle: string;
    loading: boolean;
    hasErr: boolean;
    hasAnagrafica: boolean;
};

// Stato sintetico del pannello in header (loading/error/accesso dati).
export const CustomersPanelTitle: React.FC<CustomersPanelTitleProps> = ({
    customerTitle,
    loading,
    hasErr,
    hasAnagrafica,
}) => (
    <div className="flex items-center gap-2">
        <span className="font-semibold">{customerTitle}</span>
        {loading ? (
            <SectionPill>Caricamento...</SectionPill>
        ) : hasErr ? (
            <SectionPill tone="warn">Errore</SectionPill>
        ) : hasAnagrafica ? (
            <SectionPill tone="ok">Autorizzato</SectionPill>
        ) : (
            <SectionPill tone="warn">Non disponibile</SectionPill>
        )}
    </div>
);
