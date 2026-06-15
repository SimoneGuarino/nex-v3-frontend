/**
 * Public feature boundary for the MEPA AI Chat tab.
 *
 * Keeping the export in a barrel file lets the workspace lazy-loader import the
 * feature through a stable module path (`../chat`) instead of depending on the
 * concrete file name. This is intentionally small, but important for long-term
 * refactors: the internal implementation of the chat tab can move without
 * changing every consumer.
 */
export { ChatTab } from "./ChatTab";