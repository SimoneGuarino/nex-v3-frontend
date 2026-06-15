/**
 * Public feature boundary for the MEPA Observability tab.
 *
 * Observability contains diagnostic views for Vespa, embeddings, RAG stats and
 * indexing jobs. It is intentionally lazy-loaded because it is useful to power
 * users and IT, but not required for the first meaningful render of a tender.
 */
export { ObservabilityTab } from "./ObservabilityTab";