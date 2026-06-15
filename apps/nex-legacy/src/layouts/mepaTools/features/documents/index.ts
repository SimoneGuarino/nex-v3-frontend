/**
 * Public feature boundary for the MEPA Documents tab.
 *
 * The workspace loader imports this directory as a lazy chunk. Exposing only the
 * tab component here keeps document-specific implementation details private to
 * the feature folder and prevents accidental cross-feature coupling.
 */
export { DocumentsTab } from "./DocumentsTab";