import type { CustomersPanelInteractionLockConfig } from "components/UI/panels/customersPanel/tour-system-utils/types";
import {
    CUSTOMER_PANEL_CLOSE_STEP_SELECTOR,
    CUSTOMER_PANEL_CONTENT_STEP_SELECTORS,
} from "components/UI/panels/customersPanel/tour-system-utils/tours";

/**
 * Config lock per la scheda cliente nel tour "quotazioni".
 *
 * Usiamo selector step (non indici) per avere una configurazione robusta
 * a riordini/aggiunte step e riutilizzabile nel tempo.
 */
export const quotazioniCustomerPanelInteractionLockConfig: CustomersPanelInteractionLockConfig = {
    enabled: true,
    byTourKey: {
        quotazioni: [
            {
                // Durante gli step contenuto scheda cliente blocchiamo interazioni interne e chiusure accidentali.
                // Reuse diretto dei selector condivisi con il registry step.
                // In questo modo lock e tour restano sempre coerenti.
                stepSelectors: CUSTOMER_PANEL_CONTENT_STEP_SELECTORS,
                lockBodyInteractions: true,
                disablePrimaryClose: true,
                blockBackdropClose: true,
                blockEscClose: true,
            },
            {
                // Step di chiusura: manteniamo lock sul body ma abilitiamo la X.
                stepSelectors: [CUSTOMER_PANEL_CLOSE_STEP_SELECTOR],
                lockBodyInteractions: true,
                disablePrimaryClose: false,
                blockBackdropClose: true,
                blockEscClose: true,
            },
        ],
    },
};

