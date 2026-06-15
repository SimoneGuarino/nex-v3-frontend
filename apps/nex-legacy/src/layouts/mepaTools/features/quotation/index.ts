/**
 * Public feature boundary for the MEPA Quotation tab.
 *
 * The quotation area is intentionally isolated from the rest of the tender AI
 * workflow so it can evolve into a dedicated commercial flow without coupling
 * document analysis, product extraction or RAG concerns to quotation rendering.
 */
export { QuotationTab } from "./QuotationTab";
