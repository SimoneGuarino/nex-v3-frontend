/**
 * Public feature boundary for the MEPA Overview tab.
 *
 * Overview is the dashboard entry point of the workspace: it must remain fast,
 * bounded in height and focused on summary read models. Consumers should import
 * the tab through this boundary instead of reaching into its internal helpers.
 */
export { OverviewTab } from "./OverviewTab";