/**
 * Public feature boundary for the MEPA Products tab.
 *
 * The Products feature is the heaviest workspace area because it renders
 * extracted requirements, catalog candidates, validation controls and product
 * side panels. Keeping a stable barrel export allows aggressive internal
 * optimization without breaking the workspace lazy-loader contract.
 */
export { ProductsTab } from "./ProductsTab";