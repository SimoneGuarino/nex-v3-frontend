/**
 * Public feature boundary for the MEPA Dossier AI tab.
 *
 * The dossier tab is a read-model consumer: it should receive already prepared
 * data from the controller and render it without owning transport, polling or
 * orchestration logic. This barrel keeps that boundary explicit for future
 * maintainers.
 */
export { DossierTab } from "./DossierTab";