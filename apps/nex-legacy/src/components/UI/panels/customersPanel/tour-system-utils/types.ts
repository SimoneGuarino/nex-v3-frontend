/**
 * Tipi condivisi per il lock interazioni della CustomersPanel durante i tour.
 *
 * Nota:
 * - questi tipi vivono in una cartella utility dedicata per evitare di appesantire
 *   il componente principale con definizioni riusabili.
 * - la struttura è pensata per supportare più tour (quotazioni, clienti, ecc.).
 */

export type StepSelectorMatcher = string | RegExp;

export type CustomersPanelInteractionLockRule = {
    /**
     * Elenco selector step del tour a cui applicare questa regola.
     * Esempio: '[data-tour="scheda-cliente-fido"]'
     */
    stepSelectors: StepSelectorMatcher[];
    /**
     * Blocca le interazioni nel body dei pannelli (summary/details).
     * Default: true quando la regola è attiva.
     */
    lockBodyInteractions?: boolean;
    /**
     * Disabilita la X di chiusura del pannello principale.
     * Default: true quando la regola è attiva.
     */
    disablePrimaryClose?: boolean;
    /**
     * Blocca chiusura via click backdrop.
     * Default: true quando la regola è attiva.
     */
    blockBackdropClose?: boolean;
    /**
     * Blocca chiusura via ESC.
     * Default: true quando la regola è attiva.
     */
    blockEscClose?: boolean;
};

export type CustomersPanelInteractionLockConfig = {
    enabled?: boolean;
    /**
     * Mappa `tourKey -> regole`.
     * La `tourKey` è la stessa usata nel registry tour centrale.
     */
    byTourKey: Record<string, CustomersPanelInteractionLockRule[]>;
};

