import type { DetailsSection } from "../types";

export type DetailsPanelMeta = {
    title: string;
    bodyScrollable: boolean;
    bodyClassName?: string;
};

/**
 * Mappa unica dei metadati del pannello secondario (details).
 *
 * Quando aggiungi una nuova `DetailsSection`, registra qui:
 * - titolo header
 * - comportamento scroll body
 * - eventuali classi body dedicate
 *
 * Nota: questa funzione non decide *cosa* renderizzare nella section.
 * Quello e gestito da `CustomersPanelDetailsContent`.
 */
export function getDetailsPanelMeta(
    section: DetailsSection,
    customerTitle: string
): DetailsPanelMeta {
    switch (section) {
        case "anagrafica":
            return { title: "dettagli anagrafica", bodyScrollable: true };
        case "fido":
            return { title: "dettagli fido", bodyScrollable: true };
        case "credit":
            return { title: "dettagli dati creditizi", bodyScrollable: true };
        case "backorders":
            return { title: "dettagli backorders", bodyScrollable: true };
        case "payments":
            return {
                title: `dettagli pagamenti per ${customerTitle}`,
                bodyScrollable: false,
                bodyClassName: "px-0 py-0",
            };
        case "profilazione":
            return { title: "dettagli profilazione", bodyScrollable: true };
        case "sconti":
            return { title: "dettagli sconti", bodyScrollable: true };
        case "notes":
            return { title: `note - ${customerTitle}`, bodyScrollable: true };
        default:
            return { title: "dettagli", bodyScrollable: true };
    }
}
